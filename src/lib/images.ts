// Photos are shrunk and stored as small JPEG "data URLs" (text), because localStorage only holds
// about 5 MB in total and has no place for files.

export const MAX_SOURCE_BYTES = 5 * 1024 * 1024 // the file the person picks
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string }

interface CompressOptions {
  maxSide: number // the longest side, in pixels, after shrinking
  quality?: number // JPEG quality from 0 to 1
  maxOutputChars?: number // refuse results larger than this (text length of the data URL)
}

function fail(error: string): ImageResult {
  return { ok: false, error }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('The file could not be read as an image.'))
    }
    image.src = url
  })
}

export async function compressImage(file: File, options: CompressOptions): Promise<ImageResult> {
  const { maxSide, quality = 0.8, maxOutputChars = 200_000 } = options

  if (!ACCEPTED_TYPES.includes(file.type)) return fail('Choose a JPG, PNG or WebP picture.')
  if (file.size > MAX_SOURCE_BYTES) return fail('That picture is too large. Choose one under 5 MB.')

  try {
    const image = await loadImage(file)
    const longest = Math.max(image.naturalWidth, image.naturalHeight)
    if (!longest) return fail('The file could not be read as an image.')

    const scale = Math.min(1, maxSide / longest) // never enlarge a small picture
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return fail('This browser cannot process pictures.')

    // JPEG has no transparency, so a transparent PNG would turn black without a white backdrop.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length > maxOutputChars) {
      return fail('That picture is still too large after shrinking. Try a simpler one.')
    }
    return { ok: true, dataUrl }
  } catch {
    return fail('The file could not be read as an image.')
  }
}

// Only text that really is an image is ever shown as a picture.
export function isStoredImage(value: string): boolean {
  return /^data:image\/(jpeg|png|webp);base64,/.test(value)
}