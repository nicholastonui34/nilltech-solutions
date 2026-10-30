import { quotePdfResponse } from "@/lib/finance/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return quotePdfResponse(id);
}
