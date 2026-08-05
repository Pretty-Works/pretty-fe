import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createAgent,
  type AgentBody,
} from "../../api/agentApi";

export const useCreateAgentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agentChats"],
      });
    },
  });
};