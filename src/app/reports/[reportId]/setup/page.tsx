"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { runPerplexity } from "@/app/actions/runPerplexity"

interface Question {
  id: string
  question_text: string
}

export default function SetupPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("report_questions")
        .select("id, question_text")
        .eq("report_id", reportId)
        .order("id")
      setQuestions(data ?? [])
      setLoading(false)
    }
    load()
  }, [reportId])

  async function handleRun() {
    setRunning(true)
    try {
      await runPerplexity(reportId)
      router.push(`/reports/${reportId}/output`)
    } catch (err) {
      console.error(err)
      alert("Error running Perplexity")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setup</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="border rounded p-3 bg-gray-50">
              <span className="font-semibold mr-2">{i + 1}.</span>
              {q.question_text}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleRun}
        disabled={running}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? "Running…" : "Run"}
      </button>
    </div>
  )
}

