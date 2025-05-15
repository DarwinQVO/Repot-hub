import "./globals.css"
import Link from "next/link"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = { title: "Report-Hub" }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-zinc-900 text-zinc-50 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto flex items-center h-14 px-4">
            <Link href="/" className="text-xl font-semibold">
              📑 Report-Hub
            </Link>
            <nav className="ml-auto flex gap-4">
              <Link href="/reports" className="hover:underline">
                Reports
              </Link>
              <Link href="/reports/new" className="hover:underline">
                New
              </Link>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-xs text-center text-zinc-500 pb-4">
          Made with Perplexity API &amp; Supabase
        </footer>
      </body>
    </html>
  )
}

