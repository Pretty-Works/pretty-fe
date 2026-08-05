import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchPosts,
  type FetchPostsParams,
} from "@/features/project/board/api/postApi";

export const usePostsQuery = (
  projectId: string,
  params: FetchPostsParams,
) => {
  return useQuery({
    queryKey: ["project", "posts", projectId, params],
    queryFn: () => fetchPosts(projectId, params),

    enabled: !!projectId,

    // 검색어·페이지를 바꿀 때 표가 비었다가 다시 차는 깜빡임을 막는다
    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,

    select: (data) => ({
      posts: data.result.content,
      totalPages: data.result.totalPages,
      totalElements: data.result.totalElements,
    }),
  });
};
