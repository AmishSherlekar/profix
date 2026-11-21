import { Link } from 'react-router-dom'
import { MapPin, Star, Briefcase } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerificationBadge, AvailabilityBadge } from '@/components/shared/StatusBadges'
import { StarRating } from '@/components/shared/StarRating'
import { getInitials } from '@/lib/utils'
import type { ProfessionalSearchResult } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface ProfessionalCardProps {
  pro: ProfessionalSearchResult
  showRequestButton?: boolean
}

export function ProfessionalCard({ pro, showRequestButton = false }: ProfessionalCardProps) {
  const avatarUrl = pro.avatar_path
    ? supabase.storage.from('avatars').getPublicUrl(pro.avatar_path).data.publicUrl
    : null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 flex-shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={pro.full_name} />}
            <AvatarFallback className="text-sm">{getInitials(pro.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm truncate">{pro.full_name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <VerificationBadge status={pro.verification_status} />
                  <AvailabilityBadge status={pro.availability_status} />
                </div>
              </div>
              {showRequestButton && (
                <Button size="sm" asChild>
                  <Link to={`/customer/professionals/${pro.user_id}`}>View Profile</Link>
                </Button>
              )}
            </div>

            {pro.bio && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pro.bio}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              {pro.review_count > 0 ? (
                <span className="flex items-center gap-1">
                  <StarRating rating={pro.average_rating} size="sm" />
                  <span className="ml-1">{pro.average_rating.toFixed(1)} ({pro.review_count})</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3 w-3" />
                  No reviews yet
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {pro.experience_years} yr{pro.experience_years !== 1 ? 's' : ''} exp.
              </span>
              {pro.service_area && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {pro.service_area}
                </span>
              )}
              {pro.distance_km !== null && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  {pro.distance_km.toFixed(1)} km away
                </span>
              )}
            </div>

            {pro.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {pro.categories.map((cat) => (
                  <span key={cat} className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {pro.starting_price && (
              <p className="text-xs text-primary font-semibold mt-2">From ₹{pro.starting_price}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
