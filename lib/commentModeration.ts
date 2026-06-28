export type CommentModerationStatus = "visible" | "review";

export interface CommentModerationResult {
  status: CommentModerationStatus;
  matchedTerms: string[];
  categories: string[];
}

type MatchMode = "compact" | "word";

interface BlockedTerm {
  term: string;
  category: "lao-toxic" | "thai-toxic" | "english-toxic" | "hate" | "self-harm";
  mode?: MatchMode;
}

const BLOCKED_TERMS: BlockedTerm[] = [
  // Lao common abuse / esports toxicity.
  { term: "ຄວາຍ", category: "lao-toxic" },
  { term: "ຫມາ", category: "lao-toxic" },
  { term: "ໝາ", category: "lao-toxic" },
  { term: "ສັດ", category: "lao-toxic" },
  { term: "ຂີ້", category: "lao-toxic" },
  { term: "ຂີ້ແພ້", category: "lao-toxic" },
  { term: "ກາກ", category: "lao-toxic" },
  { term: "ອ່ອນ", category: "lao-toxic" },
  { term: "ແຈກ", category: "lao-toxic" },
  { term: "ໂງ່", category: "lao-toxic" },
  { term: "ເຫ້ຍ", category: "lao-toxic" },
  { term: "ຫ່າ", category: "lao-toxic" },
  { term: "ມຶງ", category: "lao-toxic" },
  { term: "ກູ", category: "lao-toxic" },
  { term: "ແມ່ມຶງ", category: "lao-toxic" },
  { term: "ພໍ່ມຶງ", category: "lao-toxic" },
  { term: "ສົ້ນຕີນ", category: "lao-toxic" },
  { term: "ຮູຂີ້", category: "lao-toxic" },

  // Thai common abuse / esports toxicity.
  { term: "ควย", category: "thai-toxic" },
  { term: "เหี้ย", category: "thai-toxic" },
  { term: "สัส", category: "thai-toxic" },
  { term: "สัตว์", category: "thai-toxic" },
  { term: "ไอสัส", category: "thai-toxic" },
  { term: "ไอ้สัส", category: "thai-toxic" },
  { term: "อีดอก", category: "thai-toxic" },
  { term: "ดอกทอง", category: "thai-toxic" },
  { term: "พ่อมึง", category: "thai-toxic" },
  { term: "แม่มึง", category: "thai-toxic" },
  { term: "เย็ด", category: "thai-toxic" },
  { term: "หี", category: "thai-toxic" },
  { term: "แตด", category: "thai-toxic" },
  { term: "หำ", category: "thai-toxic" },
  { term: "ส้นตีน", category: "thai-toxic" },
  { term: "ขยะ", category: "thai-toxic" },
  { term: "ไก่", category: "thai-toxic" },
  { term: "แจก", category: "thai-toxic" },
  { term: "อ่อน", category: "thai-toxic" },
  { term: "กาก", category: "thai-toxic" },
  { term: "โง่", category: "thai-toxic" },
  { term: "ควาย", category: "thai-toxic" },

  // English terms use word matching to avoid false positives inside normal words.
  { term: "fuck", category: "english-toxic", mode: "word" },
  { term: "fucking", category: "english-toxic", mode: "word" },
  { term: "shit", category: "english-toxic", mode: "word" },
  { term: "bitch", category: "english-toxic", mode: "word" },
  { term: "bastard", category: "english-toxic", mode: "word" },
  { term: "cunt", category: "english-toxic", mode: "word" },
  { term: "dick", category: "english-toxic", mode: "word" },
  { term: "pussy", category: "english-toxic", mode: "word" },
  { term: "motherfucker", category: "english-toxic", mode: "word" },
  { term: "trash", category: "english-toxic", mode: "word" },
  { term: "garbage", category: "english-toxic", mode: "word" },
  { term: "noob", category: "english-toxic", mode: "word" },
  { term: "feeder", category: "english-toxic", mode: "word" },
  { term: "idiot", category: "english-toxic", mode: "word" },
  { term: "retard", category: "hate", mode: "word" },

  // High-severity harassment.
  { term: "kill yourself", category: "self-harm", mode: "word" },
  { term: "kys", category: "self-harm", mode: "word" },
];

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function compactText(value: string) {
  return normalizeText(value).replace(/[\s"'`.,!?;:()[\]{}<>/\\|_+=~*&^%$#@-]+/g, "");
}

function wordRegex(term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
}

export function analyzeCommentModeration(body: string): CommentModerationResult {
  const normalized = normalizeText(body);
  const compact = compactText(body);
  const matchedTerms = new Set<string>();
  const categories = new Set<string>();

  for (const item of BLOCKED_TERMS) {
    const mode = item.mode ?? "compact";
    const hit =
      mode === "word"
        ? wordRegex(item.term).test(normalized)
        : compact.includes(compactText(item.term));

    if (hit) {
      matchedTerms.add(item.term);
      categories.add(item.category);
    }
  }

  return {
    status: matchedTerms.size > 0 ? "review" : "visible",
    matchedTerms: Array.from(matchedTerms),
    categories: Array.from(categories),
  };
}
