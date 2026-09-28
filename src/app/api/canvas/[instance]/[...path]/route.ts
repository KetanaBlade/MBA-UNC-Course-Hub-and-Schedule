import { NextRequest, NextResponse } from "next/server";

const ALLOWED_INSTANCES: Record<string, string> = {
  digitalcampus: "digitalcampus.instructure.com",
  "kenan-flagler": "kenan-flagler.instructure.com",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ instance: string; path: string[] }> }
) {
  return handleProxy(request, context, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ instance: string; path: string[] }> }
) {
  return handleProxy(request, context, "POST");
}

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ instance: string; path: string[] }> },
  method: "GET" | "POST"
) {
  const { instance, path } = await context.params;
  const targetHost = ALLOWED_INSTANCES[instance];

  if (!targetHost) {
    return NextResponse.json(
      {
        error: `Invalid Canvas instance '${instance}'. Allowed instances are 'digitalcampus' and 'kenan-flagler'.`,
      },
      { status: 400 }
    );
  }

  const canvasToken = request.headers.get("x-canvas-token");
  if (!canvasToken) {
    return NextResponse.json(
      {
        error: "Missing 'X-Canvas-Token' header. Please configure your personal access token in settings.",
      },
      { status: 401 }
    );
  }

  // Construct Canvas API endpoint URL
  const searchParams = request.nextUrl.searchParams.toString();
  const apiPath = path.join("/");
  const targetUrl = `https://${targetHost}/api/v1/${apiPath}${
    searchParams ? `?${searchParams}` : ""
  }`;

  try {
    const fetchHeaders: HeadersInit = {
      Authorization: `Bearer ${canvasToken.trim()}`,
      Accept: "application/json",
      "User-Agent": "UNCMBAHub/1.0",
    };

    let body: BodyInit | undefined = undefined;
    if (method === "POST") {
      const contentType = request.headers.get("content-type");
      if (contentType) {
        fetchHeaders["Content-Type"] = contentType;
      }
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method,
      headers: fetchHeaders,
      body,
      cache: "no-store",
    });

    const data = await response.text();
    if (apiPath.includes("calendar_events")) {
      console.log(`[PROXY CALENDAR_EVENTS] status=${response.status} length=${data.length}`);
      console.log(`[PROXY CALENDAR_EVENTS DATA]: ${data.slice(0, 1000)}`);
    }
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/json");

    // Pass through pagination link headers if provided by Canvas
    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      responseHeaders.set("Link", linkHeader);
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy request failed";
    return NextResponse.json(
      { error: "Failed to connect to Canvas server", details: message },
      { status: 502 }
    );
  }
}
