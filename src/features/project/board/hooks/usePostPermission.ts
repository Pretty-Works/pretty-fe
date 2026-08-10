"use client";

import type { PostDetail } from "@/features/project/board/types";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

/** 이 게시글로 무엇을 할 수 있는가 — 수정·삭제 모두 작성자 본인만 가능하다 */
export const usePostPermission = (post?: PostDetail) => {
  const { data: me } = useMyProfileQuery();

  if (!post || !me) return { canEdit: false, canDelete: false };

  const isAuthor = post.author.userId === me.userId;

  return { canEdit: isAuthor, canDelete: isAuthor };
};
