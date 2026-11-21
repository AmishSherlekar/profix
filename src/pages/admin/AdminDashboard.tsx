import { useQuery } from '@tanstack/react-query'
import { Users, ClipboardList, ShieldCheck, Star, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, prosRes, requestsRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'professional'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }),
        supabase.from('professional_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      ])
      return {
        users: usersRes.count ?? 0,
        professionals: prosRes.count ?? 0,
        requests: requestsRes.count ?? 0,
        pendingVerification: pendingRes.count ?? 0,
      }
    },
    refetchInterval: (query) => (document.hidden ? false : 30000),
    staleTime: 20000,
  })

  const statCards = [
    { label: 'Total Users', value: stats?.users, icon: Users },
    { label: 'Professionals', value: stats?.professionals, icon: TrendingUp },
    { label: 'Service Requests', value: stats?.requests, icon: ClipboardList },
    { label: 'Pending Verification', value: stats?.pendingVerification, icon: ShieldCheck },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Platform health at a glance.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12 mt-0.5" />
                  ) : (
                    <p className="text-2xl font-bold">{s.value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
