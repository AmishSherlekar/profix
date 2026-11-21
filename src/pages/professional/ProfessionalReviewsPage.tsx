import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/shared/StarRating'
import { formatDateOnly } from '@/lib/utils'

export function ProfessionalReviewsPage() {
  const { profile } = useAuth()

  const { data: proProfile } = useQuery({
    queryKey: ['pro-profile', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('professional_profiles').select('*').eq('user_id', profile!.id).single()
      return data
    },
    enabled: !!profile,
  })

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['pro-reviews', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customer:profiles!reviews_customer_id_fkey(full_name)')
        .eq('professional_id', profile!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profile,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Reviews</h1>
        {proProfile && proProfile.review_count > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={proProfile.average_rating} />
            <span className="text-sm text-muted-foreground">
              {proProfile.average_rating.toFixed(1)} average from {proProfile.review_count} reviews
            </span>
          </div>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{reviews?.length ?? 0} reviews</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : reviews?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No reviews yet. Complete jobs to receive customer reviews.</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-border">
              {reviews?.map((r) => {
                const cust = r.customer as { full_name: string } | null
                return (
                  <div key={r.id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{cust?.full_name ?? 'Customer'}</span>
                      <span className="text-xs text-muted-foreground">{formatDateOnly(r.created_at)}</span>
                    </div>
                    <StarRating rating={r.rating} size="sm" />
                    {r.comment && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.comment}</p>}
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
