import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import type { MeetingDetail } from "@/features/project/meetings/api/meetingApi";
import { personLabel } from "@/features/project/meetings/lib/format";
import { formatDateLabel } from "@/lib/date";

import styles from "./MeetingDetailContent.module.css";

interface MeetingDetailContentProps {
  meeting: MeetingDetail;
  projectName: string;
  onList: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function MeetingDetailContent({
  meeting,
  projectName,
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
          <Button
            type="danger"
            buttonStyle="weak"
            size="medium"
            onClick={onDelete}
          >
            삭제
          </Button>
          <Button size="medium" onClick={onEdit}>수정</Button>
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
            <span aria-hidden="true">🎙️</span>
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
