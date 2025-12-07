import { NextResponse } from "next/server";
import OpenAI from "openai";

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
  try {
    // Create OpenAI client only when this route handler is called
    const openai = getOpenAIClient();
    
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Create a new FormData instance for OpenAI
    const formDataForOpenAI = new FormData();
    formDataForOpenAI.append("file", file);
    formDataForOpenAI.append("purpose", "assistants");

    // Upload file to OpenAI
    const response = await openai.files.create({
      file: file,
      purpose: "assistants",
    });

    return NextResponse.json({ 
      fileId: response.id,
      filename: file.name 
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 