export type Status = "confirmed" | "verify" | "unrecorded";
export interface IDCMapping {
  serviceRegion: string | null;
  vendor: string;
  idcLocation: string;
  notes: string;
  verificationStatus: Status;
}
export interface Product {
  id: string;
  code: string;
  regions: string[];
  responsibleTeams: Record<string, string>;
  idcMappings: IDCMapping[];
  notes: string;
  verificationStatus: Status;
}
export interface QuickLink {
  id: string;
  name: string;
  url: string;
  category: string;
  productIds: string[];
  regionIds: string[];
  issueTypes: string[];
  description: string;
}
export interface FlowNode {
  id: string;
  question: string;
  options: string[];
  nextNodeId: string | null;
}
export interface TroubleshootingFlow {
  id: string;
  title: string;
  description: string;
  nodes: FlowNode[];
  relatedKnowledge: string[];
  relatedLinks: string[];
  version: string;
}
export interface Incident {
  id: string;
  time: string;
  product: string;
  region: string;
  issue: string;
  observations: Record<string, string>;
  checks: string[];
  unknowns: string[];
  possibleTeams: string[];
  hypotheses: string[];
  status: "待確認" | "調查中" | "已恢復（使用者確認）";
}
export interface KnowledgeArticle {
  id: string;
  title: string;
  fullName: string;
  category: string;
  content: string;
  example: string;
  use: string;
  caution: string;
  tags: string[];
  relatedLinks: string[];
}
export interface AIAnalysisService {
  analyze(
    incident: Readonly<Incident>,
  ): Promise<{ hypotheses: string[]; suggestedChecks: string[] }>;
}

/** User-authored context only; never a confirmed explanation of an incident. */
export interface ExceptionNote {
  id: string;
  title: string;
  category: "節假日" | "球賽／活動" | "CCU 觀察" | "其他";
  startDate: string;
  endDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
