import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { clearAppData } from '../../lib/storage'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
  confirmingReset: boolean
}

// React only catches page errors in a class component, so this one is a class.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false, confirmingReset: false }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Artisan Connect hit an unexpected error:', error, info.componentStack)
  }

  handleReset = () => {
    clearAppData() // removes every account, job and setting saved by this app in this browser
    window.location.assign('/')
  }

  override render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-brand-700" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-slate-600">
          The page hit an unexpected problem. Reloading usually fixes it. If it keeps happening, the
          data saved in this browser may be damaged, and you can reset it.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
          <Button variant="secondary" onClick={() => this.setState({ confirmingReset: true })}>
            Reset saved data
          </Button>
        </div>

        <ConfirmDialog
          open={this.state.confirmingReset}
          title="Reset all saved data?"
          confirmLabel="Yes, delete everything"
          cancelLabel="Keep my data"
          confirmVariant="danger"
          onConfirm={this.handleReset}
          onCancel={() => this.setState({ confirmingReset: false })}
        >
          <p>
            This deletes every account, job, quotation, payment and review saved by this app in this
            browser. It can't be undone.
          </p>
        </ConfirmDialog>
      </main>
    )
  }
}