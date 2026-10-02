import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { message, responseId, fileIds = [] } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return Response.json({ error: "A message is required." }, { status: 400 });
    }
    if (!Array.isArray(fileIds) || fileIds.some(id => typeof id !== "string" || !id.startsWith("file-"))) {
      return Response.json({ error: "Invalid research file IDs. Please upload the files again." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Insights are temporarily unavailable." }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const events = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "You are Discovr, a product discovery assistant. Help analyse the supplied strategy, metrics, and research. Distinguish evidence from assumptions, identify gaps, and propose practical experiments. Do not invent research findings. Use British English and Oxford commas.",
      previous_response_id: typeof responseId === "string" && responseId.startsWith("resp_") ? responseId : undefined,
      input: [{ role: "user", content: [
        { type: "input_text", text: message },
        ...fileIds.map((id: string) => ({ type: "input_file" as const, file_id: id })),
      ] }],
      max_output_tokens: 1800,
      stream: true,
    });
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        let completed = false;
        try {
          for await (const event of events) {
            if (event.type === "response.output_text.delta") send({ text: event.delta });
            if (event.type === "response.completed") {
              completed = true;
              send({ responseId: event.response.id, done: true });
            }
            if (event.type === "response.failed" || event.type === "response.incomplete" || event.type === "error") {
              throw new Error("Response did not complete");
            }
          }
          if (!completed) throw new Error("Response stream ended early");
        } catch {
          send({ error: "The insights response was interrupted. Please try again." });
        } finally {
          controller.close();
        }
      },
      cancel() { events.controller.abort(); },
    });
    return new Response(stream, { headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    } });
  } catch (error) {
    // Avoid logging research text, files, credentials, or complete provider headers.
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    console.error("Insights request failed", { status });
    return Response.json({ error: status === 429
      ? "Insights are busy or the service quota has been reached. Please try again later."
      : "Insights are temporarily unavailable. Please try again later."
    }, { status: status === 429 ? 429 : 502 });
  }
}
