import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

// Uses the browser's built-in <dialog>: it traps keyboard focus, dims the page,
// and closes on Escape, with no extra library.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault() // we close it ourselves through the `open` prop
        onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 shadow-lift backdrop:bg-slate-900/50"
    >
      <h2 id={titleId} className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}