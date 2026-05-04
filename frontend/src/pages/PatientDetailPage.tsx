import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Patient, Consultation, PatientStats } from '../types';
import { calculate, getAgeDecimal } from '../utils/calculations';
import { exportToPDF, exportToExcel } from '../utils/export';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EvolutionCharts from '../components/Charts/EvolutionCharts';
import HistoricalBarChart from '../components/Charts/HistoricalBarChart';
import ConsultationBarChart from '../components/Consultations/ConsultationBarChart';

type Tab = 'consultas' | 'graficos' | 'estadisticas';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('consultas');
  const [exportLoading, setExportLoading] = useState(false);
  const [historyExportOpen, setHistoryExportOpen] = useState(false);
  const [openExportId, setOpenExportId] = useState<number | null>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const histBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/patients/${id}/stats`),
        ]);
        setPatient(pRes.data);
        setConsultations(pRes.data.consultations ?? []);
        setStats(sRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDeleteConsultation = async (cid: number) => {
    if (!confirm('¿Eliminar esta consulta?')) return;
    await api.delete(`/patients/${id}/consultations/${cid}`);
    setConsultations((prev) => prev.filter((c) => c.id !== cid));
  };

  const handleExportPDF = async (consultId?: number) => {
    if (!patient) return;
    setExportLoading(true);
    const list = consultId ? consultations.filter((c) => c.id === consultId) : consultations;
    if (consultId) {
      const barChartEl = document.querySelector<HTMLElement>(`[data-bar-chart="${consultId}"]`);
      await exportToPDF(patient, list, { barChartEl });
    } else {
      await exportToPDF(patient, list, {
        lineChartEl: consultations.length >= 2 ? chartsRef.current : null,
        histBarChartEl: consultations.length >= 1 ? histBarRef.current : null,
      });
    }
    setExportLoading(false);
  };

  const handleExportExcel = (consultId?: number) => {
    if (!patient) return;
    const list = consultId ? consultations.filter((c) => c.id === consultId) : consultations;
    exportToExcel(patient, list);
  };

  if (loading) return <div className="flex justify-center mt-32"><LoadingSpinner size="lg" /></div>;
  if (!patient) return <div className="p-8 text-center text-gray-500">Paciente no encontrado</div>;

  const age = Math.floor(getAgeDecimal(patient.birthDate));
  const tabClass = (t: Tab) =>
    `px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">←</button>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 ${patient.sex === 'M' ? 'bg-blue-600' : 'bg-pink-500'}`}>
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{patient.firstName} {patient.lastName}</h1>
          <p className="text-gray-500 text-xs sm:text-sm">{patient.sex === 'M' ? '♂ Masculino' : '♀ Femenino'} · {age} años · {patient.activityLevel}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link to={`/patients/${id}/consultations/new`} className="flex-1 sm:flex-none text-center bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Nueva Consulta
          </Link>
          <div className="relative" onMouseLeave={() => setHistoryExportOpen(false)}>
            <button
              onClick={() => setHistoryExportOpen(!historyExportOpen)}
              disabled={exportLoading}
              className="border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60 whitespace-nowrap"
            >
              {exportLoading ? '...' : '⬇ Exportar'}
            </button>
            {historyExportOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40">
                <button onClick={() => { setHistoryExportOpen(false); handleExportPDF(); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">PDF completo</button>
                <button onClick={() => { setHistoryExportOpen(false); handleExportExcel(); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Excel completo</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex gap-1 sm:gap-4 overflow-x-auto pb-px">
        <button className={tabClass('consultas')} onClick={() => setTab('consultas')}>📋 Consultas ({consultations.length})</button>
        <button className={tabClass('graficos')} onClick={() => setTab('graficos')}>📈 Gráficos</button>
        <button className={tabClass('estadisticas')} onClick={() => setTab('estadisticas')}>📊 Estadísticas</button>
      </div>

      {/* Consultas */}
      {tab === 'consultas' && (
        <div className="space-y-4">
          {consultations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-lg font-medium">Sin consultas</p>
              <p className="text-sm">Registra la primera consulta del paciente</p>
            </div>
          ) : (
            consultations.map((c) => {
              const calc = calculate(c, patient.sex, patient.birthDate);
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-gray-100">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900">{format(new Date(c.date), "dd 'de' MMMM yyyy", { locale: es })}</span>
                      {c.anamnesis && (() => {
                        const plain = c.anamnesis.replace(/<[^>]*>/g, '').trim();
                        return plain ? <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{plain.slice(0, 90)}{plain.length > 90 ? '…' : ''}</p> : null;
                      })()}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="relative" onMouseLeave={() => setOpenExportId(null)}>
                        <button
                          onClick={() => setOpenExportId(openExportId === c.id ? null : c.id)}
                          className="text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
                        >
                          ⬇ Exportar
                        </button>
                        {openExportId === c.id && (
                          <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36">
                            <button onClick={() => { setOpenExportId(null); handleExportPDF(c.id); }} className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50">PDF esta consulta</button>
                            <button onClick={() => { setOpenExportId(null); handleExportExcel(c.id); }} className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Excel esta consulta</button>
                          </div>
                        )}
                      </div>
                      <Link to={`/patients/${id}/consultations/${c.id}`} className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100">
                        Ver / Editar
                      </Link>
                      <button onClick={() => handleDeleteConsultation(c.id)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg">
                        🗑️
                      </button>
                    </div>
                  </div>
                  {/* Resumen de cálculos */}
                  <div className="px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 border-b border-gray-100">
                    {[
                      { label: 'Peso (kg)', value: c.weight != null ? `${c.weight}` : null },
                      { label: 'IMC', value: calc.imc != null ? `${calc.imc}` : null },
                      { label: 'Σ Pliegues', value: calc.sumFolds != null ? `${calc.sumFolds} mm` : null },
                      { label: '% Grasa', value: calc.fatPct != null ? `${calc.fatPct}%` : null },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-sm font-semibold ${value ? 'text-gray-900' : 'text-gray-300'}`}>{value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {/* Gráfico de barras de la consulta */}
                  <ConsultationBarChart consultation={c} patient={patient} />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Gráficos de línea — visibles en tab graficos, off-screen en otras tabs (para PDF) */}
      <div
        ref={chartsRef}
        className={tab === 'graficos' ? 'space-y-6' : 'fixed left-[-9999px] top-0 w-[900px] pointer-events-none'}
      >
        <EvolutionCharts consultations={consultations} patient={patient} />
      </div>

      {/* Gráfico de barras histórico comparativo — siempre off-screen, solo para PDF */}
      <div ref={histBarRef} className="fixed left-[-9999px] top-0 w-[900px] pointer-events-none">
        <HistoricalBarChart consultations={consultations} patient={patient} />
      </div>

      {/* Estadísticas */}
      {tab === 'estadisticas' && stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total de consultas', value: stats.total, icon: '📋' },
            { label: 'Días entre visitas (prom.)', value: stats.avgDaysBetween ? `${stats.avgDaysBetween} días` : '—', icon: '📅' },
            { label: 'Cambio de peso', value: stats.weightChange != null ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg` : '—', icon: '⚖️', color: stats.weightChange != null ? (stats.weightChange < 0 ? 'text-green-600' : 'text-red-600') : '' },
            { label: 'Primera visita', value: stats.firstVisit ? format(new Date(stats.firstVisit), 'dd/MM/yyyy') : '—', icon: '🗓️' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
              <p className="text-3xl mb-2">{icon}</p>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
