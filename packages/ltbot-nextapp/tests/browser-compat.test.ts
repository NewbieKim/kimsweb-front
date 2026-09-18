import { expect, test } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { browserCompatibilityScript } from '@/lib/browser-compat';

test('iOS 15 bootstrap polyfills restore APIs before framework startup', () => {
  const context = vm.createContext({});
  vm.runInContext(`
    delete Array.prototype.at;
    delete String.prototype.at;
    delete Object.hasOwn;
  `, context);

  vm.runInContext(browserCompatibilityScript, context);

  expect(vm.runInContext(`['a', 'b'].at(-1)`, context)).toBe('b');
  expect(vm.runInContext(`'ab'.at(-1)`, context)).toBe('b');
  expect(vm.runInContext(`Object.hasOwn({ ready: true }, 'ready')`, context)).toBe(true);
});

test('default story cover is packaged in the public directory', () => {
  const coverPath = join(process.cwd(), 'public', 'story-cover-default.jpg');
  expect(existsSync(coverPath)).toBe(true);
  expect(statSync(coverPath).size).toBeGreaterThan(0);
});
