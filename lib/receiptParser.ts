export interface ParsedItem {
  id: string
  name: string
  price: number
  quantity: number
}

// Lines that indicate totals/headers, not food items
const SKIP_PATTERNS = [
  /subtotal|sub.total/i,
  /service|srv\s*chg/i,
  /\bgst\b|\bsst\b/i,
  /\btax\b/i,
  /amt\s*du|amount\s*due/i,
  /thank\s*you/i,
  /stored/i,
  /^---/,
  /cover:|check:|print\s*cnt|tbl:|table:/i,
  /gst\s*id/i,
  /^\d{5}\s+/,   // postal codes like "50088 Kuala Lumpur"
  /^[TtMmFf]\s*[\d+]/,  // phone lines like "T 03..." or "M+60..."
]

const shouldSkip = (line: string) => SKIP_PATTERNS.some(r => r.test(line))

// Matches a standalone price line: "414.00 S", "13,888.00", "2,760.00 S"
const PRICE_RE = /^([\d,]+\.\d{2})\s*[S]?\s*$/

const isPriceLine = (line: string) => PRICE_RE.test(line)

// Matches a standalone quantity: "1", "3", "12"
const isQtyOnly = (line: string) => /^\d{1,3}$/.test(line)

export function parseReceiptText(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const items: ParsedItem[] = []
  let counter = 0

  for (let i = 0; i < lines.length; i++) {
    if (!isPriceLine(lines[i])) continue

    // Parse the line total (e.g. "13,888.00 S" → 13888)
    const totalPrice = parseFloat(lines[i].replace(/,/g, '').replace(/\s*S\s*$/, ''))
    if (totalPrice <= 0 || totalPrice > 100000) continue

    let name = ''
    let qty = 1

    // Scan backwards from this price line to find the item name and quantity
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const prev = lines[j]

      // Stop if we hit another price line (entered the previous item's territory)
      if (isPriceLine(prev)) break
      // Stop if we hit a header/total keyword
      if (shouldSkip(prev)) break

      // Pure quantity line (e.g., "3")
      if (isQtyOnly(prev)) {
        qty = parseInt(prev)
        if (name) break  // Have both — done
        continue
      }

      // Name candidate line (only take the first/closest one)
      if (!name) {
        let candidate = prev
        // Strip trailing unit price: "@18.00", "138.00", "3,888."
        candidate = candidate.replace(/\s+@?[\d,]+\.?\d{0,2}\s*$/, '').trim()
        // Strip leading qty prefix: "3 Steak Fries" → qty=3, name="Steak Fries"
        // or "1. Chateau Margaux" → qty=1, name="Chateau Margaux"
        const qtyPrefix = candidate.match(/^(\d{1,3})[.)\s]\s*(.+)$/)
        if (qtyPrefix) {
          qty = parseInt(qtyPrefix[1])
          candidate = qtyPrefix[2].trim()
        }

        if (candidate.length >= 2 && !/^\d+$/.test(candidate)) {
          name = candidate
          // Don't break — keep scanning back in case qty is on its own line before
        }
      }
    }

    if (name.length >= 2) {
      // Store unit price so that price × qty = line total
      const unitPrice = qty > 1
        ? Math.round((totalPrice / qty) * 100) / 100
        : totalPrice
      items.push({ id: String(++counter), name, price: unitPrice, quantity: qty })
    }
  }

  return items
}
