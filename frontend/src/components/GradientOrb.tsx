import type { CSSProperties } from 'react'

type Color = 'blue' | 'pink' | 'purple'
type Size = 'small' | 'medium' | 'large'

const sizeMap: Record<Size, string> = {
  small: '128px',
  medium: '256px',
  large: '384px',
}

const colorMap: Record<Color, string> = {
  blue: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, rgba(147, 197, 253, 0.2) 40%, rgba(186, 230, 253, 0.15) 70%, transparent 100%)',
  pink: 'radial-gradient(circle, rgba(251, 207, 232, 0.4) 0%, rgba(216, 180, 254, 0.2) 40%, rgba(191, 219, 254, 0.15) 70%, transparent 100%)',
  purple: 'radial-gradient(circle, rgba(216, 180, 254, 0.4) 0%, rgba(191, 219, 254, 0.2) 40%, rgba(251, 207, 232, 0.15) 70%, transparent 100%)',
}

export function GradientOrb({
  className = '',
  color = 'blue',
  size = 'large',
}: {
  className?: string
  color?: Color
  size?: Size
}) {
  const dim = sizeMap[size]
  const style: CSSProperties = {
    position: 'absolute',
    width: dim,
    height: dim,
    borderRadius: '50%',
    background: colorMap[color],
    filter: 'blur(80px)',
    opacity: 0.6,
    pointerEvents: 'none',
  }
  return <div className={className} style={style} aria-hidden />
}
