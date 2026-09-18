import { expect, test } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

test.use({ colorScheme: 'dark', reducedMotion: 'no-preference' });
test.skip(({ isMobile }) => !isMobile, 'These checks target mobile viewport behavior.');

test('iPhone dark preference keeps the product light and text readable', async ({ page }) => {
  await page.goto('/sign-up');

  const body = page.locator('body');
  const heading = page.getByRole('heading', { name: '注册新账号' });
  const phoneInput = page.getByRole('textbox', { name: '手机号' });

  await expect(heading).toBeVisible();
  await expect(body).toHaveCSS('color-scheme', 'light');
  await expect(body).not.toHaveCSS('background-color', 'rgb(10, 10, 10)');
  await expect(heading).toHaveCSS('color', 'rgb(61, 43, 31)');
  await expect(phoneInput).toHaveCSS('color', 'rgb(61, 43, 31)');
  await expect(phoneInput).toHaveCSS('font-size', '16px');
});

test('iOS 15 bootstrap remains interactive when modern runtime APIs are absent', async ({ page }) => {
  await page.addInitScript(() => {
    // iOS 15.0–15.3 does not provide these APIs. This runs before the inline
    // compatibility script in the document head, mirroring that environment.
    delete (Array.prototype as { at?: unknown }).at;
    delete (String.prototype as { at?: unknown }).at;
    delete (Object as { hasOwn?: unknown }).hasOwn;
  });

  await page.goto('/to-explore');

  await expect.poll(() => page.evaluate(() => ({
    arrayAt: typeof Array.prototype.at,
    stringAt: typeof String.prototype.at,
    objectHasOwn: typeof Object.hasOwn,
  }))).toEqual({ arrayAt: 'function', stringAt: 'function', objectHasOwn: 'function' });

  const menuButton = page.getByRole('button', { name: '打开菜单' });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole('link', { name: '探索' }).last()).toBeVisible();
});

test('default story cover is packaged as a local static asset', async ({ page }) => {
  const response = await page.goto('/story-cover-default.jpg');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-type']).toContain('image/jpeg');
});

test('bottom navigation remains attached to the visual viewport after scrolling', async ({ page }) => {
  await page.goto('/to-explore');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

  const metrics = await page.getByRole('navigation', { name: '主导航' }).evaluate((nav) => {
    const rect = nav.getBoundingClientRect();
    return {
      bottomGap: Math.abs(window.innerHeight - rect.bottom),
      position: getComputedStyle(nav).position,
    };
  });

  expect(metrics.position).toBe('fixed');
  expect(metrics.bottomGap).toBeLessThanOrEqual(1);
});

test('music card icon stays centered on older mobile layouts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/to-explore-music');

  const card = page.getByRole('button', { name: '播放 摇篮曲' });
  const iconRegion = card.locator('div').first();
  const iconCircle = iconRegion.locator('div').first();
  const centers = await Promise.all([card, iconRegion, iconCircle].map(async (locator) => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    return { x: box!.x + box!.width / 2, width: box!.width };
  }));

  expect(Math.abs(centers[0].x - centers[1].x)).toBeLessThanOrEqual(1);
  expect(Math.abs(centers[0].x - centers[2].x)).toBeLessThanOrEqual(1);
  expect(centers[2].width).toBe(64);
});

test('companion garden fits its animation and action dock in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const css = readFileSync(join(process.cwd(), 'src/app/habits/habits.css'), 'utf8');
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <style>html, body { margin: 0; } ${css}</style>
    <div class="habit-app">
      <main class="habit-garden-shell">
        <div class="habit-garden-content">
          <header class="habit-topbar"><strong>小芽的浮岛花园</strong></header>
          <div class="habit-pet-zone"><button class="habit-pet" aria-label="伙伴动画"></button></div>
          <section class="habit-feed-dock habit-feed-empty" aria-label="底部操作区">
            <div class="habit-feed-copy"><b>还没有待喂食物卡</b><span>完成打卡并选卡后会出现在这里</span></div>
            <button class="habit-primary-button">去打卡</button>
          </section>
        </div>
      </main>
    </div>
  `);

  const shell = await page.locator('.habit-garden-shell').boundingBox();
  const dock = await page.getByRole('region', { name: '底部操作区' }).boundingBox();
  expect(shell).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(Math.round(shell!.height)).toBe(603);
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(shell!.y + shell!.height);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(667);

  const background = statSync(join(process.cwd(), 'public/habits/garden-bg.jpg'));
  expect(background.size).toBeLessThan(600 * 1024);
});

test('check-in celebration is centered and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const css = readFileSync(join(process.cwd(), 'src/app/habits/habits.css'), 'utf8');
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>html, body { margin: 0; } ${css}</style>
    <div class="habit-app">
      <div class="habit-celebration-layer" role="status">
        <div class="habit-confetti" aria-hidden="true"><span style="--confetti-x:120px;--confetti-y:-80px;--confetti-rotation:250deg;--confetti-color:#7658cf;--confetti-delay:0s"></span></div>
        <section class="habit-celebration-card" aria-label="打卡成功">
          <div class="habit-celebration-icon">✓</div>
          <div class="habit-celebration-title">打卡成功！</div>
          <p>你获得了一次食物卡选择</p>
          <small>今天已完成 1 / 4</small>
        </section>
      </div>
    </div>
  `);

  const card = page.getByRole('region', { name: '打卡成功' });
  await page.waitForTimeout(450);
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - 187.5)).toBeLessThanOrEqual(1);
  expect(Math.abs(box!.y + box!.height / 2 - 333.5)).toBeLessThanOrEqual(1);
  await expect(page.locator('.habit-confetti span')).toHaveCSS('animation-name', 'habit-confetti-burst');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.habit-confetti span')).toHaveCSS('animation-name', 'none');
});
