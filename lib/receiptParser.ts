export interface ParsedItem {
  id: string
  name: string
  price: number
  quantity: number
}

// Lines that are headers / totals / footer noise, never food items
const SKIP_PATTERNS = [
  /subtotal|sub.total/i,
  /\btotal\b/i,
  /\btender\b/i,
  /\bcash\b/i,
  /\bchange\b/i,
  /service|srv\s*chg/i,
  /\bgst\b|\bsst\b/i,
  /\btax\b/i,
  /\brounding\b/i,
  /amt\s*du|amount\s*due/i,
  /\bpoints?\b/i,
  /saving/i,
  /\bmemb\b/i,
  /balance/i,
  /expiry/i,
  /customer\s*service/i,
  /\btel\b|\bfax\b/i,
  /thank\s*you/i,
  /invoice/i,
  /https?:|www\.|\.com/i,
  /download/i,
  /qr\s*code/i,
  /\bcard\b/i,
  /stored/i,
  /^-{2,}$/,
  /cover:|check:|print\s*cnt|tbl:|table:/i,
  /gst\s*id/i,
  /^\d{5}\s+[A-Za-z]/, // postal lines "50088 Kuala Lumpur"
]
const isSkip = (l: string) => SKIP_PATTERNS.some(r => r.test(l))

// Detail line with unit×qty and a line total, e.g. "220029...309  14.59*1  14.59 S"
// Captures: [1]=unit price, [2]=qty, [3]=LINE TOTAL (the number we actually want)
const DETAIL_RE = /(\d{1,4}(?:\.\d{2}))\s*[*xX]\s*(\d+)\s+(\d{1,5}(?:\.\d{2}))\s*[A-Za-z]{0,2}\s*$/

// A line that is ONLY a price (price sits on its own line below the item name)
const PRICE_ONLY_RE = /^(?:RM\s*)?([\d,]{1,8}(?:\.\d{2}))\s*[A-Za-z]{0,2}\s*$/

// Item name and price on the SAME line, e.g. "Nasi Lemak  8.50"
const SAME_LINE_RE = /^(.*[A-Za-z].*?)\s+(?:RM\s*)?(\d{1,5}(?:\.\d{2}))\s*[A-Za-z]{0,2}\s*$/

const hasLetters = (l: string) => /[A-Za-z]/.test(l)

function cleanName(n: string): string {
  return n
    .replace(/^\d{1,3}\s*[xX]\s+/, '')   // leading "2x "
    .replace(/^\d{1,3}[.)]\s+/, '')      // leading "1. " / "3) "
    .replace(/^[-•*]\s*/, '')            // leading bullet
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function parseReceiptText(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const items: ParsedItem[] = []
  let counter = 0
  let pendingName = '' // most recent line that looks like an item name

  const push = (rawNameSource: string, qty: number, total: number) => {
    const name = cleanName(rawNameSource)
    if (name.length < 2 || /^\d+$/.test(name)) return
    if (!(total > 0) || total > 100000) return
    const q = Math.max(1, qty)
    const unit = Math.round((total / q) * 100) / 100
    items.push({ id: String(++counter), name, price: unit, quantity: q })
  }

  for (const line of lines) {
    if (isSkip(line)) { pendingName = ''; continue }

    let m: RegExpMatchArray | null

    // 1) "<barcode> <unit>*<qty> <total> S"  → use the LINE TOTAL, name is the line above
    if ((m = line.match(DETAIL_RE))) {
      push(pendingName, parseInt(m[2]), parseFloat(m[3]))
      pendingName = ''
      continue
    }

    // 2) price alone on its line → belongs to the name we saw just before
    if ((m = line.match(PRICE_ONLY_RE))) {
      if (pendingName) {
        push(pendingName, 1, parseFloat(m[1].replace(/,/g, '')))
        pendingName = ''
      }
      continue
    }

    // 3) "Name ..... price" on one line
    if ((m = line.match(SAME_LINE_RE))) {
      push(m[1], 1, parseFloat(m[2].replace(/,/g, '')))
      pendingName = ''
      continue
    }

    // 4) otherwise, if it reads like a name, remember it for the next price/detail line
    if (hasLetters(line) && !/^\d+$/.test(line)) {
      pendingName = line
    }
  }

  return items
}
