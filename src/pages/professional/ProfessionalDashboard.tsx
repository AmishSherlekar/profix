import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList, Star, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VerificationBadge, AvailabilityBadge, RequestStatusBadge } from '@/components/shared/StatusBadges'
import { StarRating } from '@/components/shared/StarRating'
import { formatDate } from '@/lib/utils'

export function ProfessionalDashboard() {
  const { profile } = useAuth()

  const { data: proProfile } = useQuery({
    queryKey: ['pro-profile', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', profile!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!profile,
  })

  const { data: requests, isLoading } = useQuery({
    queryKey: ['pro-requests-summary', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id, status, created_at, description,
          service_categories(name, icon),
          customer:profiles!service_requests_customer_id_fkey(full_name)
        `)
        .eq('professional_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: !!profile,
    refetchInterval: (query) => (document.hidden ? false : 15000),
    staleTime: 10000,
  })

  const activeCount = requests?.filter((r) =>
    ['open', 'accepted', 'in_progress', 'pending_confirmation'].includes(r.status),
  ).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {profile?.full_name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Your professional dashboard.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active requests</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average rating</p>
                <p className="text-2xl font-bold">
                  {proProfile ? proProfile.average_rating.toFixed(1) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total reviews</p>
                <p className="text-2xl font-bold">{proProfile?.review_count ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile status */}
      {proProfile && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <VerificationBadge status={proProfile.verification_status} />
                <AvailabilityBadge status={proProfile.availability_status} />
                {proProfile.average_rating > 0 && <StarRating rating={proProfile.average_rating} size="sm" />}
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/pro/profile">Edit Profile</Link>
              </Button>
            </div>
            {proProfile.verification_status === 'pending' && (
              <p className="text-xs text-muted-foreground mt-2">
                Your profile is pending admin verification. Upload certificates to speed up the process.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Incoming Requests</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pro/requests">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : requests?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No requests yet. Complete your profile to start receiving requests.</p>
          ) : (
            <div className="space-y-3">
              {requests?.map((r) => {
                const cat = r.service_categories as unknown as { name: string; icon: string | null } | null
                const cust = r.customer as unknown as { full_name: string } | null
                return (
                  <Link
                    key={r.id}
                    to={`/pro/requests/${r.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{cat?.icon} {cat?.name}</p>
                      <p className="text-xs text-muted-foreground">From {cust?.full_name} · {formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RequestStatusBadge status={r.status} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
