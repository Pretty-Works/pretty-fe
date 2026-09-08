"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import axios from "axios";

import { SESSION_END_MESSAGE_KEY } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errorCode";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

import { useLoginMutation } from "@/features/auth/login/hooks/mutations/useLoginMutation";

interface FieldErrors {
  employeeNo?: string;
  password?: string;
  credential?: boolean;
}

const AFTER_LOGIN = "/";

export function useLoginViewModel() {
  const router = useRouter();
  const [employeeNo, setEmployeeNo] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const { mutate: login, isPending } = useLoginMutation();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const message = sessionStorage.getItem(SESSION_END_MESSAGE_KEY);
    if (!message) return;

    sessionStorage.removeItem(SESSION_END_MESSAGE_KEY);
    showToast(message, "danger");
  }, [showToast]);

  useEffect(() => {
    if (useAuthStore.getState().accessToken) router.replace(AFTER_LOGIN);
  }, [router]);

  const submit = () => {
    setServerError("");

    const nextErrors: FieldErrors = {};
    if (!employeeNo.trim()) nextErrors.employeeNo = "필수 입력 항목이에요";
    if (!password) nextErrors.password = "필수 입력 항목이에요";

    setErrors(nextErrors);
    if (nextErrors.employeeNo || nextErrors.password) return;

    login(
      { employeeNo, password },
      {
        onSuccess: (data) => {
          setAccessToken(data.result.accessToken);
          router.push(AFTER_LOGIN);
        },
        onError: (error) => {
          const status = axios.isAxiosError(error)
            ? error.response?.status
            : undefined;

          if (status === 400 || status === 401) {
            setErrors({
              password: getApiErrorMessage(
                error,
                "사번 또는 비밀번호를 확인해 주세요.",
              ),
              credential: true,
            });
            return;
          }

          setServerError("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
        },
      },
    );
  };

  return {
    employeeNo,
    password,
    errors,
    serverError,
    isSubmitting: isPending,
    changeEmployeeNo: (value: string) => {
      setEmployeeNo(value);
      setErrors((previous) => ({
        ...previous,
        employeeNo: undefined,
        credential: false,
      }));
    },
    changePassword: (value: string) => {
      setPassword(value);
      setErrors((previous) => ({
        ...previous,
        password: undefined,
        credential: false,
      }));
    },
    submit,
    closeServerError: () => setServerError(""),
  };
}

export type LoginViewModel = ReturnType<typeof useLoginViewModel>;
