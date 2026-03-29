import { NextRequest, NextResponse } from "next/server";
import { getRecordingById } from "@/lib/storage";

export const runtime = "nodejs";

const PING_INTERVAL_MS = 5000;
const STATUS_INTERVAL_MS = 2000;

function toSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let statusTimer: ReturnType<typeof setInterval> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let ttlTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    closed = true;
    if (statusTimer) clearInterval(statusTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (ttlTimer) clearTimeout(ttlTimer);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastPayload = JSON.stringify(recording);

      const enqueue = (chunk: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(chunk));
      };

      enqueue(toSseEvent("recording", recording));

      statusTimer = setInterval(async () => {
        try {
          const latest = await getRecordingById(id);
          if (!latest) {
            enqueue(toSseEvent("error", { message: "Recording not found" }));
            cleanup();
            controller.close();
            return;
          }

          const serialized = JSON.stringify(latest);
          if (serialized !== lastPayload) {
            lastPayload = serialized;
            enqueue(toSseEvent("recording", latest));
          }

          if (["completed", "error"].includes(latest.status)) {
            enqueue(toSseEvent("complete", { status: latest.status }));
            cleanup();
            controller.close();
          }
        } catch (error) {
          enqueue(
            toSseEvent("error", {
              message: error instanceof Error ? error.message : "Event stream failed",
            })
          );
        }
      }, STATUS_INTERVAL_MS);

      pingTimer = setInterval(() => {
        enqueue(toSseEvent("ping", { ts: Date.now() }));
      }, PING_INTERVAL_MS);

      // Close idle stream after 90 seconds; client can reconnect if needed.
      ttlTimer = setTimeout(() => {
        if (closed) return;
        cleanup();
        controller.close();
      }, 90_000);

      controller.enqueue(encoder.encode(`: connected\n\n`));
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
