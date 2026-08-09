import { api } from "@/lib/api/client";

export type ProjectSummarySection = "overview" | "board" | "budget" | "meeting";

export interface ProjectSummaryStat {
  label: string;
  value: string;
}

export interface ProjectSummaryBanner {
  section: string;
  headline: string;
  detail: string[];
  stats: ProjectSummaryStat[];
}

export interface ProjectSummary {
  generatedAt: number | null;
  banners: ProjectSummaryBanner[];
}

interface ProjectSummaryApiItem {
  section?: string;
  headline?: string;
  detail?: string[];
  stats?: Array<{ label?: string; value?: string }>;
}

interface ProjectSummaryApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    projectId: number;
    generatedAt: string | null;
    summaries: ProjectSummaryApiItem[];
  };
}

const toStats = (stats: ProjectSummaryApiItem["stats"]): ProjectSummaryStat[] =>
  (stats ?? []).flatMap((stat) =>
    stat.label && stat.value ? [{ label: stat.label, value: stat.value }] : [],
  );

const toBanners = (
  summaries: ProjectSummaryApiItem[],
): ProjectSummaryBanner[] =>
  summaries.flatMap((summary) =>
    summary.section && summary.headline
      ? [
          {
            section: summary.section,
            headline: summary.headline,
            detail: summary.detail ?? [],
            stats: toStats(summary.stats),
          },
        ]
      : [],
  );

const toSummary = (
  result: ProjectSummaryApiResponse["result"],
): ProjectSummary => ({
  generatedAt: result.generatedAt
    ? new Date(result.generatedAt).getTime()
    : null,
  banners: toBanners(result.summaries ?? []),
});

export const fetchProjectSummary = async (
  projectId: string,
): Promise<ProjectSummary> => {
  const response = await api.get<ProjectSummaryApiResponse>(
    `/projects/${projectId}/summary`,
  );

  return toSummary(response.data.result);
};

export const refreshProjectSummary = async (
  projectId: string,
): Promise<ProjectSummary> => {
  const response = await api.post<ProjectSummaryApiResponse>(
    `/projects/${projectId}/summary`,
  );

  return toSummary(response.data.result);
};
