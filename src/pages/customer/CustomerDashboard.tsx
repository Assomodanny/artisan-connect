import { Link } from 'react-router'
import DashboardPlaceholder from '../../components/dashboard/DashboardPlaceholder'
import { buttonClasses } from '../../components/ui/Button'

export default function CustomerDashboard() {
  return (
       <DashboardPlaceholder roleLabel="Customer" upcoming={[]}>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/customer/jobs/new" className={buttonClasses('primary', 'md')}>
          Post a job
        </Link>
        <Link to="/customer/jobs" className={buttonClasses('secondary', 'md')}>
          My jobs
        </Link>
        <Link to="/customer/notifications" className={buttonClasses('secondary', 'md')}>
          Notifications
        </Link>
        <Link to="/customer/profile" className={buttonClasses('secondary', 'md')}>
          Profile
        </Link>
      </div>
    </DashboardPlaceholder>
  )
}