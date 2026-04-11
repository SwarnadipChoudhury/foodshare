import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PlusCircle, Trash2, CheckCircle, Clock, Package, Users } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [myListings, setMyListings] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [tab, setTab] = useState('listings')
  const [stats, setStats] = useState({ active: 0, claimed: 0, reserved: 0 })

  useEffect(() => { if (user) { fetchMyListings(); fetchMyReservations() } }, [user])

  async function fetchMyListings() {
    const { data } = await supabase.from('listings').select('*').eq('provider_id', user.id).order('created_at', { ascending: false })
    const d = data || []
    setMyListings(d)
    setStats({ active: d.filter(l => l.status==='active').length, reserved: d.filter(l => l.status==='reserved').length, claimed: d.filter(l => l.status==='claimed').length })
  }

  async function fetchMyReservations() {
    const { data } = await supabase.from('reservations').select('*, listings(title, pickup_address, expires_at, status, offer_type, discounted_price)').eq('recipient_id', user.id).order('created_at', { ascending: false })
    setMyReservations(data || [])
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    toast.success('Listing deleted'); fetchMyListings()
  }

  const STATUS_COLORS = { active:'bg-emerald-100 text-emerald-700', reserved:'bg-amber-100 text-amber-700', claimed:'bg-blue-100 text-blue-700', expired:'bg-gray-100 text-gray-500' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {profile?.full_name}!</p>
        </div>
        <Link to="/create" className="btn-primary flex items-center gap-2"><PlusCircle className="w-4 h-4" /> New Listing</Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Active', value:stats.active, icon:<Package className="w-5 h-5"/>, color:'text-emerald-600 bg-emerald-50' },
          { label:'Reserved', value:stats.reserved, icon:<Clock className="w-5 h-5"/>, color:'text-amber-600 bg-amber-50' },
          { label:'Claimed', value:stats.claimed, icon:<CheckCircle className="w-5 h-5"/>, color:'text-blue-600 bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
            <div><div className="text-2xl font-bold text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
          </div>
        ))}
      </div>
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {[['listings','My Listings'],['reservations','My Reservations']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>{label}</button>
        ))}
      </div>
      {tab === 'listings' ? (
        myListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No listings yet</p>
            <Link to="/create" className="text-green-600 text-sm mt-2 inline-block hover:underline">Create your first listing →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map(l => (
              <div key={l.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/listing/${l.id}`} className="font-semibold text-gray-900 hover:text-green-600 truncate">{l.title}</Link>
                    <span className={`badge ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">{l.quantity} {l.quantity_unit} · Expires {format(new Date(l.expires_at), 'dd MMM, h:mm a')}</p>
                </div>
                <button onClick={() => deleteListing(l.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )
      ) : (
        myReservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No reservations yet</p>
            <Link to="/browse" className="text-green-600 text-sm mt-2 inline-block hover:underline">Browse available food →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myReservations.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/listing/${r.listing_id}`} className="font-semibold text-gray-900 hover:text-green-600">{r.listings?.title}</Link>
                  <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-500">{r.listings?.pickup_address}</p>
                {r.pickup_time && <p className="text-sm text-green-600 mt-1">Pickup: {format(new Date(r.pickup_time), 'dd MMM, h:mm a')}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}