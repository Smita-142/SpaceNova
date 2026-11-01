export default function StatusBadge({ status }) {
  const configs = {
    pending:    { cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30',  label: 'Pending' },
    processing: { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Processing' },
    completed:  { cls: 'bg-green-500/20 text-green-400 border-green-500/30',  label: 'Completed' },
    failed:     { cls: 'bg-red-500/20 text-red-400 border-red-500/30',        label: 'Failed' },
    no_colmap:  { cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'COLMAP Required' },
  }
  const cfg = configs[status] || configs.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

