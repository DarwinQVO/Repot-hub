"use server"

import { supabase } from "@/lib/supabaseClient"

const CONCURRENCY = 5                               // nº de llamadas en paralelo
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const perplexityModel = "sonar-pro"

/* ─── Real call to Perplexity ─────────────────────────── */
async function askPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY env var is missing")

  const res = await fetch(perplexityUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: perplexityModel,
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: prompt },
      ],
      // quita o ajusta la sección web_search_options según tu plan:
      web_search_options: { search_context_size: "high" },
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Perplexity HTTP ${res.status} – ${txt}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? "No answer returned."
}

/* ─── Helper: ejecuta en lotes ─────────────────────────── */
async function inBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize)
    const settled = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) => {
      if (s.status === "fulfilled") out.push(s.value)
      else console.error("Perplexity error ➜", s.reason)
    })
  }
  return out
}

/* ─── Acción principal ────────────────────────────────── */
export async function runPerplexity(reportId: string) {
  /* 1. Preguntas sin respuesta */
  const { data: questions, error: fetchErr } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (fetchErr) {
    console.error("Supabase fetch error ➜", fetchErr)
    throw new Error("Failed to fetch questions")
  }

  /* 2. Llamar a Perplexity en lotes */
  const answers = await inBatches(
    questions ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  /* 3. Guardar cada respuesta */
  await Promise.all(
    answers.map(async (a) => {
      const { error: updErr } = await supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)

      if (updErr) console.error("Supabase update error ➜", updErr)
    })
  )
}

