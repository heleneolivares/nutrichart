import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Consultation, Patient } from '../../types';
import { calculate } from '../../utils/calculations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  consultations: Consultation[];
  patient: Patient;
}

export default function HistoricalBarChart({ consultations, patient }: Props) {
  const data = [...consultations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => {
      const calc = calculate(c, patient.sex, patient.birthDate);
      return {
        date: format(new Date(c.date), 'dd/MM/yy', { locale: es }),
        'Peso (kg)': c.weight != null ? +c.weight.toFixed(1) : null,
        'IMC': calc.imc,
        'Σ Pliegues (mm)': calc.sumFolds,
        '% Grasa': calc.fatPct,
      };
    });

  if (data.length === 0) return null;

  return (
    <div data-historical-bar className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Comparativa por Consulta</h3>
      <p className="text-xs text-gray-400 mb-4">Peso (kg) · IMC · Σ Pliegues (mm) · % Grasa</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Peso (kg)" fill="#2563eb" maxBarSize={28} radius={[3, 3, 0, 0]} />
          <Bar dataKey="IMC" fill="#ea580c" maxBarSize={28} radius={[3, 3, 0, 0]} />
          <Bar dataKey="Σ Pliegues (mm)" fill="#7c3aed" maxBarSize={28} radius={[3, 3, 0, 0]} />
          <Bar dataKey="% Grasa" fill="#dc2626" maxBarSize={28} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
