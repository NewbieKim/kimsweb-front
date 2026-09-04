import { constants, createPrivateKey, privateDecrypt } from 'crypto';

export class PasswordCryptoError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'PasswordCryptoError';
  }
}

function getPrivateKeyPem(): string | null {
  const encoded = process.env.AUTH_PASSWORD_PRIVATE_KEY_B64?.trim();
  if (!encoded) {
    return null;
  }
  return Buffer.from(encoded, 'base64').toString('utf8');
}

export function isPasswordEncryptionConfigured(): boolean {
  return !!getPrivateKeyPem();
}

// 解密密码
export function decryptPassword(encrypted: string): string {
  const pem = getPrivateKeyPem(); // 获取私钥
  if (!pem) {
    throw new PasswordCryptoError('服务端未配置密码解密密钥', 500);
  }

  try {
    const key = createPrivateKey(pem);
    const buffer = privateDecrypt(
      {
        key,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encrypted, 'base64')
    );
    return buffer.toString('utf8');
  } catch (error) {
    if (error instanceof PasswordCryptoError) {
      throw error;
    }
    throw new PasswordCryptoError('密码解密失败', 400);
  }
}
