// Usa Web Crypto (subtle) en vez del modulo "crypto" de Node porque el
// middleware de Next corre en Edge Runtime y ahi no existe el modulo de Node.

const COOKIE_NAME = "admin_session";

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.ADMIN_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeAdminCookieValue(): Promise<string> {
  const sig = await hmac("admin");
  return `admin.${sig}`;
}

export async function isValidAdminCookieValue(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [value, sig] = cookieValue.split(".");
  if (!value || !sig) return false;
  const expected = await hmac(value);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export { COOKIE_NAME };
