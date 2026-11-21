import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRate?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  const sizeClasses = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive && onRate ? () => onRate(star) : undefined}
          className={cn(
            interactive && 'cursor-pointer hover:scale-110 transition-transform',
            !interactive && 'cursor-default',
          )}
          aria-label={interactive ? `Rate ${star} out of ${max}` : undefined}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-gray-300',
            )}
          />
        </button>
      ))}
    </div>
  )
}
