export const colors = {
  yellow: '#FFFF00',
  red: '#FF3B00',
  blue: '#0000FF',
  green: '#00FF00',
  black: '#000000',
  white: '#FFFFFF',
} as const

export const shadows = {
  sm: '4px 4px 0px #000000',
  md: '6px 6px 0px #000000',
  lg: '8px 8px 0px #000000',
} as const

export const borders = {
  width: '3px',
  style: 'solid',
  color: '#000000',
  default: '3px solid #000000',
} as const

export const fonts = {
  grotesk: 'var(--font-space-grotesk), monospace',
  mono: 'var(--font-space-mono), monospace',
} as const
