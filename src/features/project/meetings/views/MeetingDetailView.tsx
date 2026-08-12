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

      {/* 배정 권한이 없으면 카드째 뜨지 않는다 — 이 카드가 하는 일은 담당자에게 할 일을
          배정하는 것 하나뿐이라, 줄마다 막아 봐야 눌리지 않는 표만 남는다.

          값이 다 있는 줄은 팝업 없이 그 자리에서 등록된다. 확인만 받는 단계를 한 번 더
          거칠 이유가 없어서다 */}
      {page.actionItems.visible && (
        <MeetingActionItems
          items={page.actionItems.items}
          generated={page.actionItems.generated}
          generating={page.actionItems.generating}
          onGenerate={page.actionItems.generate}
          addStateOf={page.actionItems.addStateOf}
          onAddTask={page.actionItems.onAddTask}
        />
      )}

      {/* 목표일처럼 빠진 값이 있는 줄만 이 팝업으로 넘어온다.
          열 때 마운트해 그 줄의 값을 초기값으로 한 번만 잡는다 */}
      {page.actionItems.draftItem && (
        <TaskCreateModal
          key={page.actionItems.draftItem.id}
          open
          onClose={page.actionItems.closeDraft}
          onCreated={page.actionItems.completeDraft}
          fixedProject={{ id: projectId, name: page.projectName }}
          draft={page.actionItems.draft}
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
