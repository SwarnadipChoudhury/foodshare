import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    org_name: profile?.org_name || '',
    user_type: profile?.user_type || 'both',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) toast.error(error.message)
    else { toast.success('Profile updated!'); fetchProfile(user.id) }
    setSaving(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-green-600">{profile?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
          <div><label className="label">Phone Number</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="label">Organization Name (optional)</label><input className="input" placeholder="Restaurant / NGO name" value={form.org_name} onChange={e => set('org_name', e.target.value)} /></div>
          <div>
            <label className="label">I am a</label>
            <select className="input" value={form.user_type} onChange={e => set('user_type', e.target.value)}>
              <option value="provider">Provider (Restaurant / Store)</option>
              <option value="recipient">Recipient (NGO / Individual)</option>
              <option value="both">Both</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  )
}