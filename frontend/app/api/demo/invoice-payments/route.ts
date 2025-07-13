import { NextResponse } from "next/server";

interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  wiseTransferStatus: string;
  wiseTransferId?: string;
  createdAt: string;
  updatedAt: string;
}

const WISE_STATUSES = [
  "incoming_payment_waiting",
  "incoming_payment_initiated", 
  "processing",
  "cancelled",
  "funds_refunded",
  "funds_converted",
  "outgoing_payment_sent",
  "bounced_back",
  "charged_back",
  "unknown"
];

const mockInvoicePayments: InvoicePayment[] = [
  {
    id: "1",
    invoiceId: "inv_001",
    amount: 7500,
    currency: "USD",
    wiseTransferStatus: "outgoing_payment_sent",
    wiseTransferId: "wise_123456",
    createdAt: "2024-12-19T10:30:00Z",
    updatedAt: "2024-12-19T14:15:00Z",
  },
  {
    id: "2", 
    invoiceId: "inv_002",
    amount: 12000,
    currency: "USD",
    wiseTransferStatus: "processing",
    wiseTransferId: "wise_789012",
    createdAt: "2024-12-18T09:15:00Z",
    updatedAt: "2024-12-19T11:30:00Z",
  },
  {
    id: "3",
    invoiceId: "inv_003", 
    amount: 5000,
    currency: "USD",
    wiseTransferStatus: "funds_converted",
    wiseTransferId: "wise_345678",
    createdAt: "2024-12-17T16:45:00Z",
    updatedAt: "2024-12-18T10:20:00Z",
  },
  {
    id: "4",
    invoiceId: "inv_004",
    amount: 8500,
    currency: "USD", 
    wiseTransferStatus: "cancelled",
    createdAt: "2024-12-16T13:20:00Z",
    updatedAt: "2024-12-17T09:45:00Z",
  },
];

export function GET() {
  try {
    return NextResponse.json({ 
      payments: mockInvoicePayments,
      availableStatuses: WISE_STATUSES 
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch invoice payments" }, { status: 500 });
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

    if (!newStatus || typeof newStatus !== "string" || !WISE_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Valid Wise status is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
  }
}
