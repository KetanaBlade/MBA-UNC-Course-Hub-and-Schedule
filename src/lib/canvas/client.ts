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

export class CanvasApiClient {
  private instance: CanvasInstance;
  private token: string;

  constructor(instance: CanvasInstance, token: string) {
    this.instance = instance;
    this.token = token.trim();
  }

  private async request<T>(endpoint: string, params?: Record<string, string | string[]>): Promise<T> {
    const url = new URL(`/api/canvas/${this.instance}/${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, val);
        }
      });
    }

    const res = await fetch(url.toString(), {
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
    const courses = await this.request<CanvasCourse[]>("courses", {
      enrollment_state: "active",
      "include[]": "term",
      per_page: "50",
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
    const contextCodes = courseIds.map((id) => `course_${id}`).join("&context_codes[]=");
    const endpoint = `announcements?context_codes[]=${contextCodes}&per_page=50`;

    // Direct endpoint fetch through proxy
    const res = await fetch(`/api/canvas/${this.instance}/${endpoint}`, {
      headers: { "x-canvas-token": this.token },
    });
    if (!res.ok) return [];
    return res.json();
  }

  /**
   * Fetches all modules and module items for a course
   */
  async getModules(courseId: number): Promise<CanvasModule[]> {
    return this.request<CanvasModule[]>(`courses/${courseId}/modules`, {
      "include[]": ["items", "content_details"],
      per_page: "50",
    });
  }

  /**
   * Fetches assignments for a course with student submission state
   */
  async getAssignments(courseId: number): Promise<CanvasAssignment[]> {
    return this.request<CanvasAssignment[]>(`courses/${courseId}/assignments`, {
      "include[]": "submission",
      order_by: "due_at",
      per_page: "100",
    });
  }

  /**
   * Fetches all file folders for a course (to discover buried Week 1, Week 2 folders)
   */
  async getFolders(courseId: number): Promise<CanvasFolder[]> {
    return this.request<CanvasFolder[]>(`courses/${courseId}/folders`, {
      per_page: "100",
    });
  }

  /**
   * Fetches files within a specific folder
   */
  async getFolderFiles(folderId: number): Promise<CanvasFile[]> {
    return this.request<CanvasFile[]>(`folders/${folderId}/files`, {
      per_page: "100",
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
      const userEvents = await this.request<CanvasCalendarEvent[]>("calendar_events", {
        all_events: "true",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        per_page: "100",
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
        const courseEvents = await this.request<CanvasCalendarEvent[]>("calendar_events", {
          all_events: "true",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          per_page: "100",
          "context_codes[]": courseIds.map((id) => `course_${id}`),
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
}
