import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { MapPin, Clock, Tag, User, AlertTriangle, CheckCircle, Share2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [pickupTime, setPickupTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchListing()
    if (user) checkExistingReservation()
    const channel = supabase.channel(`listing-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `id=eq.${id}` }, payload => setListing(prev => ({ ...prev, ...payload.new }))).subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, user])

  async function fetchListing() {
    const { data, error } = await supabase.from('listings').select('*, profiles(full_name, org_name, phone)').eq('id', id).single()
    if (error || !data) { navigate('/browse'); return }
    setListing(data); setLoading(false)
  }

  async function checkExistingReservation() {
    const { data } = await supabase.from('reservations').select('*').eq('listing_id', id).eq('recipient_id', user.id).single()
    setReservation(data)
  }

  async function handleReserve() {
    if (!user) { navigate('/auth'); return }
    if (!pickupTime) return toast.error('Please select a pickup time')
    setReserving(true)
    const { error } = await supabase.from('reservations').insert({ listing_id: id, recipient_id: user.id, pickup_time: new Date(pickupTime).toISOString(), notes, status: 'pending' })
    if (error) { toast.error(error.message); setReserving(false); return }
    await supabase.from('listings').update({ status: 'reserved' }).eq('id', id)
    toast.success('Reserved! Provider will confirm shortly.')
    checkExistingReservation(); fetchListing(); setReserving(false)
  }

  async function handleMarkClaimed() {
    await supabase.from('listings').update({ status: 'claimed' }).eq('id', id)
    await supabase.from('reservations').update({ status: 'completed' }).eq('listing_id', id)
    toast.success('Marked as claimed!'); fetchListing()
  }

  function handleShare() {
    if (navigator.share) navigator.share({ title: listing.title, url: window.location.href })
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>

  const isProvider = user?.id === listing.provider_id
  const expiresAt = new Date(listing.expires_at)
  const STATUS_COLORS = { active:'bg-emerald-100 text-emerald-700', reserved:'bg-amber-100 text-amber-700', claimed:'bg-blue-100 text-blue-700', expired:'bg-gray-100 text-gray-500' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="rounded-xl overflow-hidden bg-gray-100 h-72 mb-2">
            {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">🍱</div>}
          </div>
          {listing.pickup_lat && listing.pickup_lng && (
            <div className="mt-4 h-48 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer center={[listing.pickup_lat, listing.pickup_lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[listing.pickup_lat, listing.pickup_lng]} />
              </MapContainer>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge ${STATUS_COLORS[listing.status]}`}>{listing.status}</span>
            <span className={`badge ${listing.offer_type === 'free' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {listing.offer_type === 'free' ? 'FREE' : listing.offer_type === 'discounted' ? `₹${listing.discounted_price}` : 'Exchange'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          {listing.description && <p className="text-gray-600 mb-4">{listing.description}</p>}
          <div className="space-y-2 text-sm mb-5">
            <div className="flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{listing.pickup_address}</div>
            <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-amber-500" />Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}</div>
            <div className="flex items-center gap-2 text-gray-600"><Tag className="w-4 h-4 text-blue-500" />{listing.quantity} {listing.quantity_unit} · {listing.food_type}</div>
            {listing.profiles && <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-purple-500" />{listing.profiles.org_name || listing.profiles.full_name}</div>}
          </div>
          {listing.allergens?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div><p className="text-sm font-medium text-amber-800">Contains allergens</p><p className="text-xs text-amber-700 mt-0.5">{listing.allergens.join(', ')}</p></div>
            </div>
          )}
          {isProvider ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">This is your listing.</p>
              {listing.status === 'reserved' && (
                <button onClick={handleMarkClaimed} className="btn-primary w-full flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Mark as Claimed</button>
              )}
            </div>
          ) : reservation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
              <p className="font-semibold text-green-800">You've reserved this!</p>
              <p className="text-sm text-green-600 mt-1">Status: {reservation.status}</p>
              {reservation.pickup_time && <p className="text-sm text-green-600">Pickup: {format(new Date(reservation.pickup_time), 'dd MMM, h:mm a')}</p>}
              {listing.profiles?.phone && <a href={`tel:${listing.profiles.phone}`} className="block mt-3 btn-primary text-center text-sm">Call Provider</a>}
            </div>
          ) : listing.status === 'active' ? (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Reserve This Food</h3>
              <div>
                <label className="label">Preferred Pickup Time *</label>
                <input type="datetime-local" className="input" value={pickupTime} min={new Date().toISOString().slice(0,16)} max={new Date(listing.expires_at).toISOString().slice(0,16)} onChange={e => setPickupTime(e.target.value)} />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input" rows={2} placeholder="Any requirements..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <button onClick={handleReserve} disabled={reserving} className="btn-primary w-full">{reserving ? 'Reserving...' : 'Reserve Now'}</button>
              {!user && <p className="text-xs text-center text-gray-500">Sign in to reserve food</p>}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">This listing is no longer available.</div>
          )}
          <button onClick={handleShare} className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Share Listing</button>
        </div>
      </div>
    </div>
  )
}