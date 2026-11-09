import type { TroubleshootingFlow } from "../types";
export const issueTypes = [
  "CCU 異常下降",
  "玩家登入異常",
  "Ping／Latency 異常",
  "Packet Loss 異常",
  "MTR 網路路徑異常",
  "API RPS 下降",
  "Disk Utilization 過高",
  "DDoS 相關告警",
  "SSH／系統設定異動",
  "其他告警",
];
export const ccuFlow: TroubleshootingFlow = {
  id: "ccu",
  title: issueTypes[0],
  description: "比較趨勢、確認影響範圍，建立可交接的初步排查摘要。",
  version: "1.0",
  relatedKnowledge: ["CCU", "MTR", "MA"],
  relatedLinks: [
    "CCU Dashboard",
    "SGS Monitoring",
    "ISP Monitoring",
    "相關 SOP",
  ],
  nodes: [
    {
      id: "trend",
      question: "觀察到哪一種 CCU 變化？",
      options: [
        "CCU 突然下降",
        "CCU 持續波動",
        "CCU 低於 1D 趨勢",
        "CCU 低於 7D 趨勢",
        "CCU 已開始恢復",
      ],
      nextNodeId: "scope",
    },
    {
      id: "scope",
      question: "其他同地區產品是否同步下降？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: "login",
    },
    {
      id: "login",
      question: "SGS 登入相關指標目前如何？",
      options: ["正常", "異常", "尚未確認"],
      nextNodeId: "ma",
    },
    {
      id: "ma",
      question: "是否有 MA（維護通知）？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: "holiday",
    },
    {
      id: "holiday",
      question: "是否有當地假日或特殊活動？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: "players",
    },
    {
      id: "players",
      question: "是否有玩家回報？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: "isp",
    },
    {
      id: "isp",
      question: "是否有 ISP 異常資訊？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: "idc",
    },
    {
      id: "idc",
      question: "是否已查閱相關 IDC 資訊？",
      options: ["是", "否", "尚未確認"],
      nextNodeId: null,
    },
  ],
};
export const genericChecks: Record<string, string[]> = {
  玩家登入異常: [
    "比較登入成功率與錯誤碼",
    "確認影響產品、地區與開始時間",
    "查看 SGS 指標與 MA",
  ],
  "Ping／Latency 異常": [
    "確認探測來源與目的地",
    "比較歷史延遲及多個探測點",
    "檢查端到端 MTR，避免僅憑單跳判斷",
  ],
  "Packet Loss 異常": [
    "確認目的端是否持續丟包",
    "比較多個來源與時間窗口",
    "中間節點不回 ICMP 不等於服務丟包",
  ],
  "MTR 網路路徑異常": [
    "保存時間與探測方向",
    "比較目的端與後續跳點丟包",
    "路徑非對稱時需雙向佐證",
  ],
  "API RPS 下降": [
    "比較流量、錯誤率與延遲",
    "確認 MA、流量來源與統計窗口",
    "檢查是否為採集缺口",
  ],
  "Disk Utilization 過高": [
    "確認指標是 I/O 忙碌度或容量使用率",
    "比較 I/O latency 與吞吐量",
    "依核准 SOP 查閱程序；不要自行刪除檔案",
  ],
  "DDoS 相關告警": [
    "確認防護平台告警與流量基線",
    "記錄影響範圍與服務可用性",
    "依正式 SOP 聯絡資安／Infra；不要自行 Blackhole",
  ],
  "SSH／系統設定異動": [
    "確認是否為已核准變更",
    "依授權查閱稽核紀錄",
    "依正式 SOP 通報；不要自行回滾",
  ],
  其他告警: [
    "確認告警名稱、時間與影響範圍",
    "交叉比對監控與維護通知",
    "依正式 SOP 尋求協助",
  ],
};
