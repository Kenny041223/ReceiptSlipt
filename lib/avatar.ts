// Deterministic colorful gradient + initials for a person, derived from their name.
const GRADIENTS = [
  'linear-gradient(140deg,#FF9A7E,#FF7E67)',
  'linear-gradient(140deg,#B79CFF,#7C5BE0)',
  'linear-gradient(140deg,#7EC8FF,#3B82F6)',
  'linear-gradient(140deg,#5BE0C4,#00B894)',
  'linear-gradient(140deg,#FFC56B,#FF9F45)',
  'linear-gradient(140deg,#9DE8FF,#3BC9DB)',
  'linear-gradient(140deg,#FFA8C5,#F0639E)',
  'linear-gradient(140deg,#C7B8FF,#9B7BF0)',
  'linear-gradient(140deg,#A8E6B0,#52C46A)',
]

export function avatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// Solid colors (matching the gradient end-stops) for charts/donuts.
const SOLID = ['#FF7E67', '#7C5BE0', '#3B82F6', '#00B894', '#FF9F45', '#3BC9DB', '#F0639E', '#9B7BF0', '#52C46A']

export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return SOLID[Math.abs(hash) % SOLID.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
