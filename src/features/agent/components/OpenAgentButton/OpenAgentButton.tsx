"use client";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";

import styles from "./OpenAgentButton.module.css";

interface OpenAgentButtonProps {
  children: React.ReactNode;
}

export default function OpenAgentButton({ children }: OpenAgentButtonProps) {
  const openAgent = useAgentStore((state) => state.openAgent);

  return (
    <button type="button" className={styles.button} onClick={openAgent}>
      {children}
    </button>
  );
}
