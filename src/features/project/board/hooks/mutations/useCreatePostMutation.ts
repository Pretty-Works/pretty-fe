import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPost,
  type CreatePostRequest,
} from "@/features/project/board/api/postApi";

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
    },
  });
};
