import { useSuspenseQuery } from "@tanstack/react-query";

import {
  fetchPosts,
  type FetchPostsParams,
  type PostsResponse,
} from "@/features/project/board/api/postApi/postApi";

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
  return useSuspenseQuery({
    queryKey: ["project", "posts", projectId, params],
    queryFn: () => fetchPosts(projectId, params),

    select: selectPosts,
  });
};
