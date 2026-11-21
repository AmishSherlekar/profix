import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <Wrench className="h-5 w-5" />
              ProFix
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connecting you with trusted local plumbers and electricians in your area.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/services" className="hover:text-foreground transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Join as Pro</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-not-allowed">Privacy Policy</span></li>
              <li><span className="cursor-not-allowed">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ProFix. All rights reserved. Built with React + Supabase.
        </div>
      </div>
    </footer>
  )
}
