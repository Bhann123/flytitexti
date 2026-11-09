import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_INPUT } from "@/lib/note/samples";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status?: number;
  }
  class Anthropic {
    static APIError = APIError;
    static AuthenticationError = class extends APIError {};
    static RateLimitError = class extends APIError {};
    static APIConnectionError = class extends APIError {};
    static APIConnectionTimeoutError = class extends APIError {};
    messages = { create: createMock };
  }
  return { default: Anthropic };
});

const { POST } = await import("@/app/api/draft/route");

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function claudeReply(payload: unknown) {
  return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(payload) }] };
}

beforeEach(() => {
  createMock.mockReset();
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/draft", () => {
  it("builds a local draft without calling Claude", async () => {
    const res = await post({ ...SAMPLE_INPUT, engine: "local" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const data = await res.json();
    expect(data.engine).toBe("local");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects empty input", async () => {
    const res = await post({ freeNotes: "  ", engine: "local" });
    expect(res.status).toBe(400);
  });

  it("refuses to send to Claude without explicit consent", async () => {
    const res = await post({ ...SAMPLE_INPUT, engine: "claude", thirdPartyConsent: false });
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("refuses to send direct identifiers to Claude", async () => {
    const res = await post({ freeNotes: "barn kt. 010125-1239", engine: "claude", thirdPartyConsent: true });
    expect(res.status).toBe(422);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 503 when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ ...SAMPLE_INPUT, engine: "claude", thirdPartyConsent: true });
    expect(res.status).toBe(503);
  });

  it("renders Claude output and warns about numbers absent from the notes", async () => {
    createMock.mockResolvedValue(
      claudeReply({
        sections: [
          { heading: "S – Huglægar upplýsingar", text: "Móðir segir brjóstagjöf ganga vel." },
          { heading: "O – Hlutlægar upplýsingar", text: "Þyngd 4.900 g." },
          { heading: "A – Mat", text: "Ekki gefið upp." },
          { heading: "P – Áætlun", text: "3 mánaða skoðun." },
        ],
        missing: ["Mat hjúkrunarfræðings"],
        questions: [],
      }),
    );
    const res = await post({ ...SAMPLE_INPUT, engine: "claude", thirdPartyConsent: true });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.draft).toContain("A – Mat\nEkki gefið upp.");
    expect(data.warnings.join(" ")).toContain("4.900");
    const sent = createMock.mock.calls[0][0];
    expect(sent.messages[0].content).toContain("<inntak>");
  });

  it("reports malformed Claude output as an error", async () => {
    createMock.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "ekki json" }] });
    const res = await post({ ...SAMPLE_INPUT, engine: "claude", thirdPartyConsent: true });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/röngu sniði/);
  });
});
