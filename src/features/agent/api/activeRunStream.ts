// 실행 스트림은 한 번에 하나다 — 패널도 하나고, 새 실행은 언제나 이전 것을 대신한다.
// 훅의 ref 가 아니라 모듈에 두는 이유는 스트림을 끊어야 하는 자리가 훅 바깥에도 있기 때문이다.
// 로그아웃이 그렇다: 패널이 사라져도 fetch 는 살아 있어서, 끊지 않으면 다음 사용자의 화면에
// 이전 사용자 실행의 step·답변이 그대로 꽂힌다.
let controller: AbortController | null = null;

/** 새 스트림에 쓸 controller. 아직 열려 있던 스트림이 있으면 여기서 끊긴다. */
export const openRunStreamController = () => {
  controller?.abort();
  controller = new AbortController();

  return controller;
};

/** 열려 있는 스트림을 끊는다. 없으면 아무 일도 하지 않는다. */
export const abortRunStream = () => {
  controller?.abort();
  controller = null;
};

/** 스스로 끝난 스트림을 정리한다. 그 사이 다음 스트림이 열렸으면 그것은 건드리지 않는다. */
export const releaseRunStreamController = (finished: AbortController) => {
  if (controller === finished) controller = null;
};
