import { NextResponse } from "next/server";

interface Company {
  id: string;
  name: string;
  isTrusted: boolean;
  updatedAt: string;
}

const mockCompanies: Company[] = [
  {
    id: "comp_001",
    name: "TechCorp Inc",
    isTrusted: false,
    updatedAt: "2024-12-19T10:30:00Z",
  },
  {
    id: "comp_002", 
    name: "StartupXYZ",
    isTrusted: true,
    updatedAt: "2024-12-18T09:15:00Z",
  },
  {
    id: "comp_003",
    name: "Innovation Labs",
    isTrusted: false,
    updatedAt: "2024-12-17T16:45:00Z",
  },
];

export function GET() {
  try {
    return NextResponse.json({ companies: mockCompanies });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const requestBody = body;
    const companyId = "companyId" in requestBody ? requestBody.companyId : undefined;
    const isTrusted = "isTrusted" in requestBody ? requestBody.isTrusted : undefined;

    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    if (typeof isTrusted !== "boolean") {
      return NextResponse.json({ error: "isTrusted must be a boolean" }, { status: 400 });
    }

    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    company.isTrusted = isTrusted;
    company.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      company,
      message: `Company ${company.name} has been ${isTrusted ? 'marked as trusted' : 'unmarked as trusted'}`,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update company trust status" }, { status: 500 });
  }
}
