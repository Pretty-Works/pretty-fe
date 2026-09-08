import { useQuery } from "@tanstack/react-query";

import { fetchMilestones } from "../../api/milestoneApi";

export const milestonesQueryOptions = (projectId: string) => ({
  queryKey: ["project", "milestones", projectId] as const,
  queryFn: () => fetchMilestones(projectId),
  select: (data: Awaited<ReturnType<typeof fetchMilestones>>) => data.result,
});

export const useMilestonesQuery = (projectId: string) => {
  return useQuery({
    ...milestonesQueryOptions(projectId),
    enabled: !!projectId,
  });
};
