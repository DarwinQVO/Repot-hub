"use server"

import { supabase } from "@/lib/supabaseClient"

/* ─────────────────────────── Config ──────────────────────────── */
const CONCURRENCY      = 5
const perplexityUrl    = "https://api.perplexity.ai/chat/completions"
/* Cambia a "sonar-small-online" o "sonar-medium-online" si lo deseas */
const model            = "sonar-pro"

/* ──────────────── Llama a Perplexity y añade links ───────────── */
async function askPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY env var is missing")

  const res = await fetch(perplexityUrl, {
    method : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization : `Bearer ${apiKey}`,
    },
    body    : JSON.stringify({
      model,
      include_citations: true,
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user",   content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Perplexity HTTP ${res.status} – ${txt}`)
  }

  const json  = await res.json()
  const answer: string = json.choices?.[0]?.message?.content ?? "(no answer)"

  /* ────── recoge citas en cualquier formato conocido ────── */
  type Raw = { id?: number; url?: string; source?: string; link?: string }
  const sources: Raw[] =
    json.citations            ??   // sonar-small / medium
    json.source_attributions  ??   // sonar-pro
    json.sources              ??   // fallback
    json.footnotes            ??   // fallback
    []

  /* id puede ser 0-based, token impreso es [1] */
  const lookup: Record<string, string> = {}
  sources.forEach((c) => {
    const idx   = c.id ?? 0                      // default 0
    const key   = String(idx + 1)                // [1] …
    const link  = c.url ?? c.source ?? c.link ?? ""
    if (link) lookup[key] = link
  })

  /* sustituye tokens [N] por enlaces */
  const html = answer.replace(/\[(\d+)]/g, (_, n) => {
    const url = lookup[n]
    return url
      ? `<a href="${url}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  })

  return html
}

/* ────────────── Ejecuta en lotes con concurrencia ───────────── */
async function inBatches<T, R>(
  items: T[],
  size : number,
  fn   : (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const slice    = items.slice(i, i + size)
    const settled  = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) =>
      s.status === "fulfilled"
        ? out.push(s.value)
        : console.error("Perplexity error ➜", s.reason)
    )
  }
  return out
}

/* ─────────────────── Main server action ─────────────────────── */
export async function runPerplexity(reportId: string) {
  /* 1. fetch unanswered questions (answer_text IS NULL) */
  const { data: qs, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  /* 2. call Perplexity in batches */
  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  /* 3. save each answer */
  await Promise.all(
    answers.map(async (a) =>
      supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)
    )
  )
}

