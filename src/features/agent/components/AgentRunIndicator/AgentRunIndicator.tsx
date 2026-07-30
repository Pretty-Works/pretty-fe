"use client";

import { useEffect, useState } from "react";

import styles from "./AgentRunIndicator.module.css";

import { AGENT_LABELS, type AgentKind } from "@/features/agent/types";

interface AgentRunIndicatorProps {
  agents: AgentKind[];
}

export default function AgentRunIndicator({ agents }: AgentRunIndicatorProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const agent = agents[tick % agents.length] ?? agents[0];

  return (
    <div className={styles.wrap}>
      <span className={styles.spinner} />
      <span key={tick} className={styles.label}>
        {AGENT_LABELS[agent]}
      </span>
    </div>
  );
}
