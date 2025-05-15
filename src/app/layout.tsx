import "./globals.css"
import Link from "next/link"

export const metadata = { title: "Report-Hub" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Fixed header */}
        <header className="fixed inset-x-0 top-0 z-50 backdrop-blur bg-black/40 border-b border-zinc-800">
          <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/reports" className="font-semibold text-lg">
              Report-Hub
            </Link>
            <Link
              href="/reports/new"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              New Report
            </Link>
          </nav>
        </header>

        {/* main content */}
        <main className="pt-20 max-w-4xl mx-auto px-4 min-h-screen">
          {children}
        </main>

        <footer className="text-center text-xs text-zinc-500 py-6">
          Made with&nbsp;Perplexity API &amp; Supabase
        </footer>
      </body>
    </html>
  )
}

