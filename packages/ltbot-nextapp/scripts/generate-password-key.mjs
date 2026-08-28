// 生成 RSA-OAEP 密码传输密钥对，输出可直接写入 .env 的 base64 配置。
// 用法：node scripts/generate-password-key.mjs
import { generateKeyPairSync } from 'crypto';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log(`NEXT_PUBLIC_AUTH_PASSWORD_PUBLIC_KEY_B64=${Buffer.from(publicKey).toString('base64')}`);
console.log(`AUTH_PASSWORD_PRIVATE_KEY_B64=${Buffer.from(privateKey).toString('base64')}`);
