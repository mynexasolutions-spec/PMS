// Tiny fetch wrappers for the client components: always resolve to { ok, data }.

// An expired or revoked session answers 401 on any call: send the person to the sign-in page.
function sessionExpired(response) {
  if (response.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export async function request(url, method = "GET", body) {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    sessionExpired(response);
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

/** POSTs a FormData body (file uploads); the browser sets the multipart header itself. */
export async function upload(url, formData) {
  try {
    const response = await fetch(url, { method: "POST", body: formData });
    sessionExpired(response);
    return { ok: response.ok, data: await response.json().catch(() => null) };
  } catch {
    return { ok: false, data: null };
  }
}
