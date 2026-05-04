import { useState, useEffect } from 'react';
import { calculateMedian } from '../../utils/calculations';

interface TripleInputProps {
  label: string;
  unit: string;
  value?: number | null;
  onChange: (median: number | null) => void;
  step?: string;
}

export default function TripleInput({ label, unit, value, onChange, step = '0.1' }: TripleInputProps) {
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');

  useEffect(() => {
    if (value != null && v1 === '' && v2 === '' && v3 === '') {
      setV1(String(value));
    }
  }, [value]);

  useEffect(() => {
    const median = calculateMedian([v1, v2, v3].filter(Boolean));
    onChange(median);
  }, [v1, v2, v3]);

  const median = calculateMedian([v1, v2, v3].filter(Boolean));

  const inputClass = 'w-14 sm:w-16 md:w-20 border border-gray-300 rounded px-1 sm:px-1.5 md:px-2 py-1 text-xs sm:text-sm text-center focus:ring-2 focus:ring-blue-400 focus:outline-none';

  return (
    <div className="py-1.5 border-b border-gray-100 last:border-0">
      {/* Label on top for mobile */}
      <span className="block md:hidden text-xs text-gray-600 mb-1">{label}</span>
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        {/* Label inline for desktop */}
        <span className="hidden md:block text-sm text-gray-700 w-44 flex-shrink-0">{label}</span>
        <input type="number" step={step} min="0" value={v1} onChange={(e) => setV1(e.target.value)} className={inputClass} placeholder="1" />
        <input type="number" step={step} min="0" value={v2} onChange={(e) => setV2(e.target.value)} className={inputClass} placeholder="2" />
        <input type="number" step={step} min="0" value={v3} onChange={(e) => setV3(e.target.value)} className={inputClass} placeholder="3" />
        <div className="flex items-center gap-1 ml-0.5 md:ml-2">
          <span className="hidden md:inline text-xs text-gray-400">Mediana:</span>
          <span className={`text-xs md:text-sm font-semibold w-16 text-right ${median != null ? 'text-blue-700' : 'text-gray-400'}`}>
            {median != null ? `${median.toFixed(1)} ${unit}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
