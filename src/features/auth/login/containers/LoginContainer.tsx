"use client";

import { useLoginViewModel } from "@/features/auth/login/hooks/useLoginViewModel";
import LoginView from "@/features/auth/login/views/LoginView/LoginView";

export default function LoginContainer() {
  const model = useLoginViewModel();

  return <LoginView model={model} />;
}
