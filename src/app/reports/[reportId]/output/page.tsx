"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

interface QA {
  id: string
  question_text: string
  answer_text: string | null
}

export default function OutputPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const [qas, setQas] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("report_questions")
        .select("id, question_text, answer_text")
        .eq("report_id", reportId)
        .order("id")
      setQas(data ?? [])
      setLoading(false)
    }
    load()
  }, [reportId])

  async function updateAnswer(id: string, text: string) {
    setQas((prev) => prev.map((qa) => (qa.id === id ? { ...qa, answer_text: text } : qa)))
    await supabase.from("report_questions").update({ answer_text: text }).eq("id", id)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Output</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        qas.map((qa, i) => (
          <div key={qa.id} className="mb-6">
            <p className="font-semibold mb-1">
              {i + 1}. {qa.question_text}
            </p>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={qa.answer_text ?? ""}
              onChange={(e) => updateAnswer(qa.id, e.target.value)}
            />
          </div>
        ))
      )}
    </div>
  )
}

