import { Link, useNavigate } from 'react-router-dom'
import { Wrench, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function getDashboardPath() {
    if (role === 'admin') return '/admin'
    if (role === 'professional') return '/pro'
    return '/customer'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Wrench className="h-6 w-6" />
          ProFix
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">Services</Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {profile ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={getDashboardPath()}>
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${getDashboardPath()}/profile`}>
                  <User className="h-4 w-4 mr-1" />
                  {profile.full_name.split(' ')[0]}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-2">
          <Link to="/" className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/services" className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>Services</Link>
          <Link to="/about" className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>About</Link>
          {profile ? (
            <>
              <Link to={getDashboardPath()} className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="block py-2 text-sm text-destructive">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link to="/register" className="block py-2 text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
