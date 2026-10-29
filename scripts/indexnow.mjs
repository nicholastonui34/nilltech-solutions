// Submits every URL in the live sitemap to IndexNow (CLAUDE.md §14), which
// shares it with Bing, Yandex, Seznam and others. Run by
// .github/workflows/indexnow.yml after each deploy to main.
//
// The key is public by design: IndexNow proves ownership by fetching
// https://<host>/<key>.txt, which lives in public/. If the domain isn't
// serving this site yet (key file or sitemap missing), the script exits
// quietly so the workflow stays green until the domain moves over.
import { readdirSync } from "node:fs";

const SITE_URL = (process.env.SITE_URL || "https://nilltechsolutions.com").replace(/\/$/, "");
const host = new URL(SITE_URL).host;

const keyFile = readdirSync("public").find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) {
  console.error("No IndexNow key file in public/.");
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, "");
const keyLocation = `${SITE_URL}/${keyFile}`;

async function text(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

const servedKey = await text(keyLocation);
if (servedKey?.trim() !== key) {
  console.log(`::notice::${host} isn't serving the IndexNow key yet (domain not on this site?). Skipping.`);
  process.exit(0);
}

const sitemap = await text(`${SITE_URL}/sitemap.xml`);
const urls = [...(sitemap ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].trim())
  .filter((url) => new URL(url).host === host);
if (!urls.length) {
  console.log("::notice::No sitemap URLs found. Skipping.");
  process.exit(0);
}

if (process.env.DRY_RUN) {
  console.log(`Dry run: would submit ${urls.length} URLs for ${host}:\n${urls.join("\n")}`);
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList: urls.slice(0, 10000) }),
});
// 200 = accepted, 202 = accepted, key validation pending.
if (response.status === 200 || response.status === 202) {
  console.log(`Submitted ${urls.length} URLs to IndexNow (HTTP ${response.status}).`);
} else {
  console.error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`);
  process.exit(1);
}
