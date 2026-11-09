import { describe, it, expect } from "vitest";
import type { ExceptionNote } from "../src/types";
import {
  exceptionStatus,
  isExceptionNote,
  localDate,
  noteError,
  recentExceptions,
  shiftDate,
  thisWeek,
} from "../src/services/exceptions";
const example: ExceptionNote = {
  id: "synthetic",
  title: "公開合成活動提醒",
  category: "球賽／活動",
  startDate: "2026-11-02",
  endDate: "2026-11-08",
  note: "僅供測試，非真實監控資訊。",
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
};
describe("特例日期與近期清單", () => {
  it("本週採週一至週日，週日仍屬同週", () => {
    expect(thisWeek(new Date(2026, 10, 8, 12))).toEqual({
      startDate: "2026-11-02",
      endDate: "2026-11-08",
    });
    expect(thisWeek(new Date(2026, 10, 9, 12))).toEqual({
      startDate: "2026-11-09",
      endDate: "2026-11-15",
    });
    expect(thisWeek(new Date(2026, 0, 1, 12))).toEqual({
      startDate: "2025-12-29",
      endDate: "2026-01-04",
    });
  });
  it("以裝置日曆日期處理跨月與閏日", () => {
    expect(localDate(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
    expect(shiftDate("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("有效期間含起迄日，不把未來或過期當成有效", () => {
    expect(exceptionStatus(example, "2026-11-01")).toBe("即將到來");
    expect(exceptionStatus(example, "2026-11-02")).toBe("有效中");
    expect(exceptionStatus(example, "2026-11-08")).toBe("有效中");
    expect(exceptionStatus(example, "2026-11-09")).toBe("已結束");
  });
  it("近期包含前後七天及長期仍有效提醒；全部保留遠期資料", () => {
    const future = {
      ...example,
      id: "future",
      startDate: "2026-12-01",
      endDate: "2026-12-01",
    };
    const old = {
      ...example,
      id: "old",
      startDate: "2026-01-01",
      endDate: "2026-01-01",
    };
    const long = {
      ...example,
      id: "long",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    };
    expect(
      recentExceptions([future, old, example, long], "2026-11-06").map(
        (x) => x.id,
      ),
    ).toEqual(["long", "synthetic"]);
    expect(
      recentExceptions([future, old, example, long], "2026-11-06", true),
    ).toHaveLength(4);
  });
  it("有效中優先，其次未來，最後已結束", () => {
    const past = {
      ...example,
      id: "past",
      startDate: "2026-11-01",
      endDate: "2026-11-02",
    };
    const next = {
      ...example,
      id: "next",
      startDate: "2026-11-10",
      endDate: "2026-11-12",
    };
    expect(
      recentExceptions([past, next, example], "2026-11-06").map((n) => n.id),
    ).toEqual(["synthetic", "next", "past"]);
  });
});
describe("特例驗證", () => {
  it("拒絕空白標題、過長標題、日期逆序與不存在日期", () => {
    expect(noteError({ ...example, title: "   " })).not.toBe("");
    expect(noteError({ ...example, title: "字".repeat(101) })).not.toBe("");
    expect(noteError({ ...example, endDate: "2026-11-01" })).not.toBe("");
    expect(noteError({ ...example, startDate: "2026-02-30" })).not.toBe("");
    expect(noteError({ ...example, startDate: "invalid" })).not.toBe("");
    expect(noteError(example)).toBe("");
  });
  it("載入時忽略格式損壞的本機紀錄", () => {
    expect(isExceptionNote(example)).toBe(true);
    for (const value of [
      null,
      {},
      { ...example, category: "invalid" },
      { ...example, note: "字".repeat(501) },
      { ...example, startDate: null },
    ])
      expect(isExceptionNote(value)).toBe(false);
  });
});
