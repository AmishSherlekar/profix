import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, SlidersHorizontal, Loader2, Map as MapIcon, LayoutGrid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProfessionalCard } from '@/components/professional/ProfessionalCard'
import { ProfessionalMapView } from '@/components/professional/ProfessionalMapView'
import type { ServiceCategory, ProfessionalSearchResult } from '@/types/database'

export function FindProfessionalsPage() {
  const [searchParams] = useSearchParams()
  const geo = useGeolocation()

  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') ?? 'all')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [minRating, setMinRating] = useState<string>('0')
  const [radiusKm, setRadiusKm] = useState(50)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const { data: categories } = useQuery<ServiceCategory[]>({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').eq('is_active', true).order('name')
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })

  const { data: professionals, isLoading, error } = useQuery<ProfessionalSearchResult[]>({
    queryKey: ['professionals', 'search', categoryFilter, availableOnly, minRating, geo.latitude, geo.longitude, radiusKm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_professionals_nearby', {
        p_lat: geo.latitude ?? 20.5937,
        p_lng: geo.longitude ?? 78.9629,
        p_radius_km: geo.latitude ? radiusKm : 9999,
        p_category_id: categoryFilter && categoryFilter !== 'all' ? categoryFilter : null,
        p_min_rating: parseFloat(minRating) > 0 ? parseFloat(minRating) : null,
        p_available_only: availableOnly,
      })
      if (error) throw error
      return (data as ProfessionalSearchResult[]) ?? []
    },
    staleTime: 1000 * 60 * 2,
  })

  function handleUseLocation() {
    geo.request()
  }

  const userLocationCoords: [number, number] | null = (geo.latitude && geo.longitude)
    ? [geo.latitude, geo.longitude]
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Find Professionals</h1>
          <p className="text-muted-foreground">Browse verified plumbers and electricians in your area.</p>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-start sm:self-auto">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className="h-8 px-3"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" /> Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            className="h-8 px-3"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="h-4 w-4 mr-1.5" /> Map View
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger>
              <SelectValue placeholder="Min. rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any rating</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>

          <Select value={availableOnly ? 'yes' : 'no'} onValueChange={(v) => setAvailableOnly(v === 'yes')}>
            <SelectTrigger>
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Any availability</SelectItem>
              <SelectItem value="yes">Available only</SelectItem>
            </SelectContent>
          </Select>

          {geo.latitude ? (
            <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Within 10 km</SelectItem>
                <SelectItem value="25">Within 25 km</SelectItem>
                <SelectItem value="50">Within 50 km</SelectItem>
                <SelectItem value="100">Within 100 km</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Button variant="outline" onClick={handleUseLocation} disabled={geo.isLoading}>
              {geo.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Use my location
            </Button>
          )}
        </div>
        {geo.error && (
          <p className="text-xs text-muted-foreground">Location unavailable: {geo.error}</p>
        )}
      </div>

      {/* Map or Grid View */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <ProfessionalMapView
            professionals={professionals ?? []}
            userLocation={userLocationCoords}
          />
          <p className="text-xs text-muted-foreground">
            * Exact customer coordinates are never shared. Distances and map pins reflect general area coordinates.
          </p>
        </div>
      ) : null}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-5">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load professionals. Please try again.</AlertDescription>
        </Alert>
      ) : professionals?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <h3 className="font-medium mb-1">No professionals found</h3>
          <p className="text-sm">Try adjusting your filters or expanding the search radius.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <p className="text-sm text-muted-foreground">
            {professionals?.length} professional{professionals?.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionals?.map((pro) => (
              <ProfessionalCard key={pro.user_id} pro={pro} showRequestButton />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
