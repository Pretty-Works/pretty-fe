import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updatePost,
  type CreatePostRequest,
} from "@/features/project/board/api/postApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

export const useUpdatePostMutation = (projectId: string, postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post: CreatePostRequest) =>
      updatePost(projectId, postId, post),

    onSuccess: (data) => {
      queryClient.setQueryData(["project", "post", projectId, postId], data);

      void queryClient.invalidateQueries({
        queryKey: ["project", "posts", projectId],
      });

      // 고친 글이 board 배너의 재료다
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(projectId),
      });
    },
  });
};
