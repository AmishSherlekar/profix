import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Clock, XCircle } from 'lucide-react'
import type { VerificationStatus, AvailabilityStatus, RequestStatus } from '@/types/database'
import { cn } from '@/lib/utils'

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified') {
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        Verified
      </Badge>
    )
  }
  if (status === 'pending') {
    return (
      <Badge variant="warning" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Rejected
    </Badge>
  )
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const map: Record<AvailabilityStatus, { label: string; className: string }> = {
    available: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
    busy: { label: 'Busy', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    offline: { label: 'Offline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const { label, className } = map[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', className)}>
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', {
        'bg-green-500': status === 'available',
        'bg-yellow-500': status === 'busy',
        'bg-gray-400': status === 'offline',
      })} />
      {label}
    </span>
  )
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
    open: { label: 'Open', variant: 'secondary' },
    accepted: { label: 'Accepted', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    pending_confirmation: { label: 'Awaiting Confirmation', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    reviewed: { label: 'Reviewed', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
