"use server"

import { supabase } from "@/lib/supabaseClient"

/** 🔧 Replace this with the real Perplexity API call */
async function askPerplexity(prompt: string): Promise<string> {
  // TODO: integrate real API here
  return `🔮 Mock answer for: "${prompt}"`;
}

/**
 * For every question of a report that has no answer yet,
 * call Perplexity and store the answer in `answer_text`.
 */
export async function runPerplexity(reportId: string) {
  /* 1. Fetch unanswered questions */
  const { data: questions, error: fetchErr } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (fetchErr) {
    console.error("Supabase fetch error ➜", fetchErr)
    throw new Error("Failed to fetch questions")
  }

  /* 2. Call Perplexity for each question (in parallel) */
  const updates = await Promise.all(
    (questions ?? []).map(async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    }))
  )

  if (updates.length === 0) return; // nothing to do

  /* 3. Save answers — use update (rows already exist) */
  const { error: updateErr } = await supabase
    .from("report_questions")
    .update(updates)   // update accepts an array of objects with PK `id`
    .in("id", updates.map((u) => u.id)) // match by id list

  if (updateErr) {
    console.error("Supabase update error ➜", updateErr)
    throw new Error("Failed to save answers")
  }
}

