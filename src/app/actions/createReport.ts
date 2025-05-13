"use server"

import { supabase } from "@/lib/supabaseClient"

interface CreateReportInput {
  entityName: string
  entityType: "person" | "company"
}

/** Creates a report, copies template questions, and replaces {ENTITY}. */
export async function createReport({
  entityName,
  entityType,
}: CreateReportInput) {
  // 1. Insert the report
  const { data: report, error: reportErr } = await supabase
    .from("reports")
    .insert({ entity_name: entityName, entity_type: entityType })
    .select()
    .single()
  if (reportErr || !report) throw new Error("Failed to create report")

  // 2. Fetch templates for this entity type
  const { data: templates, error: tplErr } = await supabase
    .from("templates")
    .select("question_text")
    .eq("entity_type", entityType)
  if (tplErr) throw new Error("Failed to fetch templates")

  // 3. Copy questions, replacing {ENTITY} with the real name
  if (templates && templates.length) {
    const rows = templates.map((t) => ({
      report_id: report.id,
      question_text: t.question_text.replace(/\{ENTITY\}/g, entityName),
    }))
    const { error: qErr } = await supabase.from("report_questions").insert(rows)
    if (qErr) throw new Error("Failed to copy questions")
  }

  return report.id as string
}

