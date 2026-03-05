export async function hashPassword(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const rawKey = new Uint8Array(
    (await crypto.subtle.exportKey("raw", key)) as ArrayBuffer
  );
  let binary = "";
  for (let i = 0; i < rawKey.length; i++) binary += String.fromCharCode(rawKey[i]);
  return btoa(binary);
}

export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

export async function verifyPassword(
  password: string,
  salt: Uint8Array,
  hash: string
): Promise<boolean> {
  const hashed = await hashPassword(password, salt);
  return hashed === hash;
}
