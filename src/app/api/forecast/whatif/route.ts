import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackend("/forecast/whatif", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
}
