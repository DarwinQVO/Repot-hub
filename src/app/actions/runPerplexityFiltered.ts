"use server"

import { runPerplexity } from "@/app/actions/runPerplexity"   // ya existente
import { supabase } from "@/lib/supabaseClient"

/**
 * Lanza runPerplexity solo para las IDs marcadas.
 */
export async function runPerplexityFiltered(reportId: string, ids: string[]) {
  // 1. Pon answer_text = NULL para las seleccionadas (por si ya tenían texto)
  await supabase
    .from("report_questions")
    .update({ answer_text: null })
    .in("id", ids)

  // 2. Delega al action original (este salta las que no tienen NULL)
  await runPerplexity(reportId)
}

