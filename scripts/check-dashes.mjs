// House style: no em dashes (U+2014) or en dashes (U+2013) anywhere a
// visitor can see them. Scans string literals, template text and JSX text
// in the app source (code comments are ignored), plus everything in
// public/. Runs before every build, so a dash can't reach production.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import ts from "typescript";

const DASH = /[–—]/;
const SOURCE_DIRS = ["app", "components", "config", "emails", "features", "lib"];
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".xml",
  ".json",
  ".svg",
  ".html",
  ".md",
  ".webmanifest",
]);
const VISIBLE_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const problems = [];

for (const file of SOURCE_DIRS.flatMap(walk)) {
  const ext = extname(file);
  if (![".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) continue;
  const text = readFileSync(file, "utf8");
  if (!DASH.test(text)) continue;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const visit = (node) => {
    if (VISIBLE_KINDS.has(node.kind) && DASH.test(node.getText(source))) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      problems.push(`${file}:${line + 1}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

for (const file of walk("public")) {
  if (!TEXT_EXTENSIONS.has(extname(file))) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (DASH.test(line)) problems.push(`${file}:${i + 1}`);
    });
}

if (problems.length) {
  console.error(
    'Em/en dashes found in visible text. Rewrite with a comma, colon, full stop or brackets (use "to" for ranges):',
  );
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
