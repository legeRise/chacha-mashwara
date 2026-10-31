import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const source = path.join(repo, "rules", "rules.json");
const publicDir = path.resolve(here, "../public");

fs.mkdirSync(publicDir, { recursive: true });

if (!fs.existsSync(source)) {
  console.error(`Missing catalog: ${source}`);
  process.exit(1);
}

const rules = JSON.parse(fs.readFileSync(source, "utf8"));
fs.copyFileSync(source, path.join(publicDir, "rules.json"));

const meta = {
  generatedAt: new Date().toISOString(),
  count: rules.length,
  volumes: [...new Set(rules.map((r) => r.volume))],
  families: [...new Set(rules.map((r) => r.family))].sort(),
  tones: [...new Set(rules.map((r) => r.tone))].sort(),
};

fs.writeFileSync(
  path.join(publicDir, "meta.json"),
  JSON.stringify(meta, null, 2) + "\n",
);

console.log(`Synced ${rules.length} rules to ui/public/rules.json`);
