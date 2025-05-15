import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface Row {
  id: string
  entity_name: string
  entity_type: string
  created_at: string
  completed: boolean
}

export const revalidate = 0 // siempre fresh

export default async function ReportsPage() {
  const { data } = await supabase
    .from("reports")
    .select("id, entity_name, entity_type, created_at, completed")
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as Row[]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reports</h1>

      {rows.length === 0 && <p>No reports yet.</p>}

      <ul className="space-y-6">
        {rows.map((r) => (
          <li
            key={r.id}
            className="border border-zinc-800 rounded-lg p-4 hover:border-blue-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{r.entity_name}</h2>
                <p className="text-sm text-zinc-400">
                  {r.entity_type} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()} ·{" "}
                  {r.completed ? "done" : "pending"}
                </p>
              </div>

              <Link
                href={`/reports/${r.id}/${r.completed ? "output" : "setup"}`}
                className="flex items-center gap-1 text-blue-400 hover:underline"
              >
                View →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

