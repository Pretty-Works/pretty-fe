# 화면 이름 규약 (프론트 ↔ 에이전트)

화면 이름의 정본은 프론트입니다. 경로와 한국어 이름이 실재하는 곳이 여기뿐이기 때문입니다
(`src/features/agent/screenRegistry.ts`의 `SCREEN_ROUTES`).

그 이름을 실제로 쓰는 쪽은 에이전트입니다 — `navigate`로 화면을 지목하고, 라우팅 판단에
"현재 화면"을 읽습니다. 저장소가 달라 소스를 공유할 수 없으므로 표를 파일로 넘깁니다.

## 넘기는 것

**`screens.json`** — `npm run screens`로 만듭니다. `SCREEN_ROUTES`를 고쳤으면 함께 돌리세요.
안 돌리면 `src/features/agent/screens.test.mjs`가 깨집니다.

```json
{
  "screens": {
    "MEETING_DETAIL": {
      "label": "회의록 상세",
      "route": "/projects/[projectId]/meetings/[meetingId]",
      "params": ["projectId", "meetingId"]
    }
  },
  "aliases": { "TASK_LIST": "PROJECT_OVERVIEW" }
}
```

- `label` — 사용자에게 보이는 이름. 에이전트가 "지금 회의록 상세 화면이시네요"라고 말할 때 쓸 값
- `params` — `navigate`가 `params`로 채워 줘야 하는 값. **하나라도 빠지면 이동 카드가 뜨지 않습니다**
- `aliases` — 옛 이름. 프론트가 받아 주긴 하지만 새 코드는 정본 키를 쓰세요

## 에이전트 쪽에서 해야 하는 일

1. **`app/schemas/screens.py`에 이 표를 둔다** — 따옴표로 감싼 대문자 키를 갖는 dict 하나면
   됩니다. 프론트 테스트가 이 파일을 읽어 양쪽 이름을 대조합니다(파일이 없으면 건너뜁니다).
2. **`tools/navigate.py`의 `targetScreen`을 그 키로 못 박는다.** 지금 docstring 예시는
   `MEETING_DETAIL, TASK_LIST, LEAVE_LIST 등`인데, 뒤의 둘은 프론트에 없는 이름입니다
   (별칭으로 받아 주고는 있습니다). 목록을 열거하거나 `Literal`로 강제하는 편이 낫습니다.
3. **`prompts/analysis_router.py`의 few-shot을 고친다.** 예시 6개가 전부
   `screen=project_detail`인데 실제로 도착하는 값은 `PROJECT_OVERVIEW`입니다. 모델이 예시로
   배운 이름과 실제 값이 다른 상태입니다. `app/schemas/state.py`의 `UIContext.screen` 주석
   (`"project_detail", "calendar", ...`)도 같이 정정해 주세요.

## 프론트가 지금 보내는 화면 문맥

`POST /agent/messages`의 `screenContext`입니다. BE는 열어보지 않고 그대로 넘깁니다.

```json
{
  "screen": "MEETING_LIST",
  "screenLabel": "회의록",
  "path": "/projects/3/meetings",
  "params": { "projectId": "3" },
  "formState": {
    "projectId": 3,
    "_screen": "회의록",
    "_path": "/projects/3/meetings"
  }
}
```

값이 `formState`에 겹쳐 들어 있는 이유: 에이전트의 `ScreenContext` 모델에는 `screen`과
`formState` 두 칸뿐이라 나머지 키는 받는 쪽에서 버려집니다. `formState`는 dict 그대로
통과하고 프롬프트에도 찍히므로, 지금 실제로 전달되는 통로는 그쪽 하나입니다.
그 모델에 `screenLabel`·`path`·`params`를 열어 주시면 위쪽 값을 쓰면 됩니다.

폼이 있는 화면(프로젝트 생성·수정, 회의록 작성, 게시글 작성)은 `formState`에 지금 입력된
값이 함께 실립니다. 크기는 프론트에서 줄여 보냅니다(긴 글은 앞 500자 + 총 글자 수).
