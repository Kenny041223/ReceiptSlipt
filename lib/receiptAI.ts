import Anthropic from '@anthropic-ai/sdk'
import { ParsedItem } from './receiptParser'

// Model is overridable via env; defaults to Haiku 4.5 (cheap, fast, great at
// structured extraction). Set RECEIPT_PARSER_MODEL=claude-opus-4-8 for max accuracy.
const MODEL = process.env.RECEIPT_PARSER_MODEL || 'claude-haiku-4-5'

// Stable instructions — cached so repeated scans don't re-bill the prompt prefix.
const SYSTEM = `You extract purchased line items from messy OCR text of a retail/restaurant receipt (often Malaysian, prices in RM).

Return ONLY the items a person actually bought, each with:
- name: the product name, cleaned up (keep the descriptive part; you may drop leading product/barcode codes like "D23" or "220029..." if a clearer name remains, but never invent names)
- quantity: integer, default 1 (e.g. "2x", "*2", or a standalone qty column)
- price: the ACTUAL amount paid for that whole line as a number (no currency symbol)

Critical rules for price:
- Use the LINE TOTAL that was charged, NOT the barcode number and NOT the per-unit price.
- Member / promo discounts: if a line shows an original price then a "Memb"/member price and/or a negative adjustment (e.g. "-0.31"), use the FINAL discounted amount actually paid for that line.
- A detail line like "<barcode>  14.59*1  14.59 S" means unit 14.59, qty 1, line total 14.59 → price 14.59.
- "1.05*1  0.84" (discounted) → price 0.84.

NEVER include these as items (skip them entirely):
- Subtotal, Total, Grand Total, Amount Due, Tender, Cash, Change, Rounding
- Tax, GST, SST, Service Charge
- Points, Points Balance, Points Earned, Total Saving, Member balance/expiry
- Store name/address/phone/fax, cashier, date/time, receipt/invoice numbers
- Barcodes on their own, QR codes, URLs, "Download our app", thank-you lines

Respond with ONLY a JSON object, no markdown, no prose, of the form:
{"items":[{"name":"...","quantity":1,"price":0.00}]}
If you cannot find any items, return {"items":[]}.`

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'integer' },
          price: { type: 'number' },
        },
        required: ['name', 'quantity', 'price'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
}

/** Parse receipt OCR text into structured line items using Claude. Throws on failure. */
export async function parseReceiptWithClaude(rawText: string): Promise<ParsedItem[]> {
  const client = new Anthropic() // reads ANTHROPIC_API_KEY

  // output_config is cast through `any` so the call type-checks across SDK versions.
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Receipt OCR text:\n\n${rawText}` }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming)

  const textBlock = res.content.find(b => b.type === 'text') as { text: string } | undefined
  let jsonText = (textBlock?.text ?? '').trim()
  // strip ``` fences if the model added them despite instructions
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  const parsed = JSON.parse(jsonText) as { items?: Array<{ name: unknown; quantity: unknown; price: unknown }> }
  const items = Array.isArray(parsed.items) ? parsed.items : []

  return items
    .filter(it => it && typeof it.name === 'string' && typeof it.price === 'number' && (it.price as number) > 0)
    .map((it, i) => ({
      id: String(i + 1),
      name: String(it.name).trim(),
      price: Number(it.price),
      quantity: Math.max(1, parseInt(String(it.quantity)) || 1),
    }))
}
