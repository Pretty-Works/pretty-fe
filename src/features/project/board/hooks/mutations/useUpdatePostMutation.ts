import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updatePost,
  type CreatePostRequest,
} from "@/features/project/board/api/postApi";

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
    },
  });
};
