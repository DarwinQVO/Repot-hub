"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import EditAnswerModal from "@/components/EditAnswerModal"

interface QA {
  id: string
  question_text: string
  answer_text: string | null
}

export default function OutputPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const [rows, setRows] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false)
  const [current, setCurrent] = useState<{ id: string; html: string } | null>(
    null
  )

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("report_questions")
        .select("id, question_text, answer_text")
        .eq("report_id", reportId)
        .order("id")
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [reportId, modalOpen]) // reload after modal saves

  function openEdit(id: string, html: string) {
    setCurrent({ id, html })
    setModalOpen(true)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Output</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        rows.map((qa, i) => (
          <div key={qa.id} className="mb-8">
            <h3 className="font-semibold mb-2">
              {i + 1}. {qa.question_text}
            </h3>
            <section
              className="prose prose-invert max-w-none border border-zinc-800 rounded p-4"
              dangerouslySetInnerHTML={{
                __html: qa.answer_text ?? "<em>(no answer)</em>",
              }}
            />
            <button
              onClick={() => openEdit(qa.id, qa.answer_text ?? "")}
              className="mt-2 text-sm text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
        ))
      )}

      <EditAnswerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        answerId={current?.id ?? ""}
        initialHtml={current?.html ?? ""}
      />
    </div>
  )
}

