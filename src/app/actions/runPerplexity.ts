"use server"

import { supabase } from "@/lib/supabaseClient"

const CONCURRENCY = 5
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const model = "sonar-pro"                                  // modelo Pro

/* ── Call Perplexity and embed citations ── */
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
      model,
      include_citations: true,                             // clave
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

  /* 1. Texto con tokens [N] */
  const text: string =
    json.choices?.[0]?.message?.content ?? "No answer returned."

  /* 2. Citations o source_attributions → id/url */
  type Raw = { id: number; url?: string; source?: string }
  const raw: Raw[] = json.citations ?? json.source_attributions ?? []

  const table: Record<string, string> = {}
  raw.forEach((c) => {
    const key = String(c.id + 1)             // id 0 → token [1]
    const link = c.url ?? c.source ?? ""
    if (link) table[key] = link
  })

  /* 3. Sustituir tokens por links */
  const html = text.replace(/\[(\d+)]/g, (_, n) => {
    const url = table[n]
    return url
      ? `<a href="${url}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  })

  return html
}

/* ── Helper batching ── */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size)
    const settled = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) => {
      if (s.status === "fulfilled") out.push(s.value)
      else console.error("Perplexity error ➜", s.reason)
    })
  }
  return out
}

/* ── Main action ── */
export async function runPerplexity(reportId: string) {
  const { data: qs, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  await Promise.all(
    answers.map(async (a) => {
      await supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)
    })
  )
}

