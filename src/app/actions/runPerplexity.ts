"use server"

import { supabase } from "@/lib/supabaseClient"

const CONCURRENCY = 5
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const perplexityModel = "sonar-pro"

/* ╭──────────────────────────────────────── askPerplexity ─╮ */
async function askPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY env var is missing")

  /* 1. Llamada HTTP */
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

  /* 2. Texto con tokens [N] */
  const text: string =
    json.choices?.[0]?.message?.content ?? "No answer returned."

  /* 3. Tabla id → url  (distintas keys según plan) */
  type Cit = { id: number; url: string }
  const raw: Cit[] =
    json.citations ??
    json.source_attributions ??
    json.sources ??
    []
  const table: Record<string, string> = {}
  raw.forEach((c) => (table[c.id] = c.url))

  /* 4. Reemplaza [N] por <a href="..." target="_blank">[N]</a> */
  const html = text.replace(/\[(\d+)]/g, (_, n) => {
    const url = table[n]
    return url
      ? `<a href="${url}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  })

  return html
}
/* ╰─────────────────────────────────────────────────────────╯ */

/* Helper: ejecuta tareas en lotes */
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

/* ╭────────────────────── main action ─────────────────────╮ */
export async function runPerplexity(reportId: string) {
  /* 1. Preguntas sin respuesta */
  const { data: qs, error: fetchErr } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (fetchErr) {
    console.error("Supabase fetch error ➜", fetchErr)
    throw new Error("Failed to fetch questions")
  }

  /* 2. Llamar a Perplexity por lotes */
  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  /* 3. Guardar respuestas */
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
/* ╰─────────────────────────────────────────────────────────╯ */

