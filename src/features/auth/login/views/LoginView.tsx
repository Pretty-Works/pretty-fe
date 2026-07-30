'use client';

import { useState } from "react";

import Link from "next/link";
import Image from "next/image";

import FormField from "@/components/FormField/FormField";
import Button from "@/components/Button/Button";

import Logo from "@/assets/brand/logo.png";
import LogoWhite from "@/assets/brand/logo-white.png";

import styles from "./page.module.css";

export default function LoginView() {
  // State
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  // Ref

  // Query

  // Event Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 API 연결
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
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />

          <FormField
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            status="primary"
            name="로그인"
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
    </main>
  );
}
