import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deletePost } from "@/features/project/board/api/postApi";

export const useDeletePostMutation = (projectId: string, postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePost(projectId, postId),

    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ["project", "post", projectId, postId],
      });

      void queryClient.invalidateQueries({
        queryKey: ["project", "posts", projectId],
      });
    },
  });
};
