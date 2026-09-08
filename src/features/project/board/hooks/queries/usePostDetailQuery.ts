import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchPostDetail } from "@/features/project/board/api/postApi/postApi";

export const usePostDetailQuery = (projectId: string, postId: string) => {
  return useSuspenseQuery({
    queryKey: ["project", "post", projectId, postId],
    queryFn: () => fetchPostDetail(projectId, postId),

    select: (data) => data.result,

    retry: false,
  });
};
