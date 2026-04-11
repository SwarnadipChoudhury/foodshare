import { Link } from 'react-router-dom'
import { MapPin, Clock, Tag, Utensils } from 'lucide-react'
import { formatDistanceToNow, isAfter } from 'date-fns'

const FOOD_TYPE_COLORS = {
  cooked: 'bg-orange-100 text-orange-700',
  raw: 'bg-green-100 text-green-700',
  bakery: 'bg-yellow-100 text-yellow-700',
  dairy: 'bg-blue-100 text-blue-700',
  produce: 'bg-lime-100 text-lime-700',
  other: 'bg-gray-100 text-gray-700',
}

const OFFER_COLORS = {
  free: 'bg-emerald-100 text-emerald-700',
  discounted: 'bg-amber-100 text-amber-700',
  exchange: 'bg-purple-100 text-purple-700',
}

export default function ListingCard({ listing }) {
  const expiresAt = new Date(listing.expires_at)
  const isExpiringSoon = isAfter(expiresAt, new Date()) && (expiresAt - new Date()) < 3 * 60 * 60 * 1000

  return (
    <Link to={`/listing/${listing.id}`} className="card hover:shadow-md transition-all hover:-translate-y-0.5 block">
      <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="w-16 h-16 text-green-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className={`badge ${FOOD_TYPE_COLORS[listing.food_type]}`}>{listing.food_type}</span>
          <span className={`badge ${OFFER_COLORS[listing.offer_type]}`}>
            {listing.offer_type === 'free' ? 'FREE' : listing.offer_type === 'discounted' ? `₹${listing.discounted_price}` : 'Exchange'}
          </span>
        </div>
        {isExpiringSoon && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            Expiring Soon!
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{listing.title}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{listing.description || 'No description provided.'}</p>
        <div className="flex flex-col gap-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="truncate">{listing.pickup_address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>{listing.quantity} {listing.quantity_unit}</span>
          </div>
        </div>
        {listing.profiles && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            By {listing.profiles.org_name || listing.profiles.full_name}
          </div>
        )}
      </div>
    </Link>
  )
}