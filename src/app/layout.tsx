import "./globals.css"
import Link from "next/link"

export const metadata = { title: "Report-Hub" }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800">
          <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-8">
            <Link
              href="/reports"
              className="text-xl font-semibold text-blue-400 hover:underline"
            >
              Report-Hub
            </Link>
            <Link
              href="/reports/new"
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm"
            >
              New Report
            </Link>
          </nav>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-10">{children}</main>

        <footer className="text-center text-xs text-zinc-500 py-6">
          Made with Perplexity API & Supabase
        </footer>
      </body>
    </html>
  )
}

