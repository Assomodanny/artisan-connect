import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { ActionResult } from '../../lib/commit'
import { withdrawApplication } from '../../services/quotationService'
import type { Application } from '../../types'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface WithdrawQuotationProps {
  application: Application
  jobTitle: string
  onResult: (result: ActionResult) => void
}

export default function WithdrawQuotation({ application, jobTitle, onResult }: WithdrawQuotationProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    if (!user) return
    setOpen(false)
    onResult(withdrawApplication(user, application.id))
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Withdraw quotation
      </Button>
      <ConfirmDialog
        open={open}
        title="Withdraw your quotation?"
        confirmLabel="Withdraw quotation"
        cancelLabel="Keep quotation"
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      >
        <p>
          The customer will be told you withdrew your quotation for “{jobTitle}”. You can send a new
          one later while the job is still open.
        </p>
      </ConfirmDialog>
    </>
  )
}