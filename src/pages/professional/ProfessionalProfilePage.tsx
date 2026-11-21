import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Save, Upload, MapPin, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { professionalProfileSchema, type ProfessionalProfileFormValues } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { VerificationBadge } from '@/components/shared/StatusBadges'
import { useGeolocation } from '@/hooks/useGeolocation'

export function ProfessionalProfilePage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const geo = useGeolocation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  const { data: proProfile } = useQuery({
    queryKey: ['pro-profile', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', profile!.id)
        .single()
      return data
    },
    enabled: !!profile,
  })

  const { data: docs } = useQuery({
    queryKey: ['pro-docs', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_documents')
        .select('*')
        .eq('professional_id', proProfile!.id)
      if (error) throw error
      return data
    },
    enabled: !!proProfile,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ProfessionalProfileFormValues>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      bio: '',
      experience_years: 0,
      service_area: '',
      availability_status: 'available',
      latitude: null,
      longitude: null,
    },
  })

  useEffect(() => {
    if (proProfile) {
      reset({
        bio: proProfile.bio ?? '',
        experience_years: proProfile.experience_years,
        service_area: proProfile.service_area ?? '',
        availability_status: proProfile.availability_status,
        latitude: proProfile.latitude,
        longitude: proProfile.longitude,
      })
    }
  }, [proProfile, reset])

  useEffect(() => {
    if (geo.latitude && geo.longitude) {
      setValue('latitude', geo.latitude)
      setValue('longitude', geo.longitude)
    }
  }, [geo.latitude, geo.longitude, setValue])

  const updateMutation = useMutation({
    mutationFn: async (values: ProfessionalProfileFormValues) => {
      const { error } = await supabase
        .from('professional_profiles')
        .update({
          bio: values.bio || null,
          experience_years: values.experience_years,
          service_area: values.service_area || null,
          availability_status: values.availability_status,
          latitude: values.latitude ?? null,
          longitude: values.longitude ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile!.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pro-profile', profile?.id] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !proProfile) return
    if (file.size > 5 * 1024 * 1024) { setDocError('File must be under 5 MB'); return }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) { setDocError('Only PDF, JPEG, PNG files allowed'); return }
    setDocUploading(true)
    setDocError(null)
    const path = `${proProfile.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('professional-docs').upload(path, file)
    if (uploadError) { setDocError(uploadError.message); setDocUploading(false); return }
    await supabase.from('professional_documents').insert({
      professional_id: proProfile.id,
      storage_path: path,
      document_type: file.type.startsWith('image/') ? 'certificate_image' : 'certificate_pdf',
      verification_status: 'pending',
    })
    qc.invalidateQueries({ queryKey: ['pro-docs', profile?.id] })
    setDocUploading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Professional Profile</h1>
        <p className="text-muted-foreground">Customers see this when they view your profile.</p>
      </div>

      {proProfile && (
        <div className="flex items-center gap-3 flex-wrap">
          <VerificationBadge status={proProfile.verification_status} />
          {proProfile.verification_status === 'pending' && (
            <p className="text-xs text-muted-foreground">Upload certificates below to request verification.</p>
          )}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => { setSaveError(null); updateMutation.mutate(v) })}
            className="space-y-4"
            noValidate
          >
            {saveError && <Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>}
            {saveSuccess && <Alert variant="success"><AlertDescription>Profile saved!</AlertDescription></Alert>}

            <div className="space-y-1.5">
              <Label>Bio / About me</Label>
              <Textarea placeholder="Tell customers about your skills and work ethic…" className="min-h-[100px]" {...register('bio')} />
              {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Years of experience</Label>
              <Input type="number" min={0} max={60} {...register('experience_years', { valueAsNumber: true })} />
              {errors.experience_years && <p className="text-xs text-destructive">{errors.experience_years.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Service area (city / neighbourhood)</Label>
              <Input placeholder="e.g. Bandra, Mumbai" {...register('service_area')} />
            </div>

            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select
                value={watch('availability_status')}
                onValueChange={(v) => setValue('availability_status', v as 'available' | 'busy' | 'offline')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available — accepting new jobs</SelectItem>
                  <SelectItem value="busy">Busy — temporarily unavailable</SelectItem>
                  <SelectItem value="offline">Offline — not taking jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Your location (for proximity search)</Label>
              <div className="flex gap-2">
                <Input type="number" step="any" placeholder="Latitude" {...register('latitude', { valueAsNumber: true })} className="flex-1" />
                <Input type="number" step="any" placeholder="Longitude" {...register('longitude', { valueAsNumber: true })} className="flex-1" />
                <Button type="button" variant="outline" onClick={() => geo.request()} disabled={geo.isLoading}>
                  {geo.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used to show your distance from customers. Click the pin to auto-detect.</p>
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving…' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certificate upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificates & Documents</CardTitle>
          <CardDescription>Upload your trade certificates for admin verification (PDF, JPEG, PNG, max 5 MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {docError && <Alert variant="destructive"><AlertDescription>{docError}</AlertDescription></Alert>}
          <label htmlFor="doc-upload">
            <Button variant="outline" size="sm" asChild disabled={docUploading}>
              <span>
                {docUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {docUploading ? 'Uploading…' : 'Upload document'}
              </span>
            </Button>
            <input id="doc-upload" type="file" accept=".pdf,image/jpeg,image/png" className="sr-only" onChange={handleDocUpload} />
          </label>
          {docs && docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm border border-border rounded-lg p-3">
                  <span className="truncate">{d.storage_path.split('/').pop()}</span>
                  <Badge variant={d.verification_status === 'verified' ? 'success' : d.verification_status === 'rejected' ? 'destructive' : 'secondary'}>
                    {d.verification_status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
