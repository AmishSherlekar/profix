import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RequestStatusBadge } from '@/components/shared/StatusBadges'
import { formatDate } from '@/lib/utils'

export function CustomerDashboard() {
  const { profile } = useAuth()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['customer-requests-summary', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id, status, created_at, description,
          service_categories(name),
          profiles!service_requests_professional_id_fkey(full_name)
        `)
        .eq('customer_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: !!profile,
    refetchInterval: (query) => (document.hidden ? false : 15000),
    staleTime: 10000,
  })

  const stats = {
    total: requests?.length ?? 0,
    active: requests?.filter((r) => ['open', 'accepted', 'in_progress', 'pending_confirmation'].includes(r.status)).length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your service requests.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Find a Professional</h3>
                <p className="text-sm text-muted-foreground">Browse verified plumbers & electricians</p>
              </div>
              <Button size="sm" asChild>
                <Link to="/customer/find"><ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">My Requests</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.active} active · {stats.total} total
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/customer/requests"><ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Requests</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/requests">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No requests yet.</p>
              <Button variant="link" size="sm" asChild className="mt-1">
                <Link to="/customer/find">Find a professional</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests?.map((r) => (
                <Link
                  key={r.id}
                  to={`/customer/requests/${r.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(r.service_categories as unknown as { name: string } | null)?.name ?? 'Service'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
