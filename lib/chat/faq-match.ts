import { allFaqs, coreFaqs } from "@/lib/chat/knowledge";

// Simple keyword matching for when the AI is off (no API key, monthly cap
// reached or an API error). It only ever returns an answer written on the
// site; below the threshold it says it isn't sure and offers a person.

const STOP = new Set(
  "a an and are as at be by can could do does for from have how i if in is it me my of on or our so that the this to us we what when where which who why will with you your".split(
    " ",
  ),
);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|es|s)$/, ""));

export function matchFaq(question: string): string | null {
  const q = new Set(words(question));
  if (!q.size) return null;
  let best: { score: number; answer: string } | null = null;
  for (const faq of [...coreFaqs, ...allFaqs]) {
    const inQuestion = words(faq.question);
    const inAnswer = new Set(words(faq.answer));
    let score = 0;
    for (const w of new Set(inQuestion)) if (q.has(w)) score += 2;
    for (const w of inAnswer) if (q.has(w)) score += 0.5;
    const normalised = score / Math.sqrt(q.size + 1);
    if (!best || normalised > best.score)
      best = { score: normalised, answer: faq.answer };
  }
  return best && best.score >= 1.2 ? best.answer : null;
}
