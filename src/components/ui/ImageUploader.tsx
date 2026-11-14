import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { compressImage } from '../../lib/images'
import Avatar from './Avatar'
import Button from './Button'

interface ImageUploaderProps {
  id: string
  label: string
  name: string // whose initials to show when there is no photo yet
  value?: string
  onChange: (dataUrl: string | undefined) => void
  hint?: string
}

export default function ImageUploader({ id, label, name, value, onChange, hint }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // so the same file can be chosen again later
    if (!file) return

    setBusy(true)
    setError(null)
    const result = await compressImage(file, { maxSide: 256 })
    setBusy(false)

    if (result.ok) onChange(result.dataUrl)
    else setError(result.error)
  }

  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ')

  return (
    <div>
      <p className="block text-sm font-medium text-slate-800">{label}</p>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Avatar name={name} src={value} size="xl" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => inputRef.current?.click()}
            aria-describedby={describedBy || undefined}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {value ? 'Change photo' : 'Choose photo'}
          </Button>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null)
                onChange(undefined)
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove photo
            </Button>
          )}
        </div>
      </div>

      {/* The real file input stays hidden; the button above opens it. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}