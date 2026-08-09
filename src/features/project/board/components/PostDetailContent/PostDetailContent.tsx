import Button from "@/components/Button/Button";

import ImportanceDot from "@/features/project/board/components/ImportanceDot/ImportanceDot";
import {
  IMPORTANCE_META,
  type PostDetail,
} from "@/features/project/board/types";

import styles from "./PostDetailContent.module.css";

interface PostDetailContentProps {
  post: PostDetail;
  // 수정·삭제 모두 작성자만 할 수 있다. 할 수 없는 일은 흐리게 두지 않고 아예 띄우지 않는다.
  canEdit: boolean;
  canDelete: boolean;
  onList: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function PostDetailContent({
  post,
  canEdit,
  canDelete,
  onList,
  onDelete,
  onEdit,
}: PostDetailContentProps) {
  const authorLabel = post.author.dept
    ? `${post.author.name} · ${post.author.dept}`
    : post.author.name;

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{post.title}</h2>
          </div>
          <p className={styles.sub}>
            <span className={styles.importance}>
              <ImportanceDot importance={post.importance} size={10} round />
              {IMPORTANCE_META[post.importance].label}
            </span>
            <span className={styles.dot}>·</span>
            {authorLabel}
            <span className={styles.dot}>·</span>
            {post.createdAt}
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={onList}
          >
            목록
          </Button>
          {canDelete && (
            <Button
              type="danger"
              buttonStyle="weak"
              size="medium"
              onClick={onDelete}
            >
              삭제
            </Button>
          )}
          {canEdit && (
            <Button size="medium" onClick={onEdit}>
              수정
            </Button>
          )}
        </div>
      </div>

      <section className={styles.card}>
        <p className={styles.content}>{post.content}</p>
      </section>
    </>
  );
}
