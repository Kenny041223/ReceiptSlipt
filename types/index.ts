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
  createdAt: number
}

export interface SplitResult {
  personId: string
  personName: string
  items: { itemName: string; share: number }[]
  total: number
}
