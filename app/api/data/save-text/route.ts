import { NextResponse } from "next/server";

// Compatibility route: research text is stored in the browser and sent with questions.
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
