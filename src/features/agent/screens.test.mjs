// 화면 이름 사전이 어긋나는 것을 배포 전에 잡는 자리.
//
// 이름이 어긋나면 조용히 실패한다 — 이동 카드가 안 뜨거나(resolveRoute 가 null),
// 라우터가 모르는 이름으로 판단한다. 둘 다 로그도 안 남고 사용자만 이상하다고 느낀다.
// 그래서 런타임 검증 대신 여기서 막는다.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildScreenCatalog } from "../../../scripts/generate-screens.mjs";

import { canonicalScreenKey } from "./screenRegistry.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const CATALOG = path.join(ROOT, "screens.json");

// LLM 저장소의 화면 사전. 나란히 받아 둔 경우에만 대조한다.
// 기대하는 모양: 따옴표로 감싼 대문자 키를 갖는 dict 하나 (SCREENS = {"HOME": "홈", ...}).
const LLM_SCREENS = path.join(
  ROOT,
  "..",
  "..",
  "llm",
  "pretty-llm",
  "app",
  "schemas",
  "screens.py",
);

test("screens.json 이 SCREEN_ROUTES 와 같다", () => {
  assert.ok(
    fs.existsSync(CATALOG),
    "screens.json 이 없습니다 — npm run screens 를 돌려 주세요",
  );

  assert.deepEqual(
    JSON.parse(fs.readFileSync(CATALOG, "utf8")),
    buildScreenCatalog(),
    "화면 표가 바뀌었는데 screens.json 이 옛날 것입니다 — npm run screens",
  );
});

test("별칭은 실재하는 화면을 가리킨다", () => {
  const { aliases } = buildScreenCatalog();

  const broken = Object.entries(aliases)
    .filter(([, target]) => canonicalScreenKey(target) !== target)
    .map(([name, target]) => `${name} → ${target}`);

  assert.deepEqual(broken, [], `없는 화면을 가리키는 별칭:\n  ${broken.join("\n  ")}`);
});

test("LLM 사전에 없는 화면이 없다", (t) => {
  // 프론트만 따로 받아 본 경우엔 대조할 것이 없다
  if (!fs.existsSync(LLM_SCREENS)) {
    t.skip("LLM 화면 사전이 없어 건너뜁니다 (app/schemas/screens.py)");
    return;
  }

  const source = fs.readFileSync(LLM_SCREENS, "utf8");
  const known = new Set(
    [...source.matchAll(/"([A-Z][A-Z_]+)"\s*:/g)].map(([, key]) => key),
  );

  const { screens } = buildScreenCatalog();
  const missing = Object.keys(screens).filter((key) => !known.has(key));

  assert.deepEqual(
    missing,
    [],
    `LLM 사전에 빠진 화면:\n  ${missing.join("\n  ")}\n  (screens.json 을 넘겨 주세요)`,
  );
});

test("LLM 사전에 우리가 모르는 화면이 없다", (t) => {
  if (!fs.existsSync(LLM_SCREENS)) {
    t.skip("LLM 화면 사전이 없어 건너뜁니다 (app/schemas/screens.py)");
    return;
  }

  const source = fs.readFileSync(LLM_SCREENS, "utf8");
  const keys = [...source.matchAll(/"([A-Z][A-Z_]+)"\s*:/g)].map(([, key]) => key);

  // 별칭까지 풀어서 판정한다 — 옛 이름을 아직 쓰고 있어도 화면은 찾아간다
  const unknown = keys.filter((key) => !canonicalScreenKey(key));

  assert.deepEqual(
    unknown,
    [],
    `프론트에 없는 화면 이름:\n  ${unknown.join("\n  ")}`,
  );
});
