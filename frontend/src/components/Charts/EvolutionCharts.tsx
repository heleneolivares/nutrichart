import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Consultation, Patient } from '../../types';
import { calculate } from '../../utils/calculations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  consultations: Consultation[];
  patient: Patient;
}

export default function EvolutionCharts({ consultations, patient }: Props) {
  const data = useMemo(() => {
    return [...consultations]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((c) => {
        const calc = calculate(c, patient.sex, patient.birthDate);
        return {
          date: format(new Date(c.date), 'dd/MM/yy', { locale: es }),
          peso: c.weight ?? null,
          grasa: calc.fatPct ?? null,
          pliegues: calc.sumFolds ?? null,
          musculo: calc.kgMuscleLee ?? null,
          imc: calc.imc ?? null,
        };
      });
  }, [consultations, patient]);

  if (data.length < 2) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📈</p>
        <p className="text-lg font-medium">Mínimo 2 consultas para ver gráficos</p>
      </div>
    );
  }

  const chartConfig = [
    { key: 'peso', label: 'Peso (kg)', color: '#2563eb', unit: 'kg' },
    { key: 'grasa', label: '% Grasa', color: '#dc2626', unit: '%' },
    { key: 'pliegues', label: 'Σ 8 Pliegues (mm)', color: '#7c3aed', unit: 'mm' },
    { key: 'musculo', label: 'Kg Músculo Lee (kg)', color: '#16a34a', unit: 'kg' },
    { key: 'imc', label: 'IMC (kg/m²)', color: '#ea580c', unit: '' },
  ];

  return (
    <div className="space-y-8">
      {chartConfig.map(({ key, label, color, unit }) => {
        const hasData = data.some((d) => (d as any)[key] != null);
        if (!hasData) return null;
        return (
          <div key={key} data-chart={key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}${unit}`} />
                <Tooltip formatter={(v: any) => [`${v}${unit}`, label]} />
                <Line
                  type="monotone" dataKey={key} stroke={color} strokeWidth={2}
                  dot={{ fill: color, r: 4 }} activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
