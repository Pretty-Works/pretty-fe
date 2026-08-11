// SCREEN_ROUTES → screens.json
//
// 화면 이름의 정본은 프론트다 — 경로와 한국어 이름이 실재하는 곳이 여기뿐이기 때문이다.
// 그런데 그 이름을 실제로 쓰는 쪽은 에이전트(LLM)다: navigate 로 화면을 지목하고,
// 라우팅 판단에 "현재 화면"을 읽는다. 소스를 공유할 수 없는 저장소끼리라 표를 넘긴다.
//
//   npm run screens        (SCREEN_ROUTES 를 고쳤으면 함께 돌린다)
//
// 안 돌리고 두면 screens.test.mjs 가 깨진다 — 사전이 조용히 어긋나는 것을 막는 자리다.

import fs from "node:fs";
import path from "node:path";

import {
  SCREEN_ALIASES,
  SCREEN_ROUTES,
} from "../src/features/agent/screenRegistry.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "screens.json");

const PARAM = /\[(\w+)\]/g;

/** screens.json 에 들어갈 내용. 테스트가 파일과 이 결과를 맞춰 본다 */
export function buildScreenCatalog() {
  const screens = Object.fromEntries(
    Object.entries(SCREEN_ROUTES).map(([key, { label, pattern }]) => [
      key,
      {
        label,
        route: pattern,
        // navigate 가 params 로 채워 줘야 하는 값들. 하나라도 빠지면 이동 카드가 뜨지 않는다
        params: [...pattern.matchAll(PARAM)].map(([, name]) => name),
      },
    ]),
  );

  return {
    // 사람이 이 파일을 열었을 때 어디서 온 것인지 알 수 있어야 한다
    source: "front/pretty-works/src/features/agent/screenRegistry.ts",
    command: "npm run screens",
    screens,
    // 옛 이름·비슷한 이름. 프론트가 여기 있는 이름도 받아 주지만, 새 코드는 정본을 쓴다
    aliases: SCREEN_ALIASES,
  };
}

const isDirectRun = process.argv[1] && import.meta.filename === path.resolve(process.argv[1]);

if (isDirectRun) {
  fs.writeFileSync(OUTPUT, `${JSON.stringify(buildScreenCatalog(), null, 2)}\n`);
  console.log(
    `screens.json 갱신 — 화면 ${Object.keys(SCREEN_ROUTES).length}개, 별칭 ${Object.keys(SCREEN_ALIASES).length}개`,
  );
}
