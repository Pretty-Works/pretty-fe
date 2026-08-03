"use client";

import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

// 종일 같은 on/off 스위치. 켜지면 라벨도 보라색으로 바뀐다.
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <label className={`${styles.wrap} ${disabled ? styles.disabled : ""}`}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
