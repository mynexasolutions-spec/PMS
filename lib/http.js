// Helpers shared by the API route handlers.
export const fail = (message, status = 400) => Response.json({ error: message }, { status });
export const noContent = () => new Response(null, { status: 204 });

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

export async function idFrom(params) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? id : null;
}
