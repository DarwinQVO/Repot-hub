import React from "react"

interface Props {
  done: number
  total: number
}

export default function ProgressBar({ done, total }: Props) {
  if (total === 0) return null
  const pct = Math.floor((done / total) * 100)
  return (
    <div className="w-full bg-zinc-800 rounded h-3 mt-6">
      <div
        className="bg-blue-600 h-full rounded transition-all"
        style={{ width: `${pct}%` }}
      />
      <span className="text-xs text-zinc-400 mt-1 block text-center">
        {done} / {total} answered
      </span>
    </div>
  )
}
