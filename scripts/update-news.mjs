// This process reads only this public source list and its own generated snapshot.
// Never add localStorage exports, private files, environment values or user queries.
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";
import { collectNews } from "./news-lib.mjs";
const sources = JSON.parse(
  await readFile(
    new URL("../src/data/news-sources.json", import.meta.url),
    "utf8",
  ),
);
const destination = new URL("../public/news/vn.json", import.meta.url);
let previous = null;
try {
  previous = JSON.parse(await readFile(destination, "utf8"));
} catch {}
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
async function fetchSource(source) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      source.url,
      {
        agent,
        headers: {
          "User-Agent": "NOC-Navigator/1.0 (public RSS metadata reader)",
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        timeout: 15000,
      },
      (response) => {
        // Do not follow redirects to unreviewed destinations.
        if (response.statusCode !== 200) {
          response.resume();
          reject(Error("feed-http-failed"));
          return;
        }
        let size = 0;
        const chunks = [];
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            response.destroy(Error("feed-too-large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", () => reject(Error("feed-transfer-failed")));
        response.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf8")),
        );
      },
    );
    const timer = setTimeout(
      () => request.destroy(Error("feed-deadline")),
      20000,
    );
    request.on("close", () => clearTimeout(timer));
    request.on("timeout", () => request.destroy(Error("feed-timeout")));
    request.on("error", () => reject(Error("feed-request-failed")));
  });
}
const snapshot = await collectNews(sources, previous, fetchSource);
await mkdir(new URL("../public/news/", import.meta.url), { recursive: true });
const temp = fileURLToPath(destination) + ".tmp";
await writeFile(temp, JSON.stringify(snapshot, null, 2) + "\n");
await rename(temp, destination);
for (const s of snapshot.sources)
  console.log(
    `${s.id}: ${s.status}; ${s.articleCount} public metadata entries`,
  );
// Failure is observable while the existing site and a stale snapshot remain usable.
if (snapshot.sources.every((s) => s.status === "failed")) process.exitCode = 1;
