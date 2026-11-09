import type { ExceptionNote } from "../types";

export const exceptionCategories: ExceptionNote["category"][] = [
  "節假日",
  "球賽／活動",
  "CCU 觀察",
  "其他",
];

/** Calendar dates in the user's device timezone, without UTC conversion. */
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return localDate(new Date(year, month - 1, day + days, 12));
}
export function thisWeek(date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const monday = shiftDate(localDate(date), -((date.getDay() + 6) % 7));
  return { startDate: monday, endDate: shiftDate(monday, 6) };
}
function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  return (
    y >= 1900 && y <= 9999 && localDate(new Date(y, m - 1, d, 12)) === value
  );
}
export function noteError(
  note: Pick<ExceptionNote, "title" | "startDate" | "endDate">,
): string {
  if (!note.title.trim() || note.title.trim().length > 100)
    return "請輸入 1–100 字的提醒標題。";
  if (!isDate(note.startDate) || !isDate(note.endDate))
    return "請填寫有效的開始與結束日期。";
  if (note.endDate < note.startDate) return "結束日期不能早於開始日期。";
  return "";
}
export function isExceptionNote(value: unknown): value is ExceptionNote {
  if (!value || typeof value !== "object") return false;
  const n = value as ExceptionNote;
  return (
    typeof n.id === "string" &&
    typeof n.title === "string" &&
    typeof n.note === "string" &&
    n.note.length <= 500 &&
    exceptionCategories.includes(n.category) &&
    typeof n.createdAt === "string" &&
    typeof n.updatedAt === "string" &&
    !noteError(n)
  );
}
export function exceptionStatus(
  note: ExceptionNote,
  today: string,
): "有效中" | "即將到來" | "已結束" {
  return note.startDate > today
    ? "即將到來"
    : note.endDate < today
      ? "已結束"
      : "有效中";
}
export function recentExceptions(
  notes: ExceptionNote[],
  today: string,
  all = false,
): ExceptionNote[] {
  const priority = { 有效中: 0, 即將到來: 1, 已結束: 2 };
  return notes
    .filter(
      (n) =>
        all ||
        (n.endDate >= shiftDate(today, -7) &&
          n.startDate <= shiftDate(today, 7)),
    )
    .sort(
      (a, b) =>
        priority[exceptionStatus(a, today)] -
          priority[exceptionStatus(b, today)] ||
        (exceptionStatus(a, today) === "已結束"
          ? b.endDate.localeCompare(a.endDate)
          : a.startDate.localeCompare(b.startDate)) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
}
