import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { buildScreenContext } from "../screenRegistry.ts";
import {
  readScreenFormState,
  useScreenContextStore,
} from "./useScreenContextStore.ts";

const reset = () =>
  useScreenContextStore.setState({
    screen: null,
    formState: null,
    fillRequest: null,
  });

beforeEach(reset);

test("화면이 올린 값이 그대로 요청에 실린다", () => {
  useScreenContextStore
    .getState()
    .publishFormState("PROJECT_CREATE", { name: "다온증권 MTS", budget: null });

  const context = buildScreenContext(
    "/projects/new",
    readScreenFormState("PROJECT_CREATE"),
  );

  assert.equal(context.screen, "PROJECT_CREATE");
  assert.equal(context.formState.name, "다온증권 MTS");
  assert.equal(context.formState.budget, null);
  assert.equal(context.formState._screen, "프로젝트 생성");
});

test("다른 화면으로 옮겨 가면 지난 화면의 값은 실리지 않는다", () => {
  useScreenContextStore
    .getState()
    .publishFormState("PROJECT_CREATE", { name: "다온증권 MTS" });

  const context = buildScreenContext(
    "/projects/3/meetings",
    readScreenFormState("MEETING_LIST"),
  );

  assert.deepEqual(context.formState, {
    projectId: 3,
    _screen: "회의록",
    _path: "/projects/3/meetings",
  });
});

test("떠나는 화면의 뒷정리가 다음 화면의 값을 지우지 않는다", () => {
  const store = useScreenContextStore.getState();

  store.publishFormState("MEETING_CREATE", { title: "주간 회의" });
  // 새 화면이 먼저 올리고 옛 화면의 언마운트 정리가 뒤늦게 도는 순서
  store.publishFormState("PROJECT_CREATE", { name: "새 프로젝트" });
  store.clearFormState("MEETING_CREATE");

  assert.deepEqual(readScreenFormState("PROJECT_CREATE"), {
    name: "새 프로젝트",
  });
});

test("화면을 떠나면 값이 사라진다", () => {
  const store = useScreenContextStore.getState();

  store.publishFormState("PROJECT_CREATE", { name: "새 프로젝트" });
  store.clearFormState("PROJECT_CREATE");

  assert.equal(readScreenFormState("PROJECT_CREATE"), undefined);
});

test("채워 달라는 요청은 대상 화면과 함께 놓였다가 한 번 쓰면 지워진다", () => {
  const store = useScreenContextStore.getState();

  store.requestFill("PROJECT_CREATE", { name: "다온증권 MTS" });

  const { fillRequest } = useScreenContextStore.getState();
  assert.equal(fillRequest.screen, "PROJECT_CREATE");
  assert.deepEqual(fillRequest.formData, { name: "다온증권 MTS" });
  assert.ok(typeof fillRequest.createdAt === "number");

  store.clearFill();
  assert.equal(useScreenContextStore.getState().fillRequest, null);
});
