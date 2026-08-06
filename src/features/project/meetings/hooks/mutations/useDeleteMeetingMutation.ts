import { useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMeeting } from "@/features/project/meetings/api/meetingApi";

export const useDeleteMeetingMutation = (
  projectId: string,
  meetingId: string,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteMeeting(projectId, meetingId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["project", "meetings", projectId],
      });
    },
  });

  // 상세 캐시는 화면을 떠난 뒤에 지운다.
  // 삭제 직후 바로 지우면 아직 붙어 있는 상세 쿼리가 곧장 다시 조회해 404를 맞고,
  // 목록으로 넘어가기 전에 "회의록이 없다"는 에러 화면이 한 번 깜빡인다.
  useEffect(() => {
    if (!mutation.isSuccess) return;

    return () => {
      queryClient.removeQueries({
        queryKey: ["project", "meeting", projectId, meetingId],
      });
    };
  }, [mutation.isSuccess, queryClient, projectId, meetingId]);

  return mutation;
};
