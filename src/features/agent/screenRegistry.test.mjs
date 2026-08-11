import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScreenContext,
  canonicalScreenKey,
  extractRouteParams,
  resolveRoute,
  screenLabel,
  suggestionScreen,
} from "./screenRegistry.ts";

test("경로에서 화면 키와 값을 함께 뽑는다", () => {
  assert.deepEqual(extractRouteParams("/projects/3/meetings/41"), {
    projectId: "3",
    meetingId: "41",
  });
  assert.deepEqual(extractRouteParams("/calendar"), {});
  assert.deepEqual(extractRouteParams("/projects/3/nope"), {});
});

test("에이전트가 쓰는 다른 이름도 같은 화면으로 받는다", () => {
  assert.equal(canonicalScreenKey("TASK_LIST"), "PROJECT_OVERVIEW");
  assert.equal(screenLabel("PROJECT_DETAIL"), "프로젝트 개요");
  assert.equal(
    resolveRoute("LEAVE_LIST", {}),
    "/calendar",
  );
  assert.equal(canonicalScreenKey("NOT_A_SCREEN"), null);
  assert.equal(resolveRoute("NOT_A_SCREEN", {}), null);
});

test("화면 문맥에 이름·경로·경로 값이 함께 실린다", () => {
  const context = buildScreenContext("/projects/3/meetings");

  assert.equal(context.screen, "MEETING_LIST");
  assert.deepEqual(context.formState, {
    projectId: 3,
    _screen: "회의록",
    _path: "/projects/3/meetings",
  });
});

test("화면이 올린 입력값이 경로 값과 함께 담긴다", () => {
  const context = buildScreenContext("/projects/new", { name: "다온증권" });

  assert.equal(context.screen, "PROJECT_CREATE");
  assert.equal(context.formState.name, "다온증권");
  assert.equal(context.formState._screen, "프로젝트 생성");
});

test("모르는 경로도 화면 문맥은 만든다", () => {
  const context = buildScreenContext("/somewhere/else");

  assert.equal(context.screen, "UNKNOWN");
  assert.equal(context.formState._screen, "알 수 없는 화면");
});

test("추천 문구용 화면은 규격의 세 값으로 접어서 보낸다", () => {
  assert.equal(suggestionScreen("/"), "HOME");
  assert.equal(suggestionScreen("/calendar"), "CALENDAR");

  // 프로젝트 안의 탭은 전부 PROJECT 한 값으로 묶인다
  assert.equal(suggestionScreen("/projects/new"), "PROJECT");
  assert.equal(suggestionScreen("/projects/3/overview"), "PROJECT");
  assert.equal(suggestionScreen("/projects/3/meetings/41"), "PROJECT");
  assert.equal(suggestionScreen("/projects/3/finance"), "PROJECT");

  // 표에 없는 경로는 기본값으로 떨어진다
  assert.equal(suggestionScreen("/somewhere/else"), "HOME");
});
