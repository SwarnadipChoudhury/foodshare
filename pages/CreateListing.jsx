import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Upload, X, MapPin } from 'lucide-react'

const FOOD_TYPES = ['cooked', 'raw', 'bakery', 'dairy', 'produce', 'other']
const ALLERGENS = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish', 'Wheat']

export default function CreateListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', food_type: 'cooked', quantity: '', quantity_unit: 'servings',
    offer_type: 'free', original_price: '', discounted_price: '', pickup_address: '',
    pickup_lat: '', pickup_lng: '', freshness_window_hours: 24, allergens: []
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  function toggleAllergen(a) { set('allergens', form.allergens.includes(a) ? form.allergens.filter(x => x !== a) : [...form.allergens, a]) }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingImages(true)
    const urls = []
    for (const file of files.slice(0, 3)) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('food-images').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setImages(prev => [...prev, ...urls].slice(0, 3))
    setUploadingImages(false)
  }

  async function getCoordinates() {
    if (!form.pickup_address) return toast.error('Enter pickup address first')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.pickup_address)}&limit=1`)
      const data = await res.json()
      if (data[0]) { set('pickup_lat', parseFloat(data[0].lat)); set('pickup_lng', parseFloat(data[0].lon)); toast.success('Location found!') }
      else toast.error('Address not found')
    } catch { toast.error('Failed to find location') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.pickup_lat) return toast.error('Please verify your pickup location')
    setLoading(true)
    const expiresAt = new Date(Date.now() + form.freshness_window_hours * 60 * 60 * 1000)
    const { data, error } = await supabase.from('listings').insert({
      provider_id: user.id, title: form.title, description: form.description,
      food_type: form.food_type, quantity: form.quantity, quantity_unit: form.quantity_unit,
      offer_type: form.offer_type,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
      pickup_address: form.pickup_address, pickup_lat: parseFloat(form.pickup_lat),
      pickup_lng: parseFloat(form.pickup_lng),
      pickup_location: `POINT(${form.pickup_lng} ${form.pickup_lat})`,
      freshness_window_hours: parseInt(form.freshness_window_hours),
      expires_at: expiresAt.toISOString(), images, allergens: form.allergens, status: 'active'
    }).select().single()
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Listing created!')
    navigate(`/listing/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">List Surplus Food</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Photos (Optional)</h2>
          <div className="flex gap-3 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">{uploadingImages ? 'Uploading...' : 'Add Photo'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
              </label>
            )}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Food Details</h2>
          <div>
            <label className="label">Title *</label>
            <input required className="input" placeholder="e.g., Leftover Biryani - 20 portions" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Ingredients, how it was cooked..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Food Type *</label>
              <select required className="input" value={form.food_type} onChange={e => set('food_type', e.target.value)}>
                {FOOD_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <div className="flex gap-2">
                <input required type="number" min="1" className="input flex-1" placeholder="10" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                <select className="input w-28" value={form.quantity_unit} onChange={e => set('quantity_unit', e.target.value)}>
                  {['servings','kg','liters','boxes','plates','items'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Freshness Window *</label>
            <select required className="input" value={form.freshness_window_hours} onChange={e => set('freshness_window_hours', e.target.value)}>
              {[2,4,6,12,24,48,72].map(h => <option key={h} value={h}>Available for {h} hour{h>1?'s':''}</option>)}
            </select>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Offer Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {[{value:'free',label:'Free Donation'},{value:'discounted',label:'Discounted'},{value:'exchange',label:'Exchange'}].map(o => (
              <button key={o.value} type="button" onClick={() => set('offer_type', o.value)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${form.offer_type === o.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                {o.label}
              </button>
            ))}
          </div>
          {form.offer_type === 'discounted' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Original Price (₹)</label><input type="number" className="input" value={form.original_price} onChange={e => set('original_price', e.target.value)} /></div>
              <div><label className="label">Discounted Price (₹) *</label><input required type="number" className="input" value={form.discounted_price} onChange={e => set('discounted_price', e.target.value)} /></div>
            </div>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Pickup Location *</h2>
          <div>
            <label className="label">Address</label>
            <div className="flex gap-2">
              <input required className="input flex-1" placeholder="Full address with city" value={form.pickup_address} onChange={e => set('pickup_address', e.target.value)} />
              <button type="button" onClick={getCoordinates} className="btn-secondary flex items-center gap-1 whitespace-nowrap">
                <MapPin className="w-4 h-4" /> Verify
              </button>
            </div>
            {form.pickup_lat && <p className="text-xs text-green-600 mt-1.5">✓ Location verified</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Allergens (if any)</h2>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map(a => (
              <button key={a} type="button" onClick={() => toggleAllergen(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.allergens.includes(a) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  )
}