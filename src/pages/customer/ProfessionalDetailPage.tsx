import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { MapPin, Briefcase, Star, ArrowLeft, Send, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { serviceRequestSchema, type ServiceRequestFormValues } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { VerificationBadge, AvailabilityBadge } from '@/components/shared/StatusBadges'
import { StarRating } from '@/components/shared/StarRating'
import { getInitials, formatDateOnly } from '@/lib/utils'

export function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: pro, isLoading } = useQuery({
    queryKey: ['professional-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!professional_profiles_user_id_fkey(*),
          professional_services(*, service_categories(*))
        `)
        .eq('user_id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: reviews } = useQuery({
    queryKey: ['pro-reviews-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_customer_id_fkey(full_name)')
        .eq('professional_id', id!)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').eq('is_active', true).order('name')
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
  })

  const submitRequest = useMutation({
    mutationFn: async (values: ServiceRequestFormValues) => {
      const { data, error } = await supabase.rpc('submit_service_request', {
        p_professional_id: id!,
        p_category_id: values.category_id,
        p_description: values.description,
        p_preferred_date: values.preferred_date ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-requests'] })
      setRequestDialogOpen(false)
      reset()
      navigate('/customer/requests')
    },
    onError: (err: Error) => {
      setSubmitError(err.message)
    },
  })

  const avatarUrl = pro?.profiles?.avatar_path
    ? supabase.storage.from('avatars').getPublicUrl(pro.profiles.avatar_path).data.publicUrl
    : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
      </div>
    )
  }

  if (!pro) return <Alert variant="destructive"><AlertDescription>Professional not found.</AlertDescription></Alert>

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/customer/find"><ArrowLeft className="h-4 w-4 mr-1" /> Back to search</Link>
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="h-20 w-20 flex-shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={pro.profiles?.full_name} />}
              <AvatarFallback className="text-lg">{getInitials(pro.profiles?.full_name ?? 'P')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{pro.profiles?.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <VerificationBadge status={pro.verification_status} />
                <AvailabilityBadge status={pro.availability_status} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {pro.experience_years} yr{pro.experience_years !== 1 ? 's' : ''} experience
                </span>
                {pro.service_area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {pro.service_area}
                  </span>
                )}
                {pro.review_count > 0 && (
                  <span className="flex items-center gap-1">
                    <StarRating rating={pro.average_rating} size="sm" />
                    <span className="ml-1">{pro.average_rating.toFixed(1)} ({pro.review_count} reviews)</span>
                  </span>
                )}
              </div>
              {pro.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{pro.bio}</p>}
            </div>
            {profile?.role === 'customer' && pro.availability_status === 'available' && (
              <Button onClick={() => setRequestDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      {pro.professional_services?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Services Offered</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pro.professional_services.filter((s: { is_active: boolean }) => s.is_active).map((s: {
              id: string
              service_categories: { name: string; icon?: string | null } | null
              description: string | null
              starting_price: number | null
            }) => (
              <div key={s.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/40">
                <div>
                  <span className="font-medium text-sm">
                    {s.service_categories?.icon} {s.service_categories?.name}
                  </span>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
                {s.starting_price && (
                  <span className="text-sm font-semibold text-primary flex-shrink-0">From ₹{s.starting_price}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" /> Reviews ({reviews?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {reviews?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews?.map((r) => (
                <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {(r.profiles as { full_name: string } | null)?.full_name ?? 'Customer'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDateOnly(r.created_at)}</span>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Service Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => { setSubmitError(null); submitRequest.mutate(v) })} className="space-y-4" noValidate>
            {submitError && <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label>Service Category</Label>
              <Select onValueChange={(v) => setValue('category_id', v)} value={watch('category_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Describe the work needed</Label>
              <Textarea placeholder="E.g. My bathroom tap is leaking and needs replacement..." className="min-h-[100px]" {...register('description')} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Preferred date (optional)</Label>
              <Input type="date" min={new Date().toISOString().split('T')[0]} {...register('preferred_date')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || submitRequest.isPending}>
                {submitRequest.isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
