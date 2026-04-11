import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, PlusCircle, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-green-600">
          <Leaf className="w-6 h-6" />
          FoodShare
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/browse" className="text-gray-600 hover:text-gray-900 font-medium">Browse Food</Link>
          {user ? (
            <>
              <Link to="/create" className="btn-primary flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> List Food
              </Link>
              <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary">Sign In</Link>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <Link to="/browse" onClick={() => setOpen(false)} className="text-gray-700 font-medium">Browse Food</Link>
          {user ? (
            <>
              <Link to="/create" onClick={() => setOpen(false)} className="text-gray-700 font-medium">+ List Food</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-gray-700 font-medium">Dashboard</Link>
              <button onClick={() => { handleSignOut(); setOpen(false) }} className="text-left text-red-500 font-medium">Sign Out</button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="text-green-600 font-medium">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}