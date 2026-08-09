import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchPosts,
  type FetchPostsParams,
  type PostsResponse,
} from "@/features/project/board/api/postApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectPosts = (data: PostsResponse) => ({
  posts: data.result.content,
  totalPages: data.result.totalPages,
  totalElements: data.result.totalElements,
});

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

    select: selectPosts,
  });
};
