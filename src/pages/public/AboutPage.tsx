import { Wrench, Shield, Users, Star, Heart } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">About ProFix</h1>
        <p className="text-lg text-muted-foreground">
          A trustworthy platform connecting customers with skilled local plumbers and electricians.
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ProFix was built to solve a common problem: finding a reliable local tradesperson is hard.
            We created a simple, transparent marketplace where customers can discover verified professionals
            nearby, compare their profiles, and request services — all in one place, with no call centres or middlemen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Verified Professionals
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every professional on ProFix submits their certificates and credentials, which are manually
            reviewed by our admin team before they receive a verified badge. We take safety seriously.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Honest Reviews
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Reviews can only be submitted after a job is officially completed and confirmed by both
            the customer and professional. This prevents fake reviews and ensures authenticity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> For Professionals
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ProFix helps skilled tradespeople grow their business by connecting them with real customers
            in their area. Create a profile, list your services, set your availability, and start
            receiving requests directly — no commission on individual jobs during the prototype phase.
          </p>
        </section>
      </div>
    </div>
  )
}
