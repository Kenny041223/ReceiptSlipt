// Tally icon set (stroke-based, inherit currentColor)
type P = React.SVGProps<SVGSVGElement>
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const CameraIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.95l.5-.85A2 2 0 0 1 10.6 3h2.8a2 2 0 0 1 1.7.95l.5.85A2 2 0 0 0 17.3 6h1.2A2.5 2.5 0 0 1 21 8.5V18a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)
export const StatsIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>
)
export const ProfileIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" /></svg>
)
export const ReceiptIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 2.5h12v19l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 21.5z" /><path d="M9.5 8h5M9.5 12h5" /></svg>
)
export const UploadIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" /></svg>
)
export const ArrowLeftIcon = (p: P) => (
  <svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>
)
export const ArrowRightIcon = (p: P) => (
  <svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}><path d="M5 12.5l4.5 4.5L19 6.5" /></svg>
)
export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const SparkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
)
export const LockIcon = (p: P) => (
  <svg {...base} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const HistoryIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></svg>
)
export const CopyIcon = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15.5A2 2 0 0 1 3.5 13.6V5.5A2 2 0 0 1 5.5 3.5h8a2 2 0 0 1 2 2" /></svg>
)
export const EditIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16z" /></svg>
)
export const FlipIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 9a8 8 0 0 1 13-3l2 2M20 15a8 8 0 0 1-13 3l-2-2" /><path d="M19 4v4h-4M5 20v-4h4" /></svg>
)
export const HomeIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /><path d="M9.5 21v-6h5v6" /></svg>
)
export const UsersIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 4.2a3.4 3.4 0 0 1 0 6.6M17.5 14.6c2 .8 3.5 2.7 3.5 5.4" /></svg>
)

// Animated receipt that repeatedly tears in half (used in the dock's center button)
export const BreakReceipt = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" className="break-receipt" {...p}>
    <g className="brk brk-l">
      <path d="M6 3.5 h5 l-1 2 l1 2 l-1 2 l1 2 l-1 2 l1 2 l-1 2 H6 Z" />
      <path d="M8 8 h1.6 M8 12 h1.6 M8 16 h1.2" strokeWidth={1.5} />
    </g>
    <g className="brk brk-r">
      <path d="M18 3.5 h-5 l1 2 l-1 2 l1 2 l-1 2 l1 2 l-1 2 l1 2 H18 Z" />
      <path d="M14.4 8 H16 M14.4 12 H16 M14.8 16 H16" strokeWidth={1.5} />
    </g>
  </svg>
)
