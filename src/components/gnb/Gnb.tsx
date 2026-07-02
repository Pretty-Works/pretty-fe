import Link from "next/link";

import styles from "./Gnb.module.css";

export default function Gnb() {
  return (
    <header className={styles.gnb}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Pretty Works
        </Link>

        <nav className={styles.nav}>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
        </nav>
      </div>
    </header>
  );
}