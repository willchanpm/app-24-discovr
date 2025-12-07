import { OpenAI } from "openai";

// Configure for edge runtime and dynamic execution
export const runtime = 'edge';

// Initialize OpenAI client lazily (only when the route is called, not at build time)
// This prevents build errors when OPENAI_API_KEY is not available during build
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  // Create OpenAI client only when this route handler is called
  const openai = getOpenAIClient();

  try {
    console.log("Received POST request to /api/insights-chat");
    
    // Parse request body
    const { message, threadId, fileIds } = await req.json();
    console.log("Request data:", { message, threadId, fileIdsLength: fileIds?.length || 0 });
    
    if (!message) {
      console.log("Error: No message provided");
      return new Response(
        JSON.stringify({ error: "No message provided" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      console.log("Error: Missing OpenAI Assistant ID");
      throw new Error("Missing OpenAI Assistant ID");
    }
    console.log("Using assistant ID:", assistantId);

    // Create or use existing thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      console.log("Creating new thread");
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log("New thread created with ID:", currentThreadId);
    } else {
      console.log("Using existing thread with ID:", currentThreadId);
    }

    // Add message to thread - using just the content parameter
    console.log("Creating message in thread");
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message
    });
    console.log("Message created successfully");

    // Handle file attachments if any (in a separate request if needed)
    if (fileIds?.length) {
      console.log(`Files available but handling separately: ${fileIds.length} file(s)`);
      // Files should be attached to the assistant or handled differently
      // This would typically be done when setting up the assistant, not per message
    }

    // Create stream
    console.log("Creating stream");
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the run with streaming and file search tool
    console.log("Starting run with streaming");
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId,
      stream: true,
      tools: [{ type: "file_search" }]
    });
    console.log("Run created with streaming");

    // Process the stream
    (async () => {
      try {
        console.log("Processing stream");
        for await (const chunk of run) {
          console.log("Received chunk:", chunk.event);
          if (chunk.event === "thread.message.delta" && chunk.data?.delta?.content) {
            const content = chunk.data.delta.content;
            console.log("Content delta received:", content);
            if (Array.isArray(content)) {
              const textContent = content
                .filter(item => item.type === "text")
                .map(item => item.text?.value)
                .filter(Boolean)
                .join("");

              if (textContent) {
                console.log("Streaming text content:", textContent);
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      text: textContent,
                      threadId: currentThreadId,
                    })}\n\n`
                  )
                );
              }
            }
          }
        }
        console.log("Stream completed");
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream processing failed" })}\n\n`
          )
        );
      } finally {
        console.log("Closing writer");
        await writer.close();
      }
    })();

    console.log("Returning streaming response");
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 