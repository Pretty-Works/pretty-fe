"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import { clampDate, todayISO } from "@/lib/date";
import { useToastStore } from "@/stores/useToastStore";

import type { PeopleOption } from "@/components/PeoplePicker/PeoplePicker";
import { useAgentFormFill } from "@/features/agent/hooks/useAgentFormFill";
import { useScreenFormState } from "@/features/agent/hooks/useScreenFormState";
import { useLeaveGuard } from "@/features/project/hooks/useLeaveGuard";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi/meetingApi";
import type { MeetingDraft } from "@/features/project/meetings/api/meetingDraftApi";
import type { DraftApplyMode } from "@/features/project/meetings/components/modal/TranscriptUploadModal/TranscriptUploadModal";
import { useCreateMeetingDraftMutation } from "@/features/project/meetings/hooks/mutations/useCreateMeetingDraftMutation";
import type { MeetingData } from "@/features/project/meetings/types";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

export interface MeetingFormControllerOptions {
  mode: "create" | "edit";
  projectId: string;
  author?: string;
  initial?: MeetingData;
  initialAttendeeIds?: string[];
  attendeeOptions?: PeopleOption[];
  isSaving?: boolean;
  onSave?: (meeting: CreateMeetingRequest) => void;
  onExit: () => void;
}

export function useMeetingFormController({
  mode,
  projectId,
  author,
  initial,
  initialAttendeeIds = [],
  attendeeOptions = [],
  isSaving = false,
  onSave,
  onExit,
}: MeetingFormControllerOptions) {
  const authorLabel = initial?.author ?? author ?? "작성자 정보를 불러오는 중";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [pickedDate, setPickedDate] = useState(() =>
    mode === "create" ? todayISO() : (initial?.date ?? ""),
  );
  const [place, setPlace] = useState(initial?.place ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [followup, setFollowup] = useState(initial?.followup ?? "");
  const [attendees, setAttendees] = useState<string[]>(initialAttendeeIds);
  const [transcript, setTranscript] = useState<string | null>(
    initial?.transcript ?? null,
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{
    draft: MeetingDraft;
    fileName: string;
  } | null>(null);
  const dateTouchedRef = useRef(false);
  const attendeeOptionsRef = useRef(attendeeOptions);

  useEffect(() => {
    attendeeOptionsRef.current = attendeeOptions;
  }, [attendeeOptions]);

  const showToast = useToastStore((state) => state.showToast);
  const draftMutation = useCreateMeetingDraftMutation(projectId);
  const { data: project } = useProjectDetailQuery(projectId);
  const { data: me } = useMyProfileQuery();
  const lockedAttendeeIds = me ? [String(me.userId)] : [];
  const period = project
    ? { startDate: project.startDate, targetDate: project.endDate }
    : undefined;
  const today = todayISO();
  const lastDay =
    period && period.targetDate < today ? period.targetDate : today;
  const date = !period
    ? pickedDate
    : period.startDate > lastDay
      ? ""
      : clampDate(pickedDate, period.startDate, lastDay);

  const snapshot = useMemo(
    () => ({
      title: initial?.title ?? "",
      date: initial?.date ?? "",
      place: initial?.place ?? "",
      purpose: initial?.purpose ?? "",
      content: initial?.content ?? "",
      followup: initial?.followup ?? "",
      transcript: initial?.transcript ?? null,
      attendees: initialAttendeeIds,
    }),
    [initial, initialAttendeeIds],
  );
  const isDirty =
    title !== snapshot.title ||
    place !== snapshot.place ||
    purpose !== snapshot.purpose ||
    content !== snapshot.content ||
    followup !== snapshot.followup ||
    transcript !== snapshot.transcript ||
    (mode !== "create" && date !== snapshot.date) ||
    attendees.length !== snapshot.attendees.length ||
    attendees.some((attendee, index) => attendee !== snapshot.attendees[index]);
  const leaveGuard = useLeaveGuard(isDirty, onExit);
  const canSave = !!title.trim() && !!date && attendees.length > 0 && !isSaving;

  const applyDraft = (draft: MeetingDraft, applyMode: DraftApplyMode) => {
    const overwrite = (value: string | null) => (previous: string) =>
      value ?? previous;
    const fillEmpty = (value: string | null) => (previous: string) =>
      previous.trim() || !value ? previous : value;
    const appendBelow = (value: string | null) => (previous: string) =>
      !value
        ? previous
        : previous.trim()
          ? `${previous.trimEnd()}\n\n${value}`
          : value;
    const fillLine = applyMode === "overwrite" ? overwrite : fillEmpty;
    const fillText = applyMode === "overwrite" ? overwrite : appendBelow;

    setTitle(fillLine(draft.title));
    setPlace(fillLine(draft.location));
    setPurpose(fillLine(draft.purpose));
    setContent(fillText(draft.content));
    setFollowup(fillText(draft.followUp));
    if (
      draft.meetingDate &&
      (applyMode === "overwrite" || !dateTouchedRef.current)
    ) {
      setPickedDate(draft.meetingDate);
    }
    if (draft.attendeeUserIds.length > 0) {
      const candidates = new Set(
        attendeeOptionsRef.current.map((option) => option.id),
      );
      const picked = draft.attendeeUserIds
        .map(String)
        .filter((id) => candidates.has(id));
      if (picked.length > 0) {
        setAttendees((previous) => (previous.length > 0 ? previous : picked));
      }
    }
  };

  const conflictFields = useMemo(() => {
    if (!pendingDraft) return [];
    const { draft } = pendingDraft;
    const fields: Array<[
      current: string,
      drafted: string | null,
      label: string,
    ]> = [
      [title, draft.title, "회의명"],
      [place, draft.location, "장소"],
      [purpose, draft.purpose, "회의 목적"],
      [content, draft.content, "주요 내용"],
      [followup, draft.followUp, "후속 조치"],
    ];
    return fields
      .filter(([current, drafted]) => current.trim() && drafted)
      .map(([, , label]) => label);
  }, [pendingDraft, title, place, purpose, content, followup]);

  const uploadTranscript = (file: File) => {
    draftMutation.mutate(file, {
      onSuccess: (draft) => setPendingDraft({ draft, fileName: file.name }),
    });
  };
  const isEmptyDraft = (draft: MeetingDraft) =>
    !draft.title &&
    !draft.meetingDate &&
    !draft.location &&
    !draft.purpose &&
    !draft.content &&
    !draft.followUp &&
    draft.attendeeUserIds.length === 0;
  const applyPendingDraft = (applyMode: DraftApplyMode) => {
    if (!pendingDraft) return;
    applyDraft(pendingDraft.draft, applyMode);
    setTranscript(pendingDraft.fileName);
    showToast(
      isEmptyDraft(pendingDraft.draft)
        ? "파일에서 채울 내용을 찾지 못했어요. 직접 작성해 주세요."
        : "초안을 채웠어요. 내용을 확인해 주세요.",
    );
    setPendingDraft(null);
    draftMutation.reset();
    setUploadOpen(false);
  };
  const closeUpload = () => {
    setPendingDraft(null);
    draftMutation.reset();
    setUploadOpen(false);
  };

  useScreenFormState({
    mode,
    projectId,
    title,
    meetingDate: date,
    location: place,
    purpose,
    content,
    followUp: followup,
    attendeeIds: attendees,
    transcript,
  });

  const applyAgentFill = (formData: Record<string, unknown>) => {
    const text = (value: unknown) =>
      typeof value === "string" && value.trim() ? value : null;
    const draft: MeetingDraft = {
      title: text(formData.title),
      meetingDate: text(formData.meetingDate),
      location: text(formData.location),
      purpose: text(formData.purpose),
      content: text(formData.content),
      followUp: text(formData.followUp),
      attendeeUserIds: Array.isArray(formData.attendeeIds)
        ? formData.attendeeIds.filter(
            (id): id is number => typeof id === "number",
          )
        : [],
    };
    if (isEmptyDraft(draft)) {
      showToast("채울 수 있는 내용을 찾지 못했어요", "danger");
      return;
    }
    applyDraft(draft, "overwrite");
    showToast("작성 화면에 채웠어요. 내용을 확인해 주세요.");
  };

  useAgentFormFill(mode === "create" ? "MEETING_CREATE" : null, applyAgentFill);

  const save = () => {
    onSave?.({
      title: title.trim(),
      meetingDate: date,
      location: place.trim(),
      attendeeIds: attendees,
      purpose: purpose.trim(),
      content: content.trim(),
      followUp: followup.trim(),
      recording: transcript ?? undefined,
    });
  };
  const changeDate = (value: string) => {
    dateTouchedRef.current = true;
    setPickedDate(value);
  };

  return {
    authorLabel,
    title,
    setTitle,
    date,
    changeDate,
    place,
    setPlace,
    purpose,
    setPurpose,
    content,
    setContent,
    followup,
    setFollowup,
    attendees,
    setAttendees,
    transcript,
    setTranscript,
    uploadOpen,
    setUploadOpen,
    lockedAttendeeIds,
    period,
    leaveGuard,
    canSave,
    uploadTranscript,
    uploadError: draftMutation.error
      ? getApiErrorMessage(
          draftMutation.error,
          "초안을 만들지 못했어요. 파일을 확인한 뒤 다시 시도해 주세요.",
        )
      : null,
    draftReady: !!pendingDraft,
    conflictFields,
    applyPendingDraft,
    closeUpload,
    save,
  };
}
