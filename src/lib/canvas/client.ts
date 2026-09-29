import {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasFile,
  CanvasFolder,
  CanvasInstance,
  CanvasModule,
} from "./types";

/**
 * Parses the 'Link' response header to extract the next page URL (rel="next").
 */
function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const urlMatch = part.match(/<([^>]+)>/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    const rest = part.slice(urlMatch[0].length);
    if (/\brel\s*=\s*["']?next["']?/i.test(rest)) {
      return url;
    }
  }
  return null;
}

/**
 * Resolves a next page URL so that proxied Canvas requests stay routed through the proxy.
 */
function resolveNextUrl(nextUrl: string, initialUrl: string): string {
  const proxyMatch = initialUrl.match(/\/api\/canvas\/([^/?#]+)/);
  if (proxyMatch && nextUrl.includes("/api/v1/")) {
    const instance = proxyMatch[1];
    const pathAndQuery = nextUrl.substring(
      nextUrl.indexOf("/api/v1/") + "/api/v1/".length
    );
    if (initialUrl.startsWith("http://") || initialUrl.startsWith("https://")) {
      const urlObj = new URL(initialUrl);
      return `${urlObj.origin}/api/canvas/${instance}/${pathAndQuery}`;
    }
    return `/api/canvas/${instance}/${pathAndQuery}`;
  }
  return nextUrl;
}

/**
 * Wrapper around fetch that retries on rate limits (403 with X-Rate-Limit-Remaining: 0)
 * and 5xx server errors with exponential backoff (2^attempt * 1000ms + random jitter up to 500ms).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(input, init);

    const rateLimitHeader =
      response.headers.get("x-rate-limit-remaining") ??
      response.headers.get("X-Rate-Limit-Remaining");
    const trimmedRateLimit = rateLimitHeader?.trim();
    const isRateLimited =
      response.status === 403 &&
      (trimmedRateLimit === "0" || trimmedRateLimit === "0.0");
    const isServerError = response.status >= 500 && response.status <= 599;

    if ((isRateLimited || isServerError) && attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }

  return fetch(input, init);
}

/**
 * Generic helper that fetches all pages of a paginated Canvas API endpoint
 * by following the 'Link' response header (rel="next") and returns the combined array.
 */
export async function fetchAllPages<T = any>(
  url: string | URL,
  options?: RequestInit
): Promise<T extends (infer U)[] ? U[] : T[]> {
  const combined: any[] = [];
  const initialUrlStr = url.toString();
  let currentUrl: string | null = initialUrlStr;
  const visitedUrls = new Set<string>();

  while (currentUrl && !visitedUrls.has(currentUrl)) {
    visitedUrls.add(currentUrl);
    const res = await fetchWithRetry(currentUrl, options);

    if (!res.ok) {
      let errorMsg = `Canvas API error (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
        if (errJson.errors && Array.isArray(errJson.errors)) {
          errorMsg = errJson.errors
            .map((e: { message?: string }) => e.message || e)
            .join(", ");
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      combined.push(...data);
    } else if (data !== undefined && data !== null) {
      combined.push(data);
    }

    const nextLink = parseNextLink(
      res.headers.get("link") || res.headers.get("Link")
    );
    if (nextLink) {
      currentUrl = resolveNextUrl(nextLink, initialUrlStr);
    } else {
      currentUrl = null;
    }
  }

  return combined as any;
}

export class CanvasApiClient {
  private instance: CanvasInstance;
  private token: string;

  constructor(instance: CanvasInstance, token: string) {
    this.instance = instance;
    this.token = token.trim();
  }

  private buildUrl(endpoint: string, params?: Record<string, string | string[]>): URL {
    const baseOrigin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const url = new URL(`/api/canvas/${this.instance}/${endpoint}`, baseOrigin);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, val);
        }
      });
    }
    return url;
  }

  private async request<T>(endpoint: string, params?: Record<string, string | string[]>): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    const res = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      let errorMsg = `Canvas API error (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
        if (errJson.errors && Array.isArray(errJson.errors)) {
          errorMsg = errJson.errors.map((e: { message?: string }) => e.message || e).join(", ");
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Validates the student token by fetching self profile
   */
  async validateToken(): Promise<{ id: number; name: string; primary_email?: string }> {
    return this.request("users/self");
  }

  /**
   * Fetches active enrolled courses for the student
   */
  async getCourses(): Promise<CanvasCourse[]> {
    const url = this.buildUrl("courses", {
      enrollment_state: "active",
      "include[]": "term",
      per_page: "50",
    });
    const courses = await fetchAllPages<CanvasCourse>(url.toString(), {
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });

    // Tag each course with the originating instance
    return (courses || [])
      .filter((c) => c.name && !c.name.toLowerCase().includes("sandbox"))
      .map((c) => ({
        ...c,
        instance: this.instance,
      }));
  }

  /**
   * Fetches recent announcements across specified courses
   */
  async getAnnouncements(courseIds: number[]): Promise<CanvasAnnouncement[]> {
    if (!courseIds.length) return [];
    const url = this.buildUrl("announcements", {
      "context_codes[]": courseIds.map((id) => `course_${id}`),
      per_page: "50",
    });

    // Direct endpoint fetch through proxy
    try {
      return await fetchAllPages<CanvasAnnouncement>(url.toString(), {
        headers: {
          "x-canvas-token": this.token,
          Accept: "application/json",
        },
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetches all modules and module items for a course
   */
  async getModules(courseId: number): Promise<CanvasModule[]> {
    const url = this.buildUrl(`courses/${courseId}/modules`, {
      "include[]": ["items", "content_details"],
      per_page: "50",
    });
    return fetchAllPages<CanvasModule>(url.toString(), {
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });
  }

  /**
   * Fetches assignments for a course with student submission state
   */
  async getAssignments(courseId: number): Promise<CanvasAssignment[]> {
    const url = this.buildUrl(`courses/${courseId}/assignments`, {
      "include[]": "submission",
      order_by: "due_at",
      per_page: "100",
    });
    return fetchAllPages<CanvasAssignment>(url.toString(), {
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });
  }

  /**
   * Fetches all file folders for a course (to discover buried Week 1, Week 2 folders)
   */
  async getFolders(courseId: number): Promise<CanvasFolder[]> {
    const url = this.buildUrl(`courses/${courseId}/folders`, {
      per_page: "100",
    });
    return fetchAllPages<CanvasFolder>(url.toString(), {
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });
  }

  /**
   * Fetches files within a specific folder
   */
  async getFolderFiles(folderId: number): Promise<CanvasFile[]> {
    const url = this.buildUrl(`folders/${folderId}/files`, {
      per_page: "100",
    });
    return fetchAllPages<CanvasFile>(url.toString(), {
      headers: {
        "x-canvas-token": this.token,
        Accept: "application/json",
      },
    });
  }

  /**
   * Fetches calendar events and upcoming live sessions
   */
  async getCalendarEvents(courseIds?: number[]): Promise<CanvasCalendarEvent[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 days back (term start)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180); // 180 days forward (full term & finals)

    const allEvents: CanvasCalendarEvent[] = [];
    const seenIds = new Set<number>();

    // 1. Fetch all events across the student's entire calendar (includes sections, personal, and enrolled courses)
    try {
      const userEventsUrl = this.buildUrl("calendar_events", {
        all_events: "true",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        per_page: "100",
      });
      const userEvents = await fetchAllPages<CanvasCalendarEvent>(userEventsUrl.toString(), {
        headers: {
          "x-canvas-token": this.token,
          Accept: "application/json",
        },
      });
      if (Array.isArray(userEvents)) {
        userEvents.forEach((ev) => {
          if (ev.id && !seenIds.has(ev.id)) {
            seenIds.add(ev.id);
            allEvents.push(ev);
          }
        });
      }
    } catch (err) {
      console.warn("Global calendar_events query failed:", err);
    }

    // 2. Also fetch with explicit context codes if provided to guarantee course-specific calendar items
    if (courseIds && courseIds.length > 0) {
      try {
        const courseEventsUrl = this.buildUrl("calendar_events", {
          all_events: "true",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          per_page: "100",
          "context_codes[]": courseIds.map((id) => `course_${id}`),
        });
        const courseEvents = await fetchAllPages<CanvasCalendarEvent>(courseEventsUrl.toString(), {
          headers: {
            "x-canvas-token": this.token,
            Accept: "application/json",
          },
        });
        if (Array.isArray(courseEvents)) {
          courseEvents.forEach((ev) => {
            if (ev.id && !seenIds.has(ev.id)) {
              seenIds.add(ev.id);
              allEvents.push(ev);
            }
          });
        }
      } catch (err) {
        console.warn("Context-coded calendar_events query failed:", err);
      }
    }

    return allEvents;
  }

  /**
   * Marks a module item as done or undone in Canvas.
   * Canvas API endpoint:
   *   PUT /api/v1/courses/:course_id/modules/:module_id/items/:id/done
   *   DELETE /api/v1/courses/:course_id/modules/:module_id/items/:id/done
   */
  async markModuleItemDone(
    courseId: number,
    moduleId: number,
    itemId: number,
    isDone: boolean
  ): Promise<boolean> {
    try {
      const url = new URL(
        `/api/canvas/${this.instance}/courses/${courseId}/modules/${moduleId}/items/${itemId}/done`,
        window.location.origin
      );
      const res = await fetch(url.toString(), {
        method: isDone ? "PUT" : "DELETE",
        headers: {
          "x-canvas-token": this.token,
          Accept: "application/json",
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Marks a module item as read in Canvas.
   * Canvas API endpoint: POST /api/v1/courses/:course_id/modules/:module_id/items/:id/mark_read
   */
  async markModuleItemRead(
    courseId: number,
    moduleId: number,
    itemId: number
  ): Promise<boolean> {
    try {
      const url = new URL(
        `/api/canvas/${this.instance}/courses/${courseId}/modules/${moduleId}/items/${itemId}/mark_read`,
        window.location.origin
      );
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "x-canvas-token": this.token,
          Accept: "application/json",
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
