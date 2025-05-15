"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { ArrowRight } from "lucide-react"

interface Row {
  id: string
  entity_name: string
  entity_type: "person" | "company"
  created_at: string
  completed: boolean
}

export default function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reports")
        .select("id, entity_name, entity_type, created_at, completed")
        .order("created_at", { ascending: false })
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Link
          href="/reports/new"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          New Report
        </Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No reports yet.</p>
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="border border-zinc-800 rounded-lg p-4 hover:border-blue-600 transition"
            >
              <h2 className="text-xl font-semibold mb-1">{r.entity_name}</h2>

              <div className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
                <span
                  className={
                    r.entity_type === "person"
                      ? "bg-emerald-700/20 text-emerald-300 px-2 py-0.5 rounded-full"
                      : "bg-yellow-700/20 text-yellow-300 px-2 py-0.5 rounded-full"
                  }
                >
                  {r.entity_type}
                </span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                {r.completed && (
                  <span className="bg-blue-700/20 text-blue-300 px-2 py-0.5 rounded-full">
                    done
                  </span>
                )}
              </div>

              <Link
                href={`/reports/${r.id}/${r.completed ? "output" : "setup"}`}
                className="inline-flex items-center gap-1 text-blue-400 hover:underline"
              >
                View <ArrowRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

