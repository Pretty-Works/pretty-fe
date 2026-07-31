import { useQuery } from "@tanstack/react-query";

import { fetchMilestones } from "../../api/milestoneApi";

export const useMilestonesQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,

    select: (data) => data.result,
  });
};
