import type { Product, TroubleshootingFlow, Incident } from "../types";
import { ccuFlow, genericChecks, issueTypes } from "../data/flows";
export function queryProducts(
  products: Product[],
  q = "",
  region = "",
  idc = "",
) {
  return products.filter(
    (p) =>
      (!q || JSON.stringify(p).toLowerCase().includes(q.toLowerCase())) &&
      (!region || p.regions.includes(region)) &&
      (!idc || p.idcMappings.some((m) => m.idcLocation === idc)),
  );
}
export function validateFlow(flow: TroubleshootingFlow) {
  const ids = new Set(flow.nodes.map((n) => n.id));
  if (ids.size !== flow.nodes.length) throw Error("節點 ID 重複");
  for (const node of flow.nodes) {
    const seen = new Set<string>();
    let current: typeof node | undefined = node;
    while (current) {
      if (seen.has(current.id)) throw Error("流程存在循環");
      seen.add(current.id);
      if (current.nextNodeId && !ids.has(current.nextNodeId))
        throw Error("流程指向不存在節點");
      current = flow.nodes.find((n) => n.id === current!.nextNodeId);
    }
  }
  return true;
}
export function recommendations(a: Record<string, string>, issue: string) {
  if (issue !== issueTypes[0])
    return genericChecks[issue] ?? genericChecks["其他告警"];
  return [
    ...(a.scope === "是"
      ? [
          "比較各產品下降時間",
          "查詢是否共用 ISP 或 IDC",
          "建議參考 SG NOC／Infra 排查方向",
        ]
      : a.scope === "否"
        ? [
            "查看單一遊戲服務告警",
            "確認 GTO／GRE 維運歸屬",
            "檢查 MA 與玩家回報",
          ]
        : ["先比較同地區其他產品，確認影響範圍"]),
    "確認 SGS 登入指標與採集是否正常",
    "比較 1D／7D 趨勢及維護、當地活動資訊",
    ...(a.trend === "CCU 已開始恢復"
      ? ["持續觀察恢復趨勢；尚不能宣稱事件已完成"]
      : []),
  ];
}
export function makeIncident(
  product: Product,
  region: string,
  issue: string,
  a: Record<string, string>,
): Incident {
  return {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    product: product.code,
    region,
    issue,
    observations: a,
    checks: recommendations(a, issue),
    unknowns: ccuFlow.nodes
      .filter(
        (n) => issue === issueTypes[0] && (!a[n.id] || a[n.id] === "尚未確認"),
      )
      .map((n) => n.question),
    possibleTeams: product.responsibleTeams[region]
      ? [product.responsibleTeams[region]]
      : [],
    hypotheses: [],
    status: "待確認",
  };
}
export function summary(i: Incident, markdown = false) {
  const heading = markdown ? "## " : "";
  return `${heading}初步排查摘要（非正式 SOP）\n時間：${new Date(i.time).toLocaleString("zh-TW")}\n產品／地區：${i.product}／${i.region}\n異常：${i.issue}\n狀態：${i.status}\n已知資訊：\n${Object.entries(
    i.observations,
  )
    .map(
      ([k, v]) =>
        `${ccuFlow.nodes.find((n) => n.id === k)?.question ?? k} ${v}`,
    )
    .join(
      "\n",
    )}\n建議檢查（不代表已執行）：\n${i.checks.join("\n")}\n尚需確認：${i.unknowns.join("；") || "仍需依正式 SOP 確認事件範圍與根因"}\n可能涉及團隊：${i.possibleTeams.join("、") || "未記錄，請確認"}\n根因：未確認`;
}
export function validateProducts(value: unknown): Product[] {
  if (!Array.isArray(value) || !value.length || value.length > 500)
    throw Error("產品清單格式不正確（1–500 筆）");
  const ids = new Set<string>();
  for (const p of value) {
    if (
      !p ||
      typeof p.id !== "string" ||
      ids.has(p.id) ||
      typeof p.code !== "string" ||
      !Array.isArray(p.regions) ||
      !p.regions.every((x: unknown) => typeof x === "string") ||
      typeof p.notes !== "string" ||
      !["confirmed", "verify", "unrecorded"].includes(p.verificationStatus) ||
      !p.responsibleTeams ||
      typeof p.responsibleTeams !== "object" ||
      Array.isArray(p.responsibleTeams) ||
      !Object.values(p.responsibleTeams).every((x) => typeof x === "string") ||
      !Array.isArray(p.idcMappings)
    )
      throw Error("產品欄位格式不正確");
    ids.add(p.id);
    for (const m of p.idcMappings)
      if (
        !m ||
        !(m.serviceRegion === null || p.regions.includes(m.serviceRegion)) ||
        !["vendor", "idcLocation", "notes"].every(
          (k) => typeof m[k] === "string",
        ) ||
        !["confirmed", "verify", "unrecorded"].includes(m.verificationStatus)
      )
        throw Error("IDC 對應格式不正確");
  }
  return value;
}
export function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
