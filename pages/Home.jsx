import { Link } from 'react-router-dom'
import { Leaf, MapPin, Heart, ArrowRight, Users, Store, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Home() {
  const [recentListings, setRecentListings] = useState([])

  useEffect(() => {
    supabase.from('listings').select('*, profiles(full_name, org_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(6).then(({ data }) => setRecentListings(data || []))
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Surplus Food, <span className="text-green-600">Not Wasted</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect restaurants, stores, and households with nearby people and NGOs — before food expires.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
              Browse Food Near Me <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/create" className="btn-secondary text-lg px-8 py-3">
              List Surplus Food
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How FoodShare Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Store className="w-8 h-8 text-green-600" />, title: 'Providers List Food', desc: 'Restaurants, stores, caterers post surplus with quantity, type, freshness window, and pickup location.' },
            { icon: <MapPin className="w-8 h-8 text-green-600" />, title: 'Nearby Users Discover', desc: 'Browse a real-time map of available food near you. Filter by type, distance, and offer type.' },
            { icon: <Heart className="w-8 h-8 text-green-600" />, title: 'Reserve & Pickup', desc: 'Claim food with one tap, coordinate pickup time, and rate the experience.' }
          ].map((step, i) => (
            <div key={i} className="card p-6 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-600 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center text-white">
          {[
            { icon: <Utensils className="w-8 h-8 mx-auto mb-2 opacity-80" />, value: '2.4M+', label: 'Meals Saved' },
            { icon: <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />, value: '12K+', label: 'Active Users' },
            { icon: <Store className="w-8 h-8 mx-auto mb-2 opacity-80" />, value: '850+', label: 'Providers' }
          ].map((s, i) => (
            <div key={i}>{s.icon}<div className="text-3xl font-bold">{s.value}</div><div className="opacity-80">{s.label}</div></div>
          ))}
        </div>
      </section>

      {recentListings.length > 0 && (
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Available Now</h2>
            <Link to="/browse" className="text-green-600 font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </section>
      )}
    </div>
  )
}