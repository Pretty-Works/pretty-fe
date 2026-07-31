import { useQuery } from "@tanstack/react-query";

import { fetchRequests, type ConfirmRequest } from "../../api/homeApi";

export const useRequestsQuery = () => {
  return useQuery({
    queryKey: ["home", "requests"],
    queryFn: fetchRequests,

    select: (data) =>
      data.result.content.map(
        (request): ConfirmRequest => ({
          id: String(request.requestId),
          label: request.title,
          options: request.options.map((option) => ({
            id: String(option.optionId),
            label: option.label,
          })),
        }),
      ),
  });
};
