"use client";

import Image from "next/image";

import LogoWhite from "@/assets/brand/logo-white.png";
import Logo from "@/assets/brand/logo.png";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";

import type { LoginViewModel } from "@/features/auth/login/hooks/useLoginViewModel";

import styles from "./LoginView.module.css";

export default function LoginView({ model }: { model: LoginViewModel }) {
  const {
    employeeNo,
    password,
    errors,
    serverError,
    isSubmitting,
    changeEmployeeNo,
    changePassword,
    submit,
    closeServerError,
  } = model;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <main className={styles.container}>
      {/* 브랜드 */}
      <section className={styles.brand} aria-hidden="true">
        <Image className={styles.brandLogo} src={LogoWhite} alt="" priority />
      </section>

      {/* 로그인 */}
      <section className={styles.side}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <Image
            className={styles.logo}
            src={Logo}
            alt="PRETTY WORKS"
            priority
          />

          <FormField
            label="사번 (ID)"
            placeholder="사번을 입력하세요"
            value={employeeNo}
            autoComplete="username"
            help={errors.employeeNo}
            hasError={!!errors.employeeNo || errors.credential}
            onChange={(e) => {
              changeEmployeeNo(e.target.value);
            }}
          />

          <FormField
            label="비밀번호"
            type="password"
            revealable
            placeholder="비밀번호를 입력하세요"
            value={password}
            autoComplete="current-password"
            help={errors.password}
            hasError={!!errors.password || errors.credential}
            onChange={(e) => {
              changePassword(e.target.value);
            }}
          />

          <Button
            type="brand"
            htmlType="submit"
            size="big"
            display="full"
            loading={isSubmitting}
          >
            로그인
          </Button>
        </form>
      </section>

      {/* 서버 오류 안내 */}
      <Modal
        open={!!serverError}
        onClose={closeServerError}
        title="로그인 실패"
        width={400}
        footer={<Button onClick={closeServerError}>확인</Button>}
      >
        <p className={styles.errorText}>{serverError}</p>
      </Modal>
    </main>
  );
}
