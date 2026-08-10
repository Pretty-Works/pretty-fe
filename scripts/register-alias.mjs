import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// node --test는 tsconfig의 paths를 모른다. "@/..."를 src 기준 실제 파일로 바꿔 준다.
const SRC = path.resolve(import.meta.dirname, "..", "src");

const isFile = (candidate) =>
  existsSync(candidate) && statSync(candidate).isFile();

const resolveAlias = (specifier) => {
  const base = path.join(SRC, specifier.slice(2));

  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ].find(isFile);
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

    const resolved = resolveAlias(specifier);
    if (!resolved) return nextResolve(specifier, context);

    return nextResolve(pathToFileURL(resolved).href, context);
  },
});
