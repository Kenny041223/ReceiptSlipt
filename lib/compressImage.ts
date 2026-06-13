// Downscale + re-encode an image to a compact JPEG data URL.
// Big phone photos (8–12MB) blow past sessionStorage (~5MB) and Vercel's
// 4.5MB request limit; receipts read fine at ~1600px, so we shrink first.
export function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e as Error)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image')) }
    img.src = url
  })
}
