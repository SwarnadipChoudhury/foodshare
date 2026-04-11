import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState('both')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) toast.error(error.message)
      else { toast.success('Welcome back!'); navigate('/dashboard') }
    } else {
      if (password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName, userType)
      if (error) toast.error(error.message)
      else { toast.success('Account created! Please verify your email.'); setMode('signin') }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-green-600">
            <Leaf className="w-7 h-7" /> FoodShare
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-4">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <input required className="input" placeholder="Your name" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="label">I am a *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'provider', label: 'Provider', sub: 'Restaurant/Store' },
                      { value: 'recipient', label: 'Recipient', sub: 'NGO/Individual' },
                      { value: 'both', label: 'Both', sub: 'Provider+Recipient' },
                    ].map(o => (
                      <button key={o.value} type="button" onClick={() => setUserType(o.value)}
                        className={`p-2.5 rounded-lg border-2 text-xs font-medium text-left transition-all ${userType === o.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                        <div className="font-semibold">{o.label}</div>
                        <div className="opacity-70 mt-0.5">{o.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label">Email *</label>
              <input required type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input required type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            {mode === 'signin' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-green-600 font-medium hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('signin')} className="text-green-600 font-medium hover:underline">Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}