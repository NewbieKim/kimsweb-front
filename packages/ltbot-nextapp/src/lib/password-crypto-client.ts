export async function buildPasswordPayload(password: string): Promise<{
  password?: string;
  passwordEncrypted?: string;
}> {
  const encrypted = await encryptPassword(password);
  if (encrypted) {
    return { passwordEncrypted: encrypted };
  }
  return { password };
}

export async function encryptPassword(password: string): Promise<string | null> {
  const encodedPublicKey = process.env.NEXT_PUBLIC_AUTH_PASSWORD_PUBLIC_KEY_B64; // 加密公钥
  if (
    !encodedPublicKey ||
    typeof window === 'undefined' ||
    !window.crypto?.subtle
  ) {
    return null;
  }

  const pem = new TextDecoder().decode(
    Uint8Array.from(atob(encodedPublicKey), (char) => char.charCodeAt(0))
  ); // 解码公钥
  const publicKey = await importPublicKey(pem); // 导入公钥
  const encrypted = await window.crypto.subtle.encrypt( // 加密密码
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(password)
  );
  const bytes = new Uint8Array(encrypted);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary); // 返回加密后的密码
}

// 导入公钥
async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binary = atob(
    pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '')
  );
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}
