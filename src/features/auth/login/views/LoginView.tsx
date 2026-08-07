'use client';

import { useEffect, useState } from "react";

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

  // 로그인 뒤에는 언제나 홈에서 시작한다.
  // 세션이 끊겨 보던 화면으로 되돌리는 것보다, 로그인이 늘 같은 곳에서 끝나는 편이 예측하기 쉽다.
  // (프로젝트로 이어서 가려면 상단바 '프로젝트'가 마지막으로 보던 프로젝트를 기억한다)
  const AFTER_LOGIN = "/";

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
          router.push(AFTER_LOGIN);
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
  // 이미 로그인한 채로 들어온 경우(뒤로가기·주소 직접 입력)엔 로그인 폼을 보여줄 이유가 없다.
  // 마운트 시점의 상태만 보므로(구독하지 않는다) 로그인 성공 직후의 이동과 겹치지 않는다.
  useEffect(() => {
    if (useAuthStore.getState().accessToken) router.replace(AFTER_LOGIN);
  }, [router]);

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
            help={errors.employeeNo}
            hasError={!!errors.employeeNo || errors.credential}
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
            revealable
            placeholder="비밀번호를 입력하세요"
            value={password}
            help={errors.password}
            hasError={!!errors.password || errors.credential}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                credential: false,
              }));
            }}
          />

          <Button htmlType="submit" size="big" display="full" loading={isPending}>
            로그인
          </Button>
        </form>
      </section>

      {/* 서버 오류 안내 */}
      <Modal
        open={!!serverError}
        onClose={() => setServerError("")}
        title="로그인 실패"
        width={400}
        footer={
          <Button onClick={() => setServerError("")}>확인</Button>
        }
      >
        <p className={styles.errorText}>{serverError}</p>
      </Modal>
    </main>
  );
}
