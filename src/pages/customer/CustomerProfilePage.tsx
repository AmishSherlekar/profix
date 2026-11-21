import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Camera, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { profileSchema, type ProfileFormValues } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getInitials } from '@/lib/utils'

export function CustomerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const qc = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: values.full_name, phone: values.phone ?? null, updated_at: new Date().toISOString() })
        .eq('id', profile!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await refreshProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Avatar must be smaller than 2 MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Only JPEG, PNG, or WebP images are allowed')
      return
    }
    setAvatarUploading(true)
    const path = `${profile.id}/avatar.${file.type.split('/')[1]}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
      setSaveError(error.message)
    } else {
      await supabase.from('profiles').update({ avatar_path: path }).eq('id', profile.id)
      await refreshProfile()
    }
    setAvatarUploading(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
          <CardDescription>Upload a profile picture (max 2 MB, JPEG/PNG/WebP).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name} />}
              <AvatarFallback className="text-lg">{getInitials(profile?.full_name ?? '')}</AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarUploading ? 'Uploading…' : 'Change photo'}
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Info</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => { setSaveError(null); updateProfile.mutate(v) })} className="space-y-4" noValidate>
            {saveError && <Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>}
            {saveSuccess && <Alert variant="success"><AlertDescription>Profile updated!</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="9876543210" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
