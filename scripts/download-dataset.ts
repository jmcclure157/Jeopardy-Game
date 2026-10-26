// Downloads the original JEOPARDY_QUESTIONS1.json.gz (216,930 clues scraped from
// J! Archive and shared on r/datasets in 2014) into data/. The file is already
// committed, so this is only needed to restore or verify it.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

// The original S3 link from the Reddit post no longer serves the file, so use the
// Internet Archive's copy of that same URL.
const SOURCE_URL =
  "https://web.archive.org/web/2020id_/http://skeeto.s3.amazonaws.com/share/JEOPARDY_QUESTIONS1.json.gz";
// SHA-256 of the uncompressed JSON (55,554,625 bytes).
const EXPECTED_SHA256 = "e93247fed3511e025b9f4c7d3a6ab3334c77546401fb1d64f4d558af09506308";

const target = resolve(import.meta.dirname, "../data/JEOPARDY_QUESTIONS1.json.gz");

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
const gz = Buffer.from(await response.arrayBuffer());
const sha = createHash("sha256").update(gunzipSync(gz)).digest("hex");
if (sha !== EXPECTED_SHA256) throw new Error(`Checksum mismatch: got ${sha}`);

mkdirSync(resolve(target, ".."), { recursive: true });
writeFileSync(target, gz);
console.log(`Saved ${target} (${gz.length} bytes, checksum OK).`);
