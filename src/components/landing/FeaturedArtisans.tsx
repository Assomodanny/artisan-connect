import { useState } from 'react'
import { Link } from 'react-router'
import { getFeaturedArtisans } from '../../services/artisanService'
import ArtisanCard from '../artisans/ArtisanCard'
import { buttonClasses } from '../ui/Button'

export default function FeaturedArtisans() {
  // Read once when the section first appears.
  const [artisans] = useState(() => getFeaturedArtisans(3))

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="featured-heading" className="text-center text-3xl font-bold text-slate-900">
        Featured artisans
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
        Artisans on the platform, ranked by rating.
      </p>

      {artisans.length === 0 ? (
        <p className="mt-10 rounded-xl bg-white p-8 text-center text-slate-600 shadow-soft">
          No artisans to show yet. Artisans appear here once they create a profile.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {artisans.map((artisan) => (
            <li key={artisan.user.id}>
              <ArtisanCard artisan={artisan} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        <Link to="/artisans" className={buttonClasses('secondary', 'md')}>
          View all artisans
        </Link>
      </div>
    </section>
  )
}