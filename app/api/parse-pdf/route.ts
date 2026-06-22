import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(arrayBuffer), {
      mergePages: true,
    });

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "No text found in PDF" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}