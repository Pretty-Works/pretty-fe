import { useMutation } from "@tanstack/react-query";

import { login } from "../../api/authApi";

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
  });
};
