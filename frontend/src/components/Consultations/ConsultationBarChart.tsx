import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { Consultation, Patient } from '../../types';
import { calculate } from '../../utils/calculations';

interface Props {
  consultation: Consultation;
  patient: Patient;
}

export default function ConsultationBarChart({ consultation, patient }: Props) {
  const calc = calculate(consultation, patient.sex, patient.birthDate);

  const chartData = [
    { name: 'Peso', value: consultation.weight ?? null, unit: 'kg', fill: '#2563eb' },
    { name: 'IMC', value: calc.imc ?? null, unit: 'kg/m²', fill: '#ea580c' },
    { name: 'Σ Pliegues', value: calc.sumFolds ?? null, unit: 'mm', fill: '#7c3aed' },
    { name: '% Grasa', value: calc.fatPct ?? null, unit: '%', fill: '#dc2626' },
  ].filter((d): d is { name: string; value: number; unit: string; fill: string } => d.value != null);

  if (chartData.length === 0) return null;

  return (
    <div data-bar-chart={consultation.id} className="px-5 pb-5 border-t border-gray-100 pt-4">
      <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Resumen visual de la consulta</p>
      <ResponsiveContainer width="100%" height={175}>
        <BarChart data={chartData} margin={{ top: 20, right: 16, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            formatter={(value: number, _name, props) => [
              `${value.toFixed(1)} ${props.payload?.unit ?? ''}`,
              props.payload?.name ?? '',
            ]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 10, fontWeight: 700 }}
              formatter={(v: number) => v.toFixed(1)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
