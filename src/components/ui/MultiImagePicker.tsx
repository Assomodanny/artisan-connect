import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { compressImage } from '../../lib/images'
import Button from './Button'

interface MultiImagePickerProps {
  id: string // the "Add photos" button gets this id, so an error can move focus to it
  label: string
  itemLabel: string // e.g. "Portfolio photo", used for alt text and button names
  hint: string
  emptyText: string
  max: number
  images: string[]
  onChange: (images: string[]) => void
  error?: string | null // a validation message from the form
}

export default function MultiImagePicker({
  id,
  label,
  itemLabel,
  hint,
  emptyText,
  max,
  images,
  onChange,
  error,
}: MultiImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const full = images.length >= max

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // so the same files can be chosen again later
    if (files.length === 0) return

    setProblem(null)
    setNote(null)

    const room = max - images.length
    if (room <= 0) return

    setBusy(true)
    const added: string[] = []
    let firstProblem: string | null = null

    // One at a time keeps memory use low, even for several large photos.
    for (const file of files.slice(0, room)) {
      const result = await compressImage(file, { maxSide: 800, quality: 0.7, maxOutputChars: 200_000 })
      if (result.ok) added.push(result.dataUrl)
      else if (!firstProblem) firstProblem = `${file.name}: ${result.error}`
    }
    setBusy(false)

    if (added.length > 0) onChange([...images, ...added])
    setProblem(firstProblem)
    if (files.length > room) {
      setNote(`Only ${room} ${room === 1 ? 'photo was' : 'photos were'} added. The limit is ${max} photos.`)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="block text-sm font-medium text-slate-800">{label}</p>
          <p className="mt-1 text-sm text-slate-600">
            {images.length} of {max}. {hint}
          </p>
        </div>
        <Button
          id={id}
          variant="secondary"
          size="sm"
          loading={busy}
          disabled={full}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {full ? 'Photo limit reached' : 'Add photos'}
        </Button>
      </div>

      {images.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{emptyText}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((photo, index) => (
            <li key={index} className="relative">
              <img
                src={photo}
                alt={`${itemLabel} ${index + 1}`}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => onChange(images.filter((_, position) => position !== index))}
                aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-slate-800 shadow-soft hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* The real file input stays hidden; the button above opens it. */}
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFiles}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <p className="mt-2 text-sm text-slate-600">JPG, PNG or WebP. Photos are shrunk automatically.</p>
      {note && (
        <p role="status" className="mt-2 text-sm text-slate-700">
          {note}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {problem && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {problem}
        </p>
      )}
    </div>
  )
}