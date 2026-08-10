"use client";

import Result from "@/components/Result/Result";

import DeleteConfirmModal from "@/features/project/components/modal/DeleteConfirmModal/DeleteConfirmModal";
import MeetingActionItems from "@/features/project/meetings/components/MeetingActionItems/MeetingActionItems";
import MeetingDetailContent from "@/features/project/meetings/components/MeetingDetailContent/MeetingDetailContent";
import MeetingForm from "@/features/project/meetings/components/MeetingForm/MeetingForm";
import { useAttendeeOptions } from "@/features/project/meetings/hooks/useAttendeeOptions";
import { useMeetingDetailPage } from "@/features/project/meetings/hooks/useMeetingDetailPage";
import { toMeetingFormData } from "@/features/project/meetings/utils/format";
import TaskCreateModal from "@/features/task/components/TaskCreateModal/TaskCreateModal";

import styles from "./MeetingDetailView.module.css";

interface MeetingDetailViewProps {
  projectId: string;
  meetingId: string;
}

export default function MeetingDetailView({
  projectId,
  meetingId,
}: MeetingDetailViewProps) {
  const page = useMeetingDetailPage(projectId, meetingId);
  const attendeeOptions = useAttendeeOptions(
    projectId,
    page.meeting?.author.userId,
  );

  if (page.isLoading) {
    return (
      <Result
        figure={<Result.Figure>📄</Result.Figure>}
        title="회의록을 불러오는 중이에요"
        description="잠시만 기다려 주세요."
      />
    );
  }

  if (page.isError || !page.meeting) {
    // 삭제하고 목록으로 넘어가는 중이라면 없는 게 정상이다 — 에러 화면을 띄우지 않는다
    if (page.isDeleting) return null;

    return (
      <Result
        figure={<Result.Figure tone="error">❗</Result.Figure>}
        title="회의록을 불러오지 못했어요"
        description="회의록이 없거나 조회 권한이 없을 수 있어요."
        button={
          <Result.Button
            type="light"
            buttonStyle="weak"
            onClick={() => void page.retry()}
          >
            ↻ 다시 시도
          </Result.Button>
        }
      />
    );
  }

  if (page.editing) {
    return (
      <div className={styles.page}>
        <MeetingForm
          mode="edit"
          projectId={projectId}
          initial={toMeetingFormData(page.meeting, page.projectName)}
          initialAttendeeIds={page.meeting.attendees.map((person) =>
            String(person.userId),
          )}
          attendeeOptions={attendeeOptions}
          isSaving={page.isSaving}
          onSave={page.saveEdit}
          onExit={page.stopEdit}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <MeetingDetailContent
        meeting={page.meeting}
        projectName={page.projectName}
        canEdit={page.canEdit}
        canDelete={page.canDelete}
        onList={page.goList}
        onDelete={page.openDelete}
        onEdit={page.startEdit}
      />

      <MeetingActionItems
        items={page.actionItems}
        onAddTask={page.canAddTask ? page.openTaskDraft : undefined}
      />

      {/* 실행 항목을 할 일로 옮겨 담는 팝업.
          열 때 마운트해 그 줄의 내용·목표일을 초기값으로 한 번만 잡는다 */}
      {page.taskDraft && (
        <TaskCreateModal
          key={page.taskDraft.id}
          open
          onClose={page.closeTaskDraft}
          fixedProject={{ id: projectId, name: page.projectName }}
          draft={{
            content: page.taskDraft.task,
            dueDate: page.taskDraft.due,
          }}
        />
      )}

      <DeleteConfirmModal
        open={page.deleteOpen}
        noun="회의록"
        title={page.meeting.title}
        isDeleting={page.isDeleting}
        onClose={page.closeDelete}
        onConfirm={page.confirmDelete}
      />
    </div>
  );
}
