import { X, Building } from 'lucide-react';

function MetricMini({ icon, label, value, color }:{icon:string;label:string;value:any;color:string}) {
  return (
    <div className="relative p-3 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col items-center justify-center shadow">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-10`} />
      <span className="material-icons text-[18px] text-gray-700 mb-1">{icon}</span>
      <p className="text-xs font-medium text-gray-500 tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* NEW: MiniStatMobile helper (mobile only) */
function MiniStatMobile({ label, value }:{label:string; value:any}) {
  return (
    <div className="p-2 rounded-lg bg-white/60 border border-white/30 flex flex-col items-center">
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

/* UPDATED: Modal for PC optimization */
function Modal({ children, onClose, title, icon }:{children:React.ReactNode;onClose:()=>void;title:string;icon:string}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] xl:max-w-6xl max-w-none sm:max-w-lg overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8 xl:p-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {icon==='edit'?'Update estate information':'Add a new managed estate to the portfolio.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/60 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, required, placeholder, className='' }:{label:string;value:string;onChange:(v:string)=>void;required?:boolean;placeholder?:string;className?:string}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        required={required}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, className='' }:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;className?:string}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
      />
    </div>
  );
}

function Button({ children, type='button', variant='primary', icon, loading, onClick }:{children:React.ReactNode;type?:'button'|'submit';variant?:'primary'|'secondary';icon?:string;loading?:boolean;onClick?:()=>void}) {
  const base = 'px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow';
  const styles = variant==='primary' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-white/60 backdrop-blur border border-white/30 text-gray-700 hover:bg-white/80';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`${base} ${styles} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {loading && <span className="material-icons text-sm animate-spin">progress_activity</span>}
      {icon && !loading && <span className="material-icons text-sm">{icon}</span>}
      {children}
    </button>
  );
}
function Th({ children }:{children?:React.ReactNode}) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }:{children:React.ReactNode}) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

// Add helper component near the UI atoms (inserted into the same file)
function ApartmentPreview({ apt }:{apt:any}) {
  const rooms = Math.max(1, Number(apt.number_of_rooms) || 1);
  const color = apt.color || '#60a5fa';
  const rent = apt.rent_amount ? String(apt.rent_amount) : '—';
  const imgUrl = (
    apt.image_url ||
    apt.image ||
    '/bg-2.jpg'
  );
  const roomRects = Array.from({ length: rooms }).map((_, i) => {
    // arrange rectangles in a simple grid
    const cols = rooms > 3 ? 3 : rooms;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const w = 28 / cols;
    const h = 28 / Math.ceil(rooms / cols);
    const x = 4 + col * (w + 2);
    const y = 6 + row * (h + 2);
    return { x, y, w, h };
  });

  return (
    <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 group relative">
      <div className="w-full h-full relative">
        {imgUrl ? (
          <img src={imgUrl} alt={apt.number || 'Apartment'} className="w-full h-full object-cover block" />
        ) : (
          <svg viewBox="0 0 36 24" className="w-full h-full block">
            <defs>
              <linearGradient id={`g-${apt.id}`} x1="0" x2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.18" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="34" height="22" rx="2" fill={`url(#g-${apt.id})`} stroke="rgba(0,0,0,0.04)" />
            {roomRects.map((r, idx) => (
              <rect
                key={idx}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx="0.6"
                fill={idx % 2 === 0 ? color : '#ffffff'}
                fillOpacity={idx % 2 === 0 ? 0.12 : 0.06}
                stroke="rgba(0,0,0,0.03)"
              />
            ))}
            <text x="4" y="18" fontSize="2.2" fill="#374151" opacity="0.8">{apt.number || 'Unit'}</text>
          </svg>
        )}

        {/* hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-[11px] text-white">
          <div className="text-center leading-tight">
            <div className="font-semibold text-sm">{apt.number || 'Unit'}</div>
            <div className="text-[11px] opacity-90">{apt.size ? `${apt.size}m²` : ''} {apt.number_of_rooms ? `• ${apt.number_of_rooms}r` : ''}</div>
            {apt.description && <div className="mt-1 text-[10px] opacity-90 line-clamp-2">{apt.description}</div>}
          </div>
        </div>

        {/* rent badge */}
        <div className="absolute bottom-1 left-1">
          <div className="px-2 py-0.5 bg-white/90 text-xs rounded text-gray-800 font-semibold">
            {rent}
          </div>
        </div>
      </div>
    </div>
  );
}

// Thumbnail preview for estates: uses `estate.image_url` if present, else fallback avatar
function EstatePreview({ estate }:{estate:any}) {
  const url = estate.image_url || estate.image || '/bg-1.jpg';
  const initials = String(estate.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s:string)=>s[0]?.toUpperCase())
    .join('');
  return (
    <div className="w-24 h-16 rounded-xl overflow-hidden bg-white/60 border border-white/30 flex items-center justify-center">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={estate.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-semibold">
          {initials || 'ES'}
        </div>
      )}
    </div>
  );
}


export { MetricMini, MiniStatMobile, Modal, Input, Textarea, Button, Th, Td, ApartmentPreview, EstatePreview };