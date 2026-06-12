export interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
  assignedTo: string[]
}

export interface Person {
  id: string
  name: string
}

export interface ReceiptSession {
  id: string
  items: ReceiptItem[]
  people: Person[]
  rawText?: string
  taxRate: number  // percent, e.g. 6 = 6%
  tipPct: number   // percent
  createdAt: number
}

export interface SplitResult {
  personId: string
  personName: string
  items: { itemName: string; share: number; shared: boolean }[]
  subtotal: number
  tax: number
  tip: number
  total: number
}
