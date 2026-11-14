import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { isStoredImage } from '../../lib/images'

interface JobPhotosProps {
  images: string[]
}

// A small gallery. Clicking a photo opens it larger in the browser's own dialog,
// which dims the page, traps keyboard focus and closes on Escape.
export default function JobPhotos({ images }: JobPhotosProps) {
  const photos = images.filter(isStoredImage)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (openIndex !== null && !dialog.open) dialog.showModal()
    else if (openIndex === null && dialog.open) dialog.close()
  }, [openIndex])

  if (photos.length === 0) return null

  const openPhoto = openIndex !== null ? photos[openIndex] : undefined

  return (
    <section aria-label="Reference photos" className="mt-5">
      <h3 className="text-sm font-semibold text-slate-900">Reference photos ({photos.length})</h3>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`View reference photo ${index + 1} larger`}
              className="block w-full overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <img
                src={photo}
                alt={`Reference photo ${index + 1}`}
                className="aspect-square w-full object-cover transition-opacity hover:opacity-90"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Reference photo"
        onClose={() => setOpenIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpenIndex(null) // a click outside the picture
        }}
        className="m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl rounded-xl bg-white p-4 shadow-lift backdrop:bg-slate-900/60"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close photo"
            className="rounded-full p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {openPhoto && (
          <img
            src={openPhoto}
            alt={`Reference photo ${(openIndex ?? 0) + 1}, larger`}
            className="mx-auto mt-2 max-h-[75vh] max-w-full rounded-lg object-contain"
          />
        )}
      </dialog>
    </section>
  )
}