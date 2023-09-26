export function PEMtoBase64(pem: string) {
  return pem
    .replace(new RegExp("\\n", "g"), "")
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "");
}

export function toSafeBase64(notSafe: string) {
  return notSafe
    .replace(new RegExp("\\n", "g"), "")
    .replace(new RegExp("\\+", "g"), "-")
    .replace(new RegExp("/", "g"), "_");
}

export function fromSafeBase64(safe: string) {
  return safe
    .replace(new RegExp("\\n", "g"), "")
    .replace(new RegExp("-", "g"), "+")
    .replace(new RegExp("_", "g"), "/");
}
