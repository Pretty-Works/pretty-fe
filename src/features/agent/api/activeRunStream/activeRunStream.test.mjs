import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  abortRunStream,
  openRunStreamController,
  releaseRunStreamController,
} from "./activeRunStream.ts";

beforeEach(() => {
  abortRunStream();
});

test("새 스트림을 열면 앞서 열려 있던 스트림이 끊긴다", () => {
  const first = openRunStreamController();

  const second = openRunStreamController();

  assert.equal(first.signal.aborted, true);
  assert.equal(second.signal.aborted, false);
});

test("훅 밖에서도 열린 스트림을 끊을 수 있다 — 로그아웃이 이 경로다", () => {
  const controller = openRunStreamController();

  abortRunStream();

  assert.equal(controller.signal.aborted, true);
});

test("끝난 스트림을 뒤늦게 정리해도 그 사이 열린 스트림은 남는다", () => {
  const finished = openRunStreamController();
  const next = openRunStreamController();

  releaseRunStreamController(finished);
  abortRunStream();

  assert.equal(next.signal.aborted, true);
});
