// Public geographic entry points only; never product/infrastructure mappings.
export const regionalTools: Record<string, { name: string; url: string }[]> = {
  TW: [
    { name: "Downdetector 台灣", url: "https://downdetector.tw/" },
    { name: "中央社", url: "https://www.cna.com.tw/" },
  ],
  TH: [
    { name: "Downdetector 泰國", url: "https://downdetector.co.th/" },
    { name: "Thai PBS World", url: "https://www.thaipbsworld.com/" },
  ],
  VN: [
    { name: "VnExpress International", url: "https://e.vnexpress.net/" },
    { name: "Việt Nam News", url: "https://vietnamnews.vn/" },
  ],
  ID: [
    { name: "Downdetector 印尼", url: "https://downdetector.id/" },
    { name: "ANTARA", url: "https://en.antaranews.com/" },
  ],
  SG: [
    { name: "Downdetector 新加坡", url: "https://downdetector.sg/" },
    { name: "CNA", url: "https://www.channelnewsasia.com/" },
  ],
  MY: [{ name: "Downdetector 馬來西亞", url: "https://downdetector.my/" }],
  PH: [{ name: "Downdetector 菲律賓", url: "https://downdetector.ph/" }],
  US: [{ name: "Downdetector 美國", url: "https://downdetector.com/" }],
  GB: [{ name: "Downdetector 英國", url: "https://downdetector.co.uk/" }],
  BR: [{ name: "Downdetector 巴西", url: "https://downdetector.com.br/" }],
};

const newsEntries: Record<string, { name: string; url: string }> = {
  MY: { name: "BERNAMA（馬來西亞）", url: "https://www.bernama.com/en/" },
  PH: { name: "Philippine News Agency", url: "https://www.pna.gov.ph/" },
  HK: { name: "RTHK 香港新聞", url: "https://news.rthk.hk/rthk/en/" },
  CN: { name: "新華社英文版", url: "https://english.news.cn/" },
  IND: { name: "The Hindu（印度）", url: "https://www.thehindu.com/" },
  GB: { name: "BBC News（英國）", url: "https://www.bbc.com/news" },
  US: { name: "AP News", url: "https://apnews.com/" },
  BR: { name: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/en" },
  MX: { name: "Mexico News Daily", url: "https://mexiconewsdaily.com/" },
  AR: { name: "Buenos Aires Herald", url: "https://buenosairesherald.com/" },
  TR: { name: "Anadolu Agency（國營）", url: "https://www.aa.com.tr/en" },
  BD: {
    name: "The Daily Star（孟加拉）",
    url: "https://www.thedailystar.net/",
  },
  PK: { name: "Dawn（巴基斯坦）", url: "https://www.dawn.com/" },
  EU: {
    name: "Reuters 歐洲入口",
    url: "https://www.reuters.com/world/europe/",
  },
  RU: {
    name: "Reuters 歐洲入口（含其他地區，需核對）",
    url: "https://www.reuters.com/world/europe/",
  },
  ME: {
    name: "Reuters 中東入口",
    url: "https://www.reuters.com/world/middle-east/",
  },
  IQ: {
    name: "Reuters 中東入口（含其他地區，需核對）",
    url: "https://www.reuters.com/world/middle-east/",
  },
  NA: { name: "AP 全球新聞入口（需核對地區）", url: "https://apnews.com/" },
  SAC: { name: "AP 全球新聞入口（需核對地區）", url: "https://apnews.com/" },
  SMP: {
    name: "CNA 亞洲新聞入口（需核對地區）",
    url: "https://www.channelnewsasia.com/",
  },
};
for (const [region, entry] of Object.entries(newsEntries)) {
  regionalTools[region] = [...(regionalTools[region] ?? []), entry];
}
