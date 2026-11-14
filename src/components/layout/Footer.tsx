import { Link } from 'react-router'
import { Hammer, Mail, MapPin, Phone } from 'lucide-react'

const FOOTER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/artisans', label: 'Find artisans' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/login', label: 'Log in' },
  { to: '/register', label: 'Sign up' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-accent-300">
              <Hammer className="h-5 w-5" aria-hidden="true" />
            </span>
            Artisan Connect
          </p>
          <p className="mt-3 text-sm">
            A demonstration marketplace that connects customers with skilled artisans.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-white hover:underline">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Contact (ADEMOLA)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" /> healerth27@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden="true" /> 08052623543</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" /> Ibadan, Nigeria</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-brand-200">
        © {new Date().getFullYear()} Artisan Connect. Front-end demonstration project. All payments are simulated and no real money moves.
      </div>
    </footer>
  )
}