"use client"

import { Dialog } from "@headlessui/react"
import dynamic from "next/dynamic"
import React, { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const Quill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

interface Props {
  open: boolean
  onClose: () => void
  answerId: string
  initialHtml: string
}

export default function EditAnswerModal({
  open,
  onClose,
  answerId,
  initialHtml,
}: Props) {
  const [html, setHtml] = useState(initialHtml)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .from("report_questions")
      .update({ answer_text: html })
      .eq("id", answerId)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="max-w-3xl w-full bg-zinc-900 p-6 rounded-lg">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Edit answer
          </Dialog.Title>

          <Quill theme="snow" value={html} onChange={setHtml} />

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1 rounded border border-zinc-600 hover:border-zinc-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

