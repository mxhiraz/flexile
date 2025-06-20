import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const requestBody = body as Record<string, unknown>;
    const message = requestBody.message;
    const ticketId = params.id;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to reply to support ticket" }, { status: 500 });
  }
}
