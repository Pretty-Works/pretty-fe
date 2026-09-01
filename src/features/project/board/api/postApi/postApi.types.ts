import type {
  BoardPost,
  PostDetail,
  PostImportance,
} from "@/features/project/board/types";

export interface FetchPostsParams {
  title?: string;
  priority?: PostImportance;
  page?: number;
  size?: number;
}

export interface PostsResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: BoardPost[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

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

export interface PostDetailResponse {
  errorCode: string | null;
  message: string;
  result: PostDetail;
}

export interface DeletePostResponse {
  errorCode: string | null;
  message: string;
  result: { postId: number };
}
