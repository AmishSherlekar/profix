import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/shared/StarRating'
import { formatDate } from '@/lib/utils'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'

export function AdminReviewsPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(full_name),
          professional:profiles!reviews_professional_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    refetchInterval: (query) => (document.hidden ? false : 30000),
    staleTime: 20000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: profile!.id,
        target_user_id: null,
        action: 'delete_review',
        reason: `Deleted review ${reviewId}`,
      })
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <p className="text-muted-foreground">Remove inappropriate reviews.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {reviews?.length ?? 0} reviews</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : reviews?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-4 divide-y divide-border">
              {reviews?.map((r) => {
                const cust = r.customer as { full_name: string } | null
                const pro = r.professional as { full_name: string } | null
                return (
                  <div key={r.id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StarRating rating={r.rating} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          by {cust?.full_name ?? '—'} → {pro?.full_name ?? '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                          <AlertDialogDescription>This action is irreversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(r.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
