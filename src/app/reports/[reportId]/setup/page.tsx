"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { addQuestion } from "@/app/actions/addQuestion"
import { runPerplexityFiltered } from "@/app/actions/runPerplexityFiltered"
import ProgressBar from "@/components/ProgressBar"

interface Row {
  id: string
  question_text: string
}

export default function SetupPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const router = useRouter()

  const [rows, setRows] = useState<Row[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [newQ, setNewQ] = useState("")

  /* fetch questions */
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("report_questions")
        .select("id, question_text")
        .eq("report_id", reportId)
        .order("id")
      setRows(data ?? [])
      setSelected(
        Object.fromEntries((data ?? []).map((r) => [r.id, true]))
      )
      setLoading(false)
    }
    load()
  }, [reportId])

  /* toggle */
  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }))

  /* add question */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newQ.trim()) return
    const row = await addQuestion(reportId, newQ.trim())
    setRows((prev) => [...prev, row])
    setSelected((prev) => ({ ...prev, [row.id]: true }))
    setNewQ("")
  }

  /* run with progress */
  async function handleRun() {
    const ids = Object.keys(selected).filter((id) => selected[id])
    if (!ids.length) return alert("Select at least one question")
    setRunning(true)
    setDone(0)
    for (const id of ids) {
      await runPerplexityFiltered(reportId, [id])
      setDone((d) => d + 1)
    }
    router.push(`/reports/${reportId}/output`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Setup</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={!!selected[r.id]}
                onChange={() => toggle(r.id)}
                className="mt-1"
              />
              <span>{i + 1}. {r.question_text}</span>
            </li>
          ))}
        </ul>
      )}

      {/* add question */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Add custom question…"
          className="flex-1 border rounded p-2 text-black"
        />
        <button className="bg-gray-200 px-3 rounded">Add</button>
      </form>

      <button
        onClick={handleRun}
        disabled={running}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? "Running…" : "Run selected"}
      </button>

      {running && (
        <ProgressBar
          done={done}
          total={Object.values(selected).filter(Boolean).length}
        />
      )}
    </div>
  )
}

