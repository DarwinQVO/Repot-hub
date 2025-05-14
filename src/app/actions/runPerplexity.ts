"use server"

import { supabase } from "@/lib/supabaseClient"

const CONCURRENCY = 5
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const perplexityModel = "sonar-pro"

/* ─── Call Perplexity and get HTML with clickable sources ── */
async function askPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY!
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
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Perplexity HTTP ${res.status} – ${txt}`)
  }

  const json = await res.json()

  /* ① Texto con tokens [N]  */
  const text: string =
    json.choices?.[0]?.message?.content ?? "No answer returned."

  /* ② Tabla id→url */
  const citations: Record<string, string> = {}
  json.citations?.forEach((c: { id: number; url: string }) => {
    citations[c.id] = c.url
  })

  /* ③ Reemplaza [N] por links */
  const html = text.replace(/\[(\d+)]/g, (_, n) => {
    const url = citations[n]
    return url
      ? `<a href="${url}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  })

  return html
}

/* ─── Helper: ejecuta en lotes ── */
async function inBatches<T, R>(
  items: T[],
  batch: number,
  fn: (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += batch) {
    const slice = items.slice(i, i + batch)
    const settled = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) => {
      if (s.status === "fulfilled") out.push(s.value)
      else console.error("Perplexity error ➜", s.reason)
    })
  }
  return out
}

/* ─── Main action ── */
export async function runPerplexity(reportId: string) {
  /* 1. Preguntas sin respuesta */
  const { data: qs, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  /* 2. Llamadas batched */
  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  /* 3. Guarda */
  await Promise.all(
    answers.map(async (a) => {
      const { error: e } = await supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)
      if (e) console.error("Supabase update error ➜", e)
    })
  )
}

