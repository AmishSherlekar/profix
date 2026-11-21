import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Plus, Pencil, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { categorySchema, type CategoryFormValues } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ServiceCategory } from '@/types/database'

export function AdminCategoriesPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceCategory | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').order('name')
      if (error) throw error
      return data as ServiceCategory[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', icon: '', is_active: true },
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', icon: '', is_active: true })
    setSaveError(null)
    setDialogOpen(true)
  }

  function openEdit(cat: ServiceCategory) {
    setEditing(cat)
    reset({ name: cat.name, description: cat.description ?? '', icon: cat.icon ?? '', is_active: cat.is_active })
    setSaveError(null)
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      if (editing) {
        const { error } = await supabase.from('service_categories').update({
          name: values.name,
          description: values.description || null,
          icon: values.icon || null,
          is_active: values.is_active,
        }).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('service_categories').insert({
          name: values.name,
          description: values.description || null,
          icon: values.icon || null,
          is_active: values.is_active,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Categories</h1>
          <p className="text-muted-foreground">Manage the categories professionals can offer.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" /> {categories?.length ?? 0} categories</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-2">
              {categories?.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon ?? '🔧'}</span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.description && <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => { setSaveError(null); saveMutation.mutate(v) })} className="space-y-4" noValidate>
            {saveError && <Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Plumbing" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this service…" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label>Emoji icon</Label>
              <Input placeholder="🔧" {...register('icon')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" {...register('is_active')} className="rounded" />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
