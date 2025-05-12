"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface ReportRow {
  id: string
  entity_name: string
  entity_type: string
  created_at: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) setReports(data as ReportRow[])
      setLoading(false)
    }

    fetchReports()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {loading ? (
        <p>Loading…</p>
      ) : reports.length === 0 ? (
        <p>No reports yet</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}/setup`}
                className="text-blue-600 underline"
              >
                {r.entity_name} <span className="text-sm text-gray-500">({r.entity_type})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/reports/new"
        className="inline-block mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        New Report
      </Link>
    </div>
  )
}
