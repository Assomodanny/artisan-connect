import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'

const EXACT_TITLES: Record<string, string> = {
  '/': 'Home',
  '/login': 'Log in',
  '/register': 'Sign up',
  '/how-it-works': 'How it works',
  '/artisans': 'Find artisans',
  '/customer/dashboard': 'Customer dashboard',
  '/customer/notifications': 'Notifications',
  '/customer/profile': 'My profile',
  '/customer/jobs': 'My jobs',
  '/customer/jobs/new': 'Post a job',
  '/artisan/dashboard': 'Artisan dashboard',
  '/artisan/notifications': 'Notifications',
  '/artisan/profile': 'My profile',
  '/artisan/jobs': 'Available jobs',
  '/artisan/applications': 'My applications',
  '/artisan/active': 'Active jobs',
  '/artisan/earnings': 'Earnings',
  '/artisan/reviews': 'My reviews',
  '/reviewer/dashboard': 'Case review',
}

function getPageTitle(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  const exact = EXACT_TITLES[path]
  if (exact) return exact
  if (/^\/customer\/jobs\/[^/]+\/pay$/.test(path)) return 'Payment'
  if (/^\/(customer|artisan)\/jobs\/[^/]+$/.test(path)) return 'Job details'
  if (/^\/artisans\/[^/]+$/.test(path)) return 'Artisan profile'
  return 'Page not found'
}

// Wraps every page: skip link, navbar, the page itself, footer.
export default function AppShell() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef<string | null>(null)

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} | Artisan Connect`

    // After moving to a different page (not on the first load), start at the top of the page
    // content, so keyboard and screen-reader users know the page changed.
    if (previousPath.current !== null && previousPath.current !== pathname) {
      window.scrollTo(0, 0)
      mainRef.current?.focus({ preventScroll: true })
    }
    previousPath.current = pathname
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-800 focus:shadow-lift"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}