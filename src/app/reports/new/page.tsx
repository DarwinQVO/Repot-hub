"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createReport } from "@/app/actions/createReport"

export default function NewReportPage() {
  const [entityName, setEntityName] = useState("")
  const [entityType, setEntityType] = useState<"person" | "company">("person")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!entityName.trim()) return
    setLoading(true)
    try {
      const id = await createReport({ entityName, entityType })
      router.push(`/reports/${id}/setup`)
    } catch (err) {
      console.error(err)
      alert("Error creating report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Report</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="font-medium">Entity Name</span>
          <input
            type="text"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            placeholder="e.g. Elon Musk"
          />
        </label>

        <label className="block">
          <span className="font-medium">Entity Type</span>
          <select
            value={entityType}
            onChange={(e) =>
              setEntityType(e.target.value as "person" | "company")
            }
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="person">person</option>
            <option value="company">company</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  )
}


