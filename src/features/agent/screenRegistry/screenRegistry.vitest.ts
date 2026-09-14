import { describe, expect, it } from "vitest";

import {
  buildScreenContext,
  resolveRoute,
} from "./screenRegistry";

// describe("기능", () => {
//   it("기대하는 동작", () => {
//     const result = 함수실행();

//     expect(result).toBe(예상값);
//   });
// });

describe("Screen Registry", () => {
  it("현재 경로에서 에이전트가 사용할 화면 문맥을 만든다", () => {
    const context = buildScreenContext("/projects/3/meetings");

    expect(context.screen).toBe("MEETING_LIST");
    expect(context.formState).toEqual({
      projectId: 3,
      _screen: "회의록",
      _path: "/projects/3/meetings",
    });
  });

  it("에이전트가 전달한 화면과 ID로 이동 경로를 만든다", () => {
    expect(
      resolveRoute("MEETING_DETAIL", {
        projectId: 3,
        meetingId: 41,
      }),
    ).toBe("/projects/3/meetings/41");
  });

  it("필수 ID가 없으면 잘못된 경로를 만들지 않는다", () => {
    expect(
      resolveRoute("MEETING_DETAIL", {
        projectId: 3,
      }),
    ).toBeNull();
  });
});