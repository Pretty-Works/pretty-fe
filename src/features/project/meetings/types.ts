export interface MeetingActionItem {
  task: string;
  owner: string;
  due: string;
  status: "진행중" | "예정" | "완료";
}

export interface MeetingData {
  title: string;
  code?: string;
  date: string; // "YYYY-MM-DD"
  place: string;
  project: string;
  author: string;
  attendees: string[];
  transcript?: string;
  purpose: string;
  content: string;
  followup: string;
  actionItems?: MeetingActionItem[];
}
