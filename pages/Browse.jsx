import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import ListingCard from '../components/ListingCard'
import { Search, MapPin, List, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const FOOD_TYPES = ['all', 'cooked', 'raw', 'bakery', 'dairy', 'produce', 'other']
const OFFER_TYPES = ['all', 'free', 'discounted', 'exchange']

export default function Browse() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [foodType, setFoodType] = useState('all')
  const [offerType, setOfferType] = useState('all')
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]), () => {})
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('listings').select('*, profiles(full_name, org_name)').eq('status', 'active').order('created_at', { ascending: false })
    if (foodType !== 'all') query = query.eq('food_type', foodType)
    if (offerType !== 'all') query = query.eq('offer_type', offerType)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }, [foodType, offerType, search])

  useEffect(() => {
    const t = setTimeout(fetchListings, 300)
    return () => clearTimeout(t)
  }, [fetchListings])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Available Food</h1>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search food listings..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input md:w-40" value={foodType} onChange={e => setFoodType(e.target.value)}>
          {FOOD_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="input md:w-40" value={offerType} onChange={e => setOfferType(e.target.value)}>
          {OFFER_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Offers' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView('grid')} className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${view === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
            <List className="w-4 h-4" /> Grid
          </button>
          <button onClick={() => setView('map')} className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${view === 'map' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
            <MapPin className="w-4 h-4" /> Map
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">{loading ? 'Loading...' : `${listings.length} listings available`}</p>
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-green-600" /></div>
      ) : view === 'grid' ? (
        listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No listings found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )
      ) : (
        <div className="h-[600px] rounded-xl overflow-hidden border border-gray-200">
          <MapContainer center={userLocation} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {listings.filter(l => l.pickup_lat && l.pickup_lng).map(l => (
              <Marker key={l.id} position={[l.pickup_lat, l.pickup_lng]}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold">{l.title}</p>
                    <p className="text-sm text-gray-500">{l.quantity} {l.quantity_unit}</p>
                    <Link to={`/listing/${l.id}`} className="block mt-2 text-center bg-green-600 text-white text-xs py-1.5 rounded-md">View Details</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}