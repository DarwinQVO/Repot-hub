"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Output</h1>
        <Link
          href={`/reports/${reportId}/setup`}
          className="text-blue-600 underline"
        >
          ← Back to Setup
        </Link>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        qas.map((qa, i) => (
          <article key={qa.id} className="mb-10">
            <h2 className="font-semibold text-lg mb-2">
              {i + 1}. {qa.question_text}
            </h2>
            <section
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: qa.answer_text ?? "<em>(no answer)</em>",
              }}
            />
          </article>
        ))
      )}
    </div>
  )
}

