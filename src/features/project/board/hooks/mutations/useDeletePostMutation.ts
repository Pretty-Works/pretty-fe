import { useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deletePost } from "@/features/project/board/api/postApi";

export const useDeletePostMutation = (projectId: string, postId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deletePost(projectId, postId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["project", "posts", projectId],
      });
    },
  });

  // 상세 캐시는 화면을 떠난 뒤에 지운다.
  // 삭제 직후 바로 지우면 아직 붙어 있는 상세 쿼리가 곧장 다시 조회해 404를 맞고,
  // 목록으로 넘어가기 전에 "게시글이 없다"는 에러 화면이 한 번 깜빡인다.
  useEffect(() => {
    if (!mutation.isSuccess) return;

    return () => {
      queryClient.removeQueries({
        queryKey: ["project", "post", projectId, postId],
      });
    };
  }, [mutation.isSuccess, queryClient, projectId, postId]);

  return mutation;
};
