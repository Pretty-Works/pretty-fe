"use client";

import Checkbox from "@/components/Checkbox/Checkbox";

import styles from "./CheckboxField.module.css";

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// 체크박스 + 라벨. 글자를 눌러도 켜지도록 <label>로 감싼다.
export default function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label className={styles.field}>
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
