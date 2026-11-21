import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ShieldCheck, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { VerificationBadge } from '@/components/shared/StatusBadges'
import { formatDate } from '@/lib/utils'
import type { VerificationStatus } from '@/types/database'

export function AdminVerificationPage() {
  const qc = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedPro, setSelectedPro] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const { data: pros, isLoading } = useQuery({
    queryKey: ['admin-pending-pros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!professional_profiles_user_id_fkey(full_name, phone),
          professional_documents(*)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    refetchInterval: (query) => (document.hidden ? false : 30000),
    staleTime: 20000,
  })

  const verifyMutation = useMutation({
    mutationFn: async ({ proId, status }: { proId: string; status: VerificationStatus }) => {
      const { error } = await supabase.rpc('verify_professional', {
        p_professional_id: proId,
        p_status: status,
        p_reason: reason || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-pros'] })
      setSelectedPro(null)
      setReason('')
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const pending = pros?.filter((p) => p.verification_status === 'pending') ?? []
  const others = pros?.filter((p) => p.verification_status !== 'pending') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Professional Verification</h1>
        <p className="text-muted-foreground">{pending.length} pending review{pending.length !== 1 ? 's' : ''}.</p>
      </div>

      {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-base text-yellow-700">⏳ Pending Verification ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending verifications.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((pro) => {
                const user = pro.profiles as { full_name: string; phone: string | null } | null
                const docs = pro.professional_documents as { id: string; storage_path: string; document_type: string }[]
                return (
                  <div key={pro.id} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pro.experience_years} yrs exp · {pro.service_area ?? 'No area set'} · Joined {formatDate(pro.created_at)}
                        </p>
                        {pro.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pro.bio}</p>}
                      </div>
                      <VerificationBadge status={pro.verification_status} />
                    </div>
                    {docs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {docs.map((d) => (
                          <a
                            key={d.id}
                            href={supabase.storage.from('professional-docs').getPublicUrl(d.storage_path).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            {d.storage_path.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => verifyMutation.mutate({ proId: pro.id, status: 'verified' })}
                        disabled={verifyMutation.isPending}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30"
                        onClick={() => setSelectedPro(pro.id)}
                        disabled={verifyMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {others.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Previously Reviewed ({others.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {others.map((pro) => {
                const user = pro.profiles as { full_name: string } | null
                return (
                  <div key={pro.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <p className="text-sm">{user?.full_name}</p>
                    <VerificationBadge status={pro.verification_status} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject reason dialog */}
      <Dialog open={!!selectedPro} onOpenChange={(o) => { if (!o) setSelectedPro(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject verification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Provide a reason for rejection (the professional may resubmit).</p>
            <Textarea
              placeholder="e.g. Certificate unclear, please resubmit a higher quality scan."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPro(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedPro && verifyMutation.mutate({ proId: selectedPro, status: 'rejected' })}
              disabled={verifyMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
