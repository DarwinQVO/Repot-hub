"use server"

import { supabase } from "@/lib/supabaseClient"

/** 🔧 Sustituye esta función por tu llamada real a Perplexity más adelante */
async function askPerplexity(prompt: string): Promise<string> {
  return `🔮 Mock answer for: "${prompt}"`;
}

export async function runPerplexity(reportId: string) {
  // 1. Traer todas las preguntas sin respuesta
  const { data: questions, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  // 2. Llamar a la API (mock) en paralelo
  const updates = await Promise.all(
    (questions ?? []).map(async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    }))
  )

  // 3. Guardar respuestas
  const { error: upErr } = await supabase.from("report_questions").upsert(updates)
  if (upErr) throw new Error("Failed to save answers")
}

