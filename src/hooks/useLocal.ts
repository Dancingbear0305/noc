import { useState } from "react";
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem("noc:" + key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const [error, setError] = useState("");
  function save(next: T) {
    try {
      localStorage.setItem("noc:" + key, JSON.stringify(next));
      setValue(next);
      setError("");
      return true;
    } catch {
      setError("本機儲存失敗，請確認瀏覽器空間或隱私設定。");
      return false;
    }
  }
  return [value, save, error] as const;
}
