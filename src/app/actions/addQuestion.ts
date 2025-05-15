"use server"

import { supabase } from "@/lib/supabaseClient"

export async function addQuestion(reportId: string, text: string) {
  const { error, data } = await supabase
    .from("report_questions")
    .insert({ report_id: reportId, question_text: text })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data           // devuelve la fila insertada
}

