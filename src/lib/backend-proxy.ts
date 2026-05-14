export async function proxyToBackend(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base = process.env.BACKEND_URL;
  if (!base) {
    return Response.json(
      { error: "BACKEND_URL is not configured" },
      { status: 500 }
    );
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
