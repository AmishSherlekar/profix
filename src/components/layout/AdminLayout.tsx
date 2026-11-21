import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Tag, MessageSquare, LogOut, Wrench, Menu
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Verification', href: '/admin/verification', icon: ShieldCheck },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? location.pathname === href : location.pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Wrench className="h-5 w-5" />
          ProFix
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin Console</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-sm font-medium mb-1 truncate">{profile?.full_name}</div>
        <div className="text-xs text-muted-foreground mb-3">Administrator</div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-background fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-background border-r border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-primary">ProFix Admin</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
