import { api } from "@/lib/api/client";

import type {
  BoardPost,
  PostDetail,
  PostImportance,
} from "@/features/project/board/types";
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
  // 서버는 코드로 준다. 모르는 부서가 새로 생겨도 코드라도 보이게 둔다.
  dept: DEPARTMENT_LABEL[post.department] ?? post.department,
  // 목록에서는 초까지 볼 이유가 없다 — "2026-07-28 10:00"
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

// 상세 응답 한 건 (서버 필드 그대로)
interface PostDetailApiItem {
  postId: number;
  title: string;
  priority: PostImportance;
  content: string;
  author: { userId: number; name: string; department: DepartmentType };
  createdAt: string;
  modifiedAt: string;
}

interface PostDetailApiResponse {
  errorCode: string | null;
  message: string;
  result: PostDetailApiItem;
}

export interface PostDetailResponse
  extends Omit<PostDetailApiResponse, "result"> {
  result: PostDetail;
}

const toPostDetail = (post: PostDetailApiItem): PostDetail => ({
  id: String(post.postId),
  title: post.title,
  importance: post.priority,
  content: post.content,
  author: {
    userId: post.author.userId,
    name: post.author.name,
    dept: DEPARTMENT_LABEL[post.author.department] ?? post.author.department,
  },
  createdAt: post.createdAt,
  modifiedAt: post.modifiedAt,
});

// 게시글 상세 조회
export const fetchPostDetail = async (
  projectId: string,
  postId: string,
): Promise<PostDetailResponse> => {
  const response = await api.get<PostDetailApiResponse>(
    `/projects/${projectId}/posts/${postId}`,
  );

  return { ...response.data, result: toPostDetail(response.data.result) };
};

// 게시글 수정 — 작성자만 가능(그 외 403 POST_004). 제목·중요도·내용 3필드는 작성과 같다.
export const updatePost = async (
  projectId: string,
  postId: string,
  body: CreatePostRequest,
): Promise<PostDetailResponse> => {
  const response = await api.put<PostDetailApiResponse>(
    `/projects/${projectId}/posts/${postId}`,
    body,
  );

  return { ...response.data, result: toPostDetail(response.data.result) };
};

export interface DeletePostResponse {
  errorCode: string | null;
  message: string;
  result: { postId: number };
}

// 게시글 삭제 — 작성자만 가능(그 외 403 POST_004), soft delete
export const deletePost = async (
  projectId: string,
  postId: string,
): Promise<DeletePostResponse> => {
  const response = await api.delete<DeletePostResponse>(
    `/projects/${projectId}/posts/${postId}`,
  );

  return response.data;
};
