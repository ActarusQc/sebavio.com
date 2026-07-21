import { chromium } from "playwright-core";
import path from "path";
import fs from "fs";

const outDir = path.resolve("tmp/marketing-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "390x844", width: 390, height: 844, fullPage: false },
  { name: "768x1024", width: 768, height: 1024, fullPage: false },
  { name: "1440x1200", width: 1440, height: 1200, fullPage: false },
  { name: "1920-full", width: 1920, height: 1080, fullPage: true },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium-browser",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("https://sebavio.com/", {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  // Force le chargement des images lazy sous le fold
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += 600) {
      window.scrollTo(0, y);
      await delay(200);
    }
    window.scrollTo(0, 0);
    await delay(400);
  });
  await page.waitForTimeout(1000);
  const file = path.join(outDir, `landing-${vp.name}.png`);
  await page.screenshot({ path: file, fullPage: vp.fullPage });
  console.log("OK", file);
  await context.close();
}

await browser.close();
