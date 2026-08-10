import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPost,
  type CreatePostRequest,
} from "@/features/project/board/api/postApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

export const useCreatePostMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  // 연타·재시도로 게시글이 두 건 생기지 않게, 폼이 열릴 때 한 번 발급해 둔다
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return useMutation({
    mutationFn: (post: CreatePostRequest) =>
      createPost(projectId, post, idempotencyKey),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["project", "posts", projectId],
      });

      // 방금 쓴 글이 board 배너의 재료다
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(projectId),
      });
    },
  });
};
