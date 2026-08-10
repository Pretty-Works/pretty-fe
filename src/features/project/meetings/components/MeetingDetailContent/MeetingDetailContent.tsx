import { formatDateLabel } from "@/lib/date";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";

import type { MeetingDetail } from "@/features/project/meetings/api/meetingApi";
import { personLabel } from "@/features/project/meetings/utils/format";

import styles from "./MeetingDetailContent.module.css";

interface MeetingDetailContentProps {
  meeting: MeetingDetail;
  projectName: string;
  // 작성자 · 참석자만 고칠 수 있고, 지우는 건 작성자만 할 수 있다.
  // 할 수 없는 일은 흐리게 두지 않고 아예 띄우지 않는다.
  canEdit: boolean;
  canDelete: boolean;
  onList: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function MeetingDetailContent({
  meeting,
  projectName,
  canEdit,
  canDelete,
  onList,
  onDelete,
  onEdit,
}: MeetingDetailContentProps) {
  return (
    <>
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{meeting.title}</h2>
            <span className={styles.code}>{meeting.documentNumber}</span>
          </div>
          <p className={styles.sub}>
            {formatDateLabel(meeting.meetingDate)}
            {meeting.location ? ` · ${meeting.location}` : ""}
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
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <div className={styles.infoRow}>
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>프로젝트</span>
            <span className={styles.infoValue}>{projectName || "-"}</span>
          </div>
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>작성자</span>
            <span className={styles.infoValue}>
              {personLabel(meeting.author.name, meeting.author.department)}
            </span>
          </div>
        </div>

        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>
            참석자 ({meeting.attendees.length}명)
          </span>
          <div className={styles.chips}>
            {meeting.attendees.map((person) => (
              <Chip
                key={person.userId}
                label={personLabel(person.name, person.department)}
              />
            ))}
          </div>
        </div>

        {meeting.recording && (
          <div className={styles.transcript}>
            <span aria-hidden="true">📄</span>
            <span>녹취록 기반 AI 생성 : {meeting.recording}</span>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>회의 목적</h4>
          <p className={styles.fieldText}>{meeting.purpose || "-"}</p>
        </div>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>주요 내용</h4>
          <p className={styles.fieldText}>{meeting.content || "-"}</p>
        </div>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>후속 조치</h4>
          <p className={styles.fieldText}>{meeting.followUp || "-"}</p>
        </div>
      </section>
    </>
  );
}
