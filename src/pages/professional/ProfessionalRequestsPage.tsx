import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RequestStatusBadge } from '@/components/shared/StatusBadges'
import { formatDate } from '@/lib/utils'

export function ProfessionalRequestsPage() {
  const { profile } = useAuth()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['pro-requests', profile?.id],
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
      if (error) throw error
      return data
    },
    enabled: !!profile,
    refetchInterval: (query) => (document.hidden ? false : 15000),
    staleTime: 10000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incoming Requests</h1>
        <p className="text-muted-foreground">All service requests assigned to you.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{requests?.length ?? 0} total requests</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : requests?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No requests yet. Complete your profile to appear in customer searches.
            </p>
          ) : (
            <div className="space-y-3">
              {requests?.map((r) => {
                const cat = r.service_categories as unknown as { name: string; icon: string | null } | null
                const cust = r.customer as unknown as { full_name: string } | null
                return (
                  <Link
                    key={r.id}
                    to={`/pro/requests/${r.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{cat?.icon} {cat?.name ?? 'Service Request'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        From {cust?.full_name} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
