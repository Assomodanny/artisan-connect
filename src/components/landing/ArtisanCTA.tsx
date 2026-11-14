import { Link } from 'react-router'
import { buttonClasses } from '../ui/Button'

export default function ArtisanCTA() {
  return (
    <section aria-labelledby="cta-heading" className="bg-brand-800">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 id="cta-heading" className="text-3xl font-bold text-white">
          Are you a skilled artisan?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-100">
          Create a professional profile, browse open jobs, and send quotations to customers.
        </p>
        <Link to="/register?role=artisan" className={buttonClasses('secondary', 'lg', 'mt-8')}>
          Join as an artisan
        </Link>
      </div>
    </section>
  )
}