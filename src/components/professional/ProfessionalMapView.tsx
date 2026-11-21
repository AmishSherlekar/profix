import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import { ProfessionalSearchResult } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { StarRating } from '@/components/shared/StarRating'

// Custom pin marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

interface ProfessionalMapViewProps {
  professionals: ProfessionalSearchResult[]
  userLocation?: [number, number] | null
}

export function ProfessionalMapView({ professionals, userLocation }: ProfessionalMapViewProps) {
  const defaultCenter: [number, number] = userLocation || [20.5937, 78.9629] // India centroid or user loc
  const validPros = professionals.filter(p => p.latitude !== null && p.longitude !== null)

  return (
    <div className="h-[450px] w-full rounded-xl overflow-hidden border border-border shadow-sm z-0">
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 12 : 5}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater center={defaultCenter} />

        {/* User location pin */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="font-semibold text-xs">📍 Your approximate location</div>
            </Popup>
          </Marker>
        )}

        {/* Professionals pins */}
        {validPros.map((pro) => (
          <Marker
            key={pro.user_id}
            position={[pro.latitude!, pro.longitude!]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-1 space-y-1 min-w-[160px]">
                <h4 className="font-bold text-sm text-foreground">{pro.full_name}</h4>
                <div className="flex items-center gap-1">
                  <StarRating rating={pro.average_rating} size="sm" />
                  <span className="text-xs text-muted-foreground">({pro.review_count})</span>
                </div>
                {pro.service_area && (
                  <p className="text-xs text-muted-foreground">Area: {pro.service_area}</p>
                )}
                {pro.distance_km !== null && (
                  <p className="text-xs font-medium text-primary">{pro.distance_km.toFixed(1)} km away</p>
                )}
                <div className="pt-2">
                  <Button size="sm" className="w-full h-7 text-xs" asChild>
                    <Link to={`/customer/professionals/${pro.user_id}`}>View Profile</Link>
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
