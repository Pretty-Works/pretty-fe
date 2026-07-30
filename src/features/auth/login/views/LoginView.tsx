'use client';

import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import axios from "axios";

import FormField from "@/components/FormField/FormField";
import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import { useLoginMutation } from "@/features/auth/login/hooks/mutations/useLoginMutation";
import { useAuthStore } from "@/stores/useAuthStore";

import Logo from "@/assets/brand/logo.png";
import LogoWhite from "@/assets/brand/logo-white.png";

import styles from "./LoginView.module.css";

interface FieldErrors {
  employeeNo?: string;
  password?: string;
  // 자격 오류(사번/비번 불일치): 두 필드 모두 에러 테두리 표시
  credential?: boolean;
}

export default function LoginView() {
  // State
  const router = useRouter();
  const [employeeNo, setEmployeeNo] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  // Ref

  // Query
  const { mutate: login, isPending } = useLoginMutation();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // Event Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // 미입력 검증 — 해당 필드에 에러 표시
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
          router.push("/");
        },
        onError: (err) => {
          const status = axios.isAxiosError(err)
            ? err.response?.status
            : undefined;
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message
            : undefined;

          // 입력·자격 오류(400·401)는 필드 인라인으로 표시
          // 자격 오류는 두 필드 모두 에러 테두리, 메시지는 한 번만
          if (status === 400 || status === 401) {
            setErrors({
              password: message ?? "사번 또는 비밀번호를 확인해 주세요.",
              credential: true,
            });
            return;
          }

          // 서버 오류(5xx·네트워크·CORS)는 모달로 안내
          setServerError("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
        },
      },
    );
  };

  // Effect

  return (
    <main className={styles.container}>
      {/* 브랜드 */}
      <section className={styles.brand} aria-hidden="true">
        <Image className={styles.brandLogo} src={LogoWhite} alt="" priority />
      </section>

      {/* 로그인 */}
      <section className={styles.side}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <Image className={styles.logo} src={Logo} alt="PRETTY WORKS" priority />

          <FormField
            label="사번 (ID)"
            placeholder="사번을 입력하세요"
            value={employeeNo}
            error={errors.employeeNo}
            invalid={errors.credential}
            onChange={(e) => {
              setEmployeeNo(e.target.value);
              setErrors((prev) => ({
                ...prev,
                employeeNo: undefined,
                credential: false,
              }));
            }}
          />

          <FormField
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            error={errors.password}
            invalid={errors.credential}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                credential: false,
              }));
            }}
          />

          <Button
            type="submit"
            status="primary"
            name={isPending ? "로그인 중…" : "로그인"}
            disabled={isPending}
            className={styles.submit}
          />

          <p className={styles.signup}>
            아직 계정이 없으신가요?{" "}
            <Link className={styles.signupLink} href="/signup">
              회원가입
            </Link>
          </p>
        </form>
      </section>

      {/* 서버 오류 안내 */}
      <Modal
        open={!!serverError}
        onClose={() => setServerError("")}
        title="로그인 실패"
        width={400}
        footer={
          <Button
            status="primary"
            name="확인"
            onClick={() => setServerError("")}
          />
        }
      >
        <p className={styles.errorText}>{serverError}</p>
      </Modal>
    </main>
  );
}
