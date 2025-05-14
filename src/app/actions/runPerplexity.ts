"use server"

import { supabase } from "@/lib/supabaseClient"

/** 🔧 Replace this with the real Perplexity API call */
async function askPerplexity(prompt: string): Promise<string> {
  return `🔮 Mock answer for: "${prompt}"`;
}

/**
 * For every unanswered question of a report,
 * call Perplexity and save the answer.
 */
export async function runPerplexity(reportId: string) {
  /* 1. Fetch unanswered questions */
  const { data: questions, error: fetchErr } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null);

  if (fetchErr) {
    console.error("Supabase fetch error ➜", fetchErr);
    throw new Error("Failed to fetch questions");
  }

  /* 2. For each question, call Perplexity and save the answer */
  await Promise.all(
    (questions ?? []).map(async (q) => {
      const answer = await askPerplexity(q.question_text);

      const { error: updErr } = await supabase
        .from("report_questions")
        .update({ answer_text: answer })
        .eq("id", q.id);

      if (updErr) {
        console.error("Supabase update error (id:", q.id, ") ➜", updErr);
        throw new Error("Failed to save an answer");
      }
    })
  );
}

