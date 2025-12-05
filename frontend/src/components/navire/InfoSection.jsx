export default function InfoSection({ title, icon, items }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <h3 className="text-md font-semibold text-slate-900 mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{item.label}</span>
            <span className="font-semibold text-slate-900 text-sm">{item.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}