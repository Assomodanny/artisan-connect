import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Hammer, LogOut, Menu, X } from 'lucide-react'
import Button, { buttonClasses } from '../ui/Button'
import { cx } from '../../lib/classNames'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { getNavLinks } from '../../lib/navLinks'
import { getHomePathForRole } from '../../lib/routes'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cx(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100',
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications(user?.id ?? null)
  const navigate = useNavigate()
  const links = getNavLinks(user?.role ?? null)

  // The Demo Reviewer has no notifications yet, so no bell.
  const hasNotifications = user !== null && user.role !== 'reviewer'
  const notificationsPath = user?.role === 'customer' ? '/customer/notifications' : '/artisan/notifications'
  const bellLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'

  // Pressing Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <Hammer className="h-5 w-5" aria-hidden="true" />
          </span>
          Artisan Connect
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {hasNotifications && (
                <Link
                  to={notificationsPath}
                  aria-label={bellLabel}
                  className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-bold text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <span className="hidden text-sm text-slate-600 lg:inline">{user.name}</span>
              <Link to={getHomePathForRole(user.role)} className={buttonClasses('secondary', 'md')}>
                Dashboard
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'md')}>Log in</Link>
              <Link to="/register" className={buttonClasses('primary', 'md')}>Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700 md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMenu} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
              {hasNotifications && (
                <NavLink to={notificationsPath} onClick={closeMenu} className={navLinkClass}>
                  Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}
                </NavLink>
              )}
              <div className="mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <p className="px-1 text-sm text-slate-600">Signed in as {user.name}</p>
                    <Link
                      to={getHomePathForRole(user.role)}
                      onClick={closeMenu}
                      className={buttonClasses('secondary', 'md')}
                    >
                      Dashboard
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className={buttonClasses('secondary', 'md')}>Log in</Link>
                    <Link to="/register" onClick={closeMenu} className={buttonClasses('primary', 'md')}>Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}