/* ── src/app/reports/page.tsx ─────────────────────────────────────────── */
/* evita cualquier pre-render */
export const dynamic = 'force-dynamic';

import Link from "next/link";

/** Runtime import to bypass build-time env check  */
async function getReports() {
  const { supabase } = await import('@/lib/supabaseClient');
  const { data } = await supabase
    .from('reports')
    .select('id, entity_name')
    .order('created_at', { ascending: false });

  return data ?? [];
}

export default async function ReportsPage() {
  const rows = await getReports();

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      {rows.length === 0 ? (
        <p className="text-zinc-400 mb-6">No reports yet.</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {rows.map((r) => (
            <li key={r.id} className="card p-3">
              <Link href={`/reports/${r.id}/setup`} className="hover:underline">
                {r.entity_name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/reports/new"
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
      >
        New Report
      </Link>
    </div>
  );
}
