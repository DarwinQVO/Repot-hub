"use server"

import { supabase } from "@/lib/supabaseClient"

const CONCURRENCY   = 5
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const model         = "sonar-pro"        // o "sonar-small-online"

/* ── Call Perplexity with web_access and embed citations ── */
async function askPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY missing")

  const res = await fetch(perplexityUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization : `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      include_citations: true,
      web_access: true,                    // ⬅️ habilita búsqueda y URLs
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

  const json = await res.json()

  /* ─ Log una sola vez en modo dev ─ */
0  if (process.env.NODE_ENV !== "production") {
    console.log("RAW PERPLEXITY RESPONSE")
    console.dir(json, { depth: null })
  }

  const text: string =
    json.choices?.[0]?.message?.content ?? "(no answer)"

  /* acepta citations o source_attributions */
  type Raw = { id?: number; url?: string; source?: string }
  const raw: Raw[] = json.citations ?? json.source_attributions ?? []

  const table: Record<string, string> = {}
  raw.forEach((c) => {
    const key  = String((c.id ?? 0) + 1)          // 0-based → [1]
    const link = c.url ?? c.source ?? ""
    if (link) table[key] = link
  })

  const html = text.replace(/\[(\d+)]/g, (_, n) =>
    table[n]
      ? `<a href="${table[n]}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  )

  return html
}

/* ── Helper batching ─ */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const slice   = items.slice(i, i + size)
    const settled = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) =>
      s.status === "fulfilled"
        ? out.push(s.value)
        : console.error("Perplexity error ➜", s.reason)
    )
  }
  return out
}

/* ── Main action ─ */
export async function runPerplexity(reportId: string) {
  const { data: qs } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  await Promise.all(
    answers.map((a) =>
      supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)
    )
  )
}

