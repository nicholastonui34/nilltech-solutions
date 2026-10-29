import { financeExportResponse } from "@/lib/finance/exports";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  return financeExportResponse(kind, new URL(request.url).searchParams);
}
