import { Link } from 'react-router-dom'
import { Search, ShieldCheck, Star, Zap, Wrench, ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function useCategories() {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

const steps = [
  { icon: Search, title: 'Search & Discover', desc: 'Browse verified plumbers and electricians in your area filtered by service and rating.' },
  { icon: ShieldCheck, title: 'Compare Profiles', desc: 'View experience, certifications, reviews, and availability before making your choice.' },
  { icon: Zap, title: 'Send a Request', desc: 'Pick the professional you want and send them a service request directly — no middleman.' },
  { icon: Star, title: 'Review & Rate', desc: 'After the job, confirm completion and leave an honest review to help the community.' },
]

export function LandingPage() {
  const { data: categories } = useCategories()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <ShieldCheck className="h-4 w-4" />
            Verified professionals only
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
            Find trusted local{' '}
            <span className="text-primary">plumbers</span> &{' '}
            <span className="text-primary">electricians</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            ProFix connects you with verified, rated professionals in your neighbourhood.
            No call centres. No guesswork. Just reliable local service.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                Get started free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">Explore services</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-500" /> Admin-verified pros</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-500" /> Honest reviews</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> Local first</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Our Services</h2>
            <p className="text-muted-foreground">What do you need help with today?</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/customer/find?category=${cat.id}`}
                className="flex flex-col items-center p-6 rounded-xl border border-border bg-card hover:border-primary hover:shadow-sm transition-all group"
              >
                <div className="text-3xl mb-3">{cat.icon ?? '🔧'}</div>
                <span className="font-medium text-sm text-center group-hover:text-primary transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">How ProFix Works</h2>
            <p className="text-muted-foreground">Get the right professional for the job in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground/30">0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to find your professional?</h2>
          <p className="text-muted-foreground mb-8">
            Join ProFix as a customer to find help, or as a professional to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/register?role=customer">I need a professional</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register?role=professional">I am a professional</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
