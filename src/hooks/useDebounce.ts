import { useEffect, useState } from "react";

// 값이 delay(ms) 동안 안정되면 그때 반영. 검색어 등 API 호출 빈도를 줄일 때 사용.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
