import type { Product, ExceptionNote } from "../types";
export interface Selection {
  productId: string;
  region: string;
  idc: string;
}
export function matchesSelection(p: Product, s: Selection) {
  return (
    (!s.productId || p.id === s.productId) &&
    (!s.region || p.regions.includes(s.region)) &&
    (!s.idc ||
      p.idcMappings.some(
        (m) =>
          m.idcLocation === s.idc &&
          (!s.region ||
            m.serviceRegion === null ||
            m.serviceRegion === s.region),
      ))
  );
}
export function available(
  products: Product[],
  s: Selection,
  field: keyof Selection,
) {
  const relaxed = { ...s, [field]: "" };
  const rows = products.filter((p) => matchesSelection(p, relaxed));
  return field === "productId"
    ? rows.map((p) => p.id)
    : field === "region"
      ? [
          ...new Set(
            rows.flatMap((p) =>
              p.regions.filter(
                (r) =>
                  !s.idc ||
                  p.idcMappings.some(
                    (m) =>
                      m.idcLocation === s.idc &&
                      (m.serviceRegion === null || m.serviceRegion === r),
                  ),
              ),
            ),
          ),
        ].sort()
      : [
          ...new Set(
            rows.flatMap((p) =>
              p.idcMappings
                .filter(
                  (m) =>
                    !s.region ||
                    m.serviceRegion === null ||
                    m.serviceRegion === s.region,
                )
                .map((m) => m.idcLocation),
            ),
          ),
        ].sort();
}
export interface DeskSession extends Selection {
  startedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
}
export function elapsedSeconds(session: DeskSession, now: number) {
  return session.startedAt === null
    ? 0
    : Math.max(
        0,
        Math.floor(
          ((session.pausedAt ?? now) - session.startedAt - session.pausedMs) /
            1000,
        ),
      );
}
export function timerLevel(seconds: number) {
  return seconds >= 480 ? 8 : seconds >= 300 ? 5 : 0;
}
export function eventKey(title: string, region: string) {
  return (
    title.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ") +
    "|" +
    region
  );
}
export interface Activity extends ExceptionNote {
  region?: string;
}
export interface Observation {
  id: string;
  eventKey: string;
  eventTitle: string;
  eventDate: string;
  region: string;
  productId: string;
  direction: "上升" | "下降" | "無明顯變化";
  percent: number | null;
  note: string;
  createdAt: string;
}
export function observationError(
  direction: Observation["direction"],
  percent: string,
) {
  if (!percent.trim()) return "";
  const n = Number(percent);
  return !Number.isFinite(n) || n < 0 || (direction === "下降" && n > 100)
    ? "請填非負有限百分比，下降不可超過 100%。"
    : "";
}
