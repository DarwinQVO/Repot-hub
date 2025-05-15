"use client"

import { Dialog } from "@headlessui/react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

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
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml || "<p></p>",
    editable: true,
  })

  /* refresca al abrir */
  useEffect(() => {
    if (editor && open)
      editor.commands.setContent(initialHtml || "<p></p>")
  }, [initialHtml, open, editor])

  async function handleSave() {
    if (!editor) return
    setSaving(true)
    await supabase
      .from("report_questions")
      .update({ answer_text: editor.getHTML() })
      .eq("id", answerId)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="max-w-3xl w-full bg-zinc-900 rounded-lg">
          <div className="p-6">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit answer
            </Dialog.Title>

            {editor && (
              <EditorContent editor={editor} className="ProseMirror" />
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-3 py-1 rounded border border-zinc-600 hover:border-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

