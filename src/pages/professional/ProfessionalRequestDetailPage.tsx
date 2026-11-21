import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Play, Wrench, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { RequestStatusBadge } from '@/components/shared/StatusBadges'
import { formatDate, formatDateOnly } from '@/lib/utils'
import type { RequestStatus } from '@/types/database'

export function ProfessionalRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()

  const { data: req, isLoading } = useQuery({
    queryKey: ['pro-request-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_categories(name, icon),
          customer:profiles!service_requests_customer_id_fkey(full_name, phone),
          request_status_history(*, changer:profiles!request_status_history_changed_by_fkey(full_name))
        `)
        .eq('id', id!)
        .eq('professional_id', profile!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id && !!profile,
    refetchInterval: (query) => (document.hidden ? false : 10000),
    staleTime: 8000,
  })

  const updateStatus = useMutation({
    mutationFn: async (newStatus: RequestStatus) => {
      const { data, error } = await supabase.rpc('update_request_status', {
        p_request_id: id!,
        p_new_status: newStatus,
      })
      if (error) throw error
      const result = data as { success: boolean; message: string }
      if (!result.success) throw new Error(result.message)
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pro-request-detail', id] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!req) {
    return <Alert variant="destructive"><AlertDescription>Request not found.</AlertDescription></Alert>
  }

  const cat = req.service_categories as { name: string; icon: string | null } | null
  const customer = req.customer as { full_name: string; phone: string | null } | null
  const history = (req.request_status_history as { id: string; old_status: string | null; new_status: string; created_at: string }[]) ?? []

  const canAccept = req.status === 'open'
  const canReject = req.status === 'open'
  const canStart = req.status === 'accepted'
  const canComplete = req.status === 'in_progress'

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/pro/requests"><ArrowLeft className="h-4 w-4 mr-1" /> All requests</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">{cat?.icon} {cat?.name ?? 'Service Request'}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Received {formatDate(req.created_at)}</p>
            </div>
            <RequestStatusBadge status={req.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Customer</p>
            <p className="text-sm">{customer?.full_name}</p>
            {customer?.phone && ['accepted', 'in_progress', 'pending_confirmation'].includes(req.status) && (
              <p className="text-xs text-muted-foreground">Phone: {customer.phone}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Description</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{req.description}</p>
          </div>
          {req.preferred_date && (
            <div>
              <p className="text-sm font-medium mb-1">Preferred date</p>
              <p className="text-sm text-muted-foreground">{formatDateOnly(req.preferred_date)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {(canAccept || canReject || canStart || canComplete) && (
        <Card>
          <CardContent className="p-5 flex flex-wrap gap-3">
            {canAccept && (
              <Button onClick={() => updateStatus.mutate('accepted')} disabled={updateStatus.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" /> Accept Request
              </Button>
            )}
            {canReject && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/30">
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject this request?</AlertDialogTitle>
                    <AlertDialogDescription>The customer will be notified that their request was rejected.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => updateStatus.mutate('rejected')}
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canStart && (
              <Button onClick={() => updateStatus.mutate('in_progress')} disabled={updateStatus.isPending}>
                <Play className="h-4 w-4 mr-2" /> Start Work
              </Button>
            )}
            {canComplete && (
              <Button onClick={() => updateStatus.mutate('pending_confirmation')} disabled={updateStatus.isPending}>
                <Wrench className="h-4 w-4 mr-2" /> Mark as Complete
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {req.status === 'pending_confirmation' && (
        <Alert variant="warning">
          <AlertDescription>
            You've marked this job complete. Waiting for the customer to confirm completion.
          </AlertDescription>
        </Alert>
      )}

      {/* Status history */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {history.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                  <p className="text-sm font-medium">{h.old_status ? `${h.old_status} → ` : ''}{h.new_status}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
