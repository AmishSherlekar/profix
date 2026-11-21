import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Clock, CheckCircle, XCircle, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { reviewSchema, type ReviewFormValues } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { RequestStatusBadge } from '@/components/shared/StatusBadges'
import { StarRating } from '@/components/shared/StarRating'
import { formatDate, formatDateOnly } from '@/lib/utils'

export function CustomerRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const { data: req, isLoading } = useQuery({
    queryKey: ['customer-request-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_categories(name, icon),
          professional:profiles!service_requests_professional_id_fkey(full_name, phone),
          request_status_history(*, changer:profiles!request_status_history_changed_by_fkey(full_name)),
          reviews(*)
        `)
        .eq('id', id!)
        .eq('customer_id', profile!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id && !!profile,
    refetchInterval: (query) => (document.hidden ? false : 10000),
    staleTime: 8000,
  })

  const { register, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  })
  const watchRating = watch('rating')

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('update_request_status', {
        p_request_id: id!,
        p_new_status: 'cancelled',
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-request-detail', id] }),
  })

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('update_request_status', {
        p_request_id: id!,
        p_new_status: 'completed',
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-request-detail', id] }),
  })

  const reviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      const { data, error } = await supabase.rpc('submit_review', {
        p_request_id: id!,
        p_rating: values.rating,
        p_comment: values.comment ?? '',
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setReviewSuccess(true)
      qc.invalidateQueries({ queryKey: ['customer-request-detail', id] })
    },
    onError: (err: Error) => setReviewError(err.message),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!req) {
    return <Alert variant="destructive"><AlertDescription>Request not found.</AlertDescription></Alert>
  }

  const cat = req.service_categories as { name: string; icon: string | null } | null
  const pro = req.professional as { full_name: string; phone: string | null } | null
  const review = (req.reviews as unknown[])?.length > 0 ? (req.reviews as { rating: number; comment: string | null; created_at: string }[])[0] : null
  const history = (req.request_status_history as { id: string; old_status: string | null; new_status: string; created_at: string }[]) ?? []

  const canCancel = ['open', 'accepted'].includes(req.status)
  const needsConfirmation = req.status === 'pending_confirmation'
  const canReview = req.status === 'completed' && !review && !reviewSuccess

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/customer/requests"><ArrowLeft className="h-4 w-4 mr-1" /> All requests</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">{cat?.icon} {cat?.name ?? 'Service Request'}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Submitted {formatDate(req.created_at)}</p>
            </div>
            <RequestStatusBadge status={req.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div>
            <p className="text-sm font-medium mb-1">Professional</p>
            <p className="text-sm">{pro?.full_name}</p>
            {pro?.phone && req.status === 'accepted' && (
              <p className="text-xs text-muted-foreground mt-0.5">Phone: {pro.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {(canCancel || needsConfirmation) && (
        <Card>
          <CardContent className="p-5 space-y-3">
            {needsConfirmation && (
              <div className="space-y-2">
                <p className="text-sm font-medium">The professional has marked this job complete.</p>
                <p className="text-sm text-muted-foreground">Please confirm if the work has been done satisfactorily.</p>
                <Button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmMutation.isPending ? 'Confirming…' : 'Confirm Completion'}
                </Button>
              </div>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. The professional will be notified.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep request</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => cancelMutation.mutate()}
                    >
                      Yes, cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {canReview && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" /> Leave a Review</CardTitle></CardHeader>
          <CardContent>
            {reviewSuccess ? (
              <div className="text-center py-4 text-green-700">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Review submitted!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit((v) => { setReviewError(null); reviewMutation.mutate(v) })} className="space-y-4" noValidate>
                {reviewError && <Alert variant="destructive"><AlertDescription>{reviewError}</AlertDescription></Alert>}
                <div className="space-y-1.5">
                  <Label>Your rating</Label>
                  <StarRating rating={watchRating} interactive onRate={(r) => setValue('rating', r)} size="lg" />
                  {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Comment (optional)</Label>
                  <Textarea placeholder="Share your experience…" {...register('comment')} />
                </div>
                <Button type="submit" disabled={reviewMutation.isPending || watchRating === 0}>
                  {reviewMutation.isPending ? 'Submitting…' : 'Submit Review'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing review */}
      {review && (
        <Card>
          <CardHeader><CardTitle className="text-base">Your Review</CardTitle></CardHeader>
          <CardContent>
            <StarRating rating={review.rating} />
            {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
            <p className="text-xs text-muted-foreground mt-1">{formatDateOnly(review.created_at)}</p>
          </CardContent>
        </Card>
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
