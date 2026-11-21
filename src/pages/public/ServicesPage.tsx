import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Wrench } from 'lucide-react'

export function ServicesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', 'all-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-12">
        <Wrench className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          ProFix connects you with certified professionals for all your home service needs.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6 space-y-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border p-6 bg-card hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-3">{cat.icon ?? '🔧'}</div>
              <h3 className="text-lg font-semibold mb-2">{cat.name}</h3>
              {cat.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
