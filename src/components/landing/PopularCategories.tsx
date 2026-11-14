import { Link } from 'react-router'
import { SERVICE_CATEGORIES } from '../../types'
import { CATEGORY_META } from '../../data/categories'
import Card from '../ui/Card'

export default function PopularCategories() {
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="categories-heading" className="text-center text-3xl font-bold text-slate-900">
        Popular services
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
        Pick a category to see artisans who do that work.
      </p>

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {SERVICE_CATEGORIES.map((name) => {
          const { icon: Icon, blurb } = CATEGORY_META[name]
          const search = new URLSearchParams({ category: name }).toString()
          return (
            <li key={name}>
              <Link
                to={`/artisans?${search}`}
                className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <Card interactive className="h-full">
                  <Icon className="h-8 w-8 text-brand-700" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-900">{name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{blurb}</p>
                </Card>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}