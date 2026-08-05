import { useQuery } from "@tanstack/react-query";

import { fetchPostDetail } from "@/features/project/board/api/postApi";

export const usePostDetailQuery = (projectId: string, postId: string) => {
  return useQuery({
    queryKey: ["project", "post", projectId, postId],
    queryFn: () => fetchPostDetail(projectId, postId),

    enabled: !!projectId && !!postId,

    staleTime: 30 * 1000,

    select: (data) => data.result,

    retry: false,
  });
};
