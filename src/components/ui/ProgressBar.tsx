interface ProgressBarProps {
  value: number
  label?: string
}

export default function ProgressBar({ value, label = 'Work progress' }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full bg-brand-700" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}