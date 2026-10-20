import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST as liveTokenRoute } from "../app/api/gemini/live-token/route";

describe("Gemini Live Session & Token Management", () => {
  it("returns demo payload when demo mode is active and no key is configured", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await liveTokenRoute();
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.demo, true);
    assert.equal(body.model, "gemini-3.5-transcribe-live");
  });

  it("returns 400 error when not in demo mode and no key is configured", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await liveTokenRoute();
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.ok(body.error.includes("Google API key is not configured"));
  });

  it("never exposes the API key in client responses", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const res = await liveTokenRoute();
    const body = await res.json();
    const bodyStr = JSON.stringify(body);

    assert.ok(!bodyStr.includes("AIzaSy"));
    assert.ok(!bodyStr.includes("sk-"));
  });
});
