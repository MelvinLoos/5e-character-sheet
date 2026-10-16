/**
 * qrCode — Render a share URL as an inline SVG QR code.
 *
 * SVG is used (rather than a rasterised PNG) so the code stays crisp when the
 * character sheet is printed at any resolution. The SVG parser is pure
 * JavaScript, so it also works headlessly in unit tests without a canvas
 * implementation.
 */
import QRCode from 'qrcode'

/**
 * Generate a QR code for `url` as an inline SVG markup string.
 *
 * Returns an empty string when no URL is provided or when generation fails
 * (for example if the payload is too large to encode), so callers can safely
 * hide the QR block instead of rendering a broken code.
 *
 * @param url  The absolute URL to encode.
 * @param size Intrinsic pixel size of the generated SVG.
 */
export async function generateQrSvg(url: string | null | undefined, size = 120): Promise<string> {
  const payload = url?.trim()
  if (!payload) return ''

  try {
    return await QRCode.toString(payload, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch {
    return ''
  }
}
