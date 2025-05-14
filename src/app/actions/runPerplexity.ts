"use server"

import { supabase } from "@/lib/supabaseClient"

/** Replace this with the real Perplexity API call */
async function askPerplexity(prompt: string): Promise<string> {
  // TODO: integrate real API here
  return `🔮 Mock answer for: "${prompt}"`;
}

export async function runPerplexity(reportId: string) {
  // 1. Fetch unanswered questions
  const { data: questions, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  // 2. Call Perplexity for each question
  const updates = await Promise.all(
    (questions ?? []).map(async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    }))
  )

  // 3. Save answers
  const { error: upErr } = await supabase
    .from("report_questions")
    .upsert(updates)
  if (upErr) throw new Error("Failed to save answers")
}

