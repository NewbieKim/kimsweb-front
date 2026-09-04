// 生成 RSA-OAEP 密码传输密钥对，输出可写入 .env 的 base64 配置。
// 用法：node scripts/generate-password-key.mjs
// 默认只更新当前目录 .env.production 里的两行密钥，不覆盖其它配置。
import { generateKeyPairSync } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const targetPath = resolve(process.argv[2] || '.env.production');
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const publicB64 = Buffer.from(publicKey).toString('base64');
const privateB64 = Buffer.from(privateKey).toString('base64');
const updates = {
  NEXT_PUBLIC_AUTH_PASSWORD_PUBLIC_KEY_B64: publicB64,
  AUTH_PASSWORD_PRIVATE_KEY_B64: privateB64,
};

function upsertEnv(filePath, values) {
  let text = '';
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  const lines = text.length > 0 ? text.split(/\r?\n/) : [];
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in values)) {
      return line;
    }
    seen.add(match[1]);
    return `${match[1]}=${values[match[1]]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') {
        nextLines.push('');
      }
      nextLines.push(`${key}=${value}`);
    }
  }

  const output = nextLines.join('\n').replace(/\n*$/, '\n');
  writeFileSync(filePath, output);
}

upsertEnv(targetPath, updates);
console.log(`已写入 ${targetPath}`);
console.log(`NEXT_PUBLIC_AUTH_PASSWORD_PUBLIC_KEY_B64=${publicB64}`);
console.log(`AUTH_PASSWORD_PRIVATE_KEY_B64=${privateB64}`);
