import { NextResponse } from "next/server";

interface DividendPayment {
  id: string;
  dividendId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  processorName: string;
  transferStatus?: string;
  createdAt: string;
  updatedAt: string;
}

const DIVIDEND_STATUSES = [
  "pending",
  "processing", 
  "completed",
  "failed",
  "cancelled"
];

const PROCESSOR_NAMES = [
  "wise",
  "blockchain"
];

const mockDividendPayments: DividendPayment[] = [
  {
    id: "1",
    dividendId: "div_001",
    userId: "user_123",
    amount: 15000,
    currency: "USD",
    status: "completed",
    processorName: "wise",
    transferStatus: "outgoing_payment_sent",
    createdAt: "2024-12-19T10:30:00Z",
    updatedAt: "2024-12-19T14:15:00Z",
  },
  {
    id: "2",
    dividendId: "div_002", 
    userId: "user_456",
    amount: 8500,
    currency: "USD",
    status: "processing",
    processorName: "wise",
    transferStatus: "processing",
    createdAt: "2024-12-18T09:15:00Z",
    updatedAt: "2024-12-19T11:30:00Z",
  },
  {
    id: "3",
    dividendId: "div_003",
    userId: "user_789", 
    amount: 12000,
    currency: "USD",
    status: "pending",
    processorName: "blockchain",
    createdAt: "2024-12-17T16:45:00Z",
    updatedAt: "2024-12-18T10:20:00Z",
  },
  {
    id: "4",
    dividendId: "div_004",
    userId: "user_012",
    amount: 6500,
    currency: "USD",
    status: "failed", 
    processorName: "wise",
    transferStatus: "cancelled",
    createdAt: "2024-12-16T13:20:00Z",
    updatedAt: "2024-12-17T09:45:00Z",
  },
];

export function GET() {
  try {
    return NextResponse.json({ 
      payments: mockDividendPayments,
      availableStatuses: DIVIDEND_STATUSES,
      availableProcessors: PROCESSOR_NAMES
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch dividend payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const requestBody = body;
    const paymentId = "paymentId" in requestBody ? requestBody.paymentId : undefined;
    const newStatus = "status" in requestBody ? requestBody.status : undefined;

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    if (!newStatus || typeof newStatus !== "string" || !DIVIDEND_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Valid dividend status is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update dividend payment status" }, { status: 500 });
  }
}
