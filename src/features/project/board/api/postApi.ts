import { api } from "@/lib/api/client";

import type { BoardPost, PostImportance } from "@/features/project/board/types";
import {
  DEPARTMENT_LABEL,
  type DepartmentType,
} from "@/features/project/overview/api/taskBoardApi";

// 목록 응답 한 줄 (서버 필드 그대로)
interface PostApiItem {
  postId: number;
  title: string;
  priority: PostImportance;
  authorName: string;
  department: DepartmentType;
  createdAt: string;
}

export interface FetchPostsParams {
  title?: string;
  priority?: PostImportance;
  page?: number;
  size?: number;
}

interface PostsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: PostApiItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface PostsResponse extends Omit<PostsApiResponse, "result"> {
  result: Omit<PostsApiResponse["result"], "content"> & {
    content: BoardPost[];
  };
}

const toBoardPost = (post: PostApiItem): BoardPost => ({
  id: String(post.postId),
  title: post.title,
  importance: post.priority,
  author: post.authorName,
  dept: DEPARTMENT_LABEL[post.department] ?? post.department,
  createdAt: post.createdAt?.slice(0, 16) ?? "",
});

// 게시글 목록 조회
export const fetchPosts = async (
  projectId: string,
  params?: FetchPostsParams,
): Promise<PostsResponse> => {
  const response = await api.get<PostsApiResponse>(
    `/projects/${projectId}/posts`,
    {
      params: {
        title: params?.title?.trim() || undefined,
        priority: params?.priority,
        page: params?.page,
        size: params?.size,
      },
    },
  );

  return {
    ...response.data,
    result: {
      ...response.data.result,
      content: response.data.result.content.map(toBoardPost),
    },
  };
};

export interface CreatePostRequest {
  title: string;
  priority: PostImportance;
  content: string;
}

export interface CreatePostResponse {
  errorCode: string | null;
  message: string;
  result: {
    postId: number;
  };
}

// 게시글 작성
export const createPost = async (
  projectId: string,
  body: CreatePostRequest,
  idempotencyKey?: string,
): Promise<CreatePostResponse> => {
  const response = await api.post<CreatePostResponse>(
    `/projects/${projectId}/posts`,
    body,
    {
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
    },
  );

  return response.data;
};
