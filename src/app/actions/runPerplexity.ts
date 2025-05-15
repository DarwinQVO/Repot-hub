"use server"

import { supabase } from "@/lib/supabaseClient"

/* ─────────── Config ─────────── */
const CONCURRENCY   = 5
const perplexityUrl = "https://api.perplexity.ai/chat/completions"
const model         = "sonar-pro"          // o "sonar-small-online"

/* ── Llama a Perplexity y añade links ── */
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
      web_access: true,
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

  /* LOG una vez en dev */
  if (process.env.NODE_ENV !== "production") {
    console.log("RAW PERPLEXITY RESPONSE")
    console.dir(json, { depth: null })
  }

  /* Texto con tokens [N] */
  const text: string =
    json.choices?.[0]?.message?.content ?? "(no answer)"

  /* ── Normaliza las fuentes a map key→url ── */
  const links: Record<string, string> = {}

  if (
    Array.isArray(json.citations) &&
    json.citations.length &&
    typeof json.citations[0] === "string"
  ) {
    /* caso: array de strings (['https://…', …]) */
    json.citations.forEach((url: string, idx: number) => {
      links[String(idx + 1)] = url
    })
  } else {
    /* caso: objetos id/url o id/source */
    type Raw = { id?: number; url?: string; source?: string }
    const arr: Raw[] = json.citations ?? json.source_attributions ?? []
    arr.forEach((c, idx) => {
      const key  = String((c.id ?? idx) + 1)          // id 0 → token [1]
      const link = c.url ?? c.source ?? ""
      if (link) links[key] = link
    })
  }

  /* Sustituir tokens por enlaces */
  const html = text.replace(/\[(\d+)]/g, (_, n) =>
    links[n]
      ? `<a href="${links[n]}" target="_blank" class="text-blue-600 underline">[${n}]</a>`
      : `[${n}]`
  )

  return html
}

/* ── Helper para lotes ── */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size)
    const settled = await Promise.allSettled(slice.map(fn))
    settled.forEach((s) =>
      s.status === "fulfilled"
        ? out.push(s.value)
        : console.error("Perplexity error ➜", s.reason)
    )
  }
  return out
}

/* ── Main action ── */
export async function runPerplexity(reportId: string) {
  /* 1. Preguntas sin respuesta */
  const { data: qs, error } = await supabase
    .from("report_questions")
    .select("id, question_text")
    .eq("report_id", reportId)
    .is("answer_text", null)

  if (error) throw new Error("Failed to fetch questions")

  /* 2. Obtén respuestas */
  const answers = await inBatches(
    qs ?? [],
    CONCURRENCY,
    async (q) => ({
      id: q.id,
      answer_text: await askPerplexity(q.question_text),
    })
  )

  /* 3. Guarda respuestas */
  await Promise.all(
    answers.map((a) =>
      supabase
        .from("report_questions")
        .update({ answer_text: a.answer_text })
        .eq("id", a.id)
    )
  )

  /* 4. Marca el reporte como completado */
  await supabase
    .from("reports")
    .update({ completed: true })
    .eq("id", reportId)
}

