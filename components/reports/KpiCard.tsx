interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accentClass: string; // e.g. "border-blue-500"
}

export default function KpiCard({ label, value, sub, accentClass }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-4 ${accentClass}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
