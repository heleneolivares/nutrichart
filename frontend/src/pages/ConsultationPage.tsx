import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Patient } from '../types';
import { calculate } from '../utils/calculations';
import TripleInput from '../components/common/TripleInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RichTextEditor from '../components/common/RichTextEditor';

interface FormData {
  date: string;
  anamnesis: string;
  weight: number | null;
  height: number | null;
  sittingHeight: number | null;
  armRelaxed: number | null;
  armFlexed: number | null;
  forearm: number | null;
  waistMin: number | null;
  hipMax: number | null;
  medialThigh: number | null;
  maxCalf: number | null;
  humeral: number | null;
  femoral: number | null;
  bistyloid: number | null;
  bimalleolar: number | null;
  triceps: number | null;
  subscapular: number | null;
  biceps: number | null;
  iliacCrest: number | null;
  supraspinal: number | null;
  abdominal: number | null;
  anteriorThigh: number | null;
  medialCalf: number | null;
}

const emptyForm = (): FormData => ({
  date: new Date().toISOString().split('T')[0],
  anamnesis: '',
  weight: null, height: null, sittingHeight: null,
  armRelaxed: null, armFlexed: null, forearm: null, waistMin: null, hipMax: null, medialThigh: null, maxCalf: null,
  humeral: null, femoral: null, bistyloid: null, bimalleolar: null,
  triceps: null, subscapular: null, biceps: null, iliacCrest: null, supraspinal: null, abdominal: null, anteriorThigh: null, medialCalf: null,
});

export default function ConsultationPage() {
  const { id: patientId, cid } = useParams<{ id: string; cid?: string }>();
  const navigate = useNavigate();
  const isNew = !cid || cid === 'new';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: p } = await api.get(`/patients/${patientId}`);
        setPatient(p);
        if (!isNew && cid) {
          const { data: c } = await api.get(`/patients/${patientId}/consultations/${cid}`);
          setForm({
            date: c.date ? c.date.split('T')[0] : new Date().toISOString().split('T')[0],
            anamnesis: c.anamnesis ?? '',
            weight: c.weight, height: c.height, sittingHeight: c.sittingHeight,
            armRelaxed: c.armRelaxed, armFlexed: c.armFlexed, forearm: c.forearm,
            waistMin: c.waistMin, hipMax: c.hipMax, medialThigh: c.medialThigh, maxCalf: c.maxCalf,
            humeral: c.humeral, femoral: c.femoral, bistyloid: c.bistyloid, bimalleolar: c.bimalleolar,
            triceps: c.triceps, subscapular: c.subscapular, biceps: c.biceps, iliacCrest: c.iliacCrest,
            supraspinal: c.supraspinal, abdominal: c.abdominal, anteriorThigh: c.anteriorThigh, medialCalf: c.medialCalf,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId, cid, isNew]);

  const setField = useCallback((key: keyof FormData) => (value: number | null) =>
    setForm((prev) => ({ ...prev, [key]: value })), []);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await api.post(`/patients/${patientId}/consultations`, form);
      } else {
        await api.put(`/patients/${patientId}/consultations/${cid}`, form);
      }
      navigate(`/patients/${patientId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-32"><LoadingSpinner size="lg" /></div>;
  if (!patient) return <div className="p-8 text-center text-gray-500">Paciente no encontrado</div>;

  const calc = calculate(form, patient.sex, patient.birthDate);

  const sectionClass = 'bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-4';
  const sectionTitle = (title: string, icon: string, subtitle?: string) => (
    <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2 flex-wrap">
      <span>{icon}</span>{title}
      {subtitle && <span className="text-xs font-normal text-gray-400">{subtitle}</span>}
    </h2>
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <button onClick={() => navigate(`/patients/${patientId}`)} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">←</button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{isNew ? 'Nueva Consulta' : 'Editar Consulta'}</h1>
          <p className="text-gray-500 text-sm">{patient.firstName} {patient.lastName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario */}
        <div className="lg:col-span-2">

          {/* Fecha */}
          <div className={sectionClass}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de consulta</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Medidas básicas */}
          <div className={sectionClass}>
            {sectionTitle('Medidas Básicas', '📏', '— ingresa hasta 3 mediciones, la app calcula la mediana')}
            <TripleInput label="Peso (kg)" unit="kg" value={form.weight} onChange={setField('weight')} step="0.1" />
            <TripleInput label="Talla (cm)" unit="cm" value={form.height} onChange={setField('height')} step="0.1" />
            <TripleInput label="Talla sentada (cm)" unit="cm" value={form.sittingHeight} onChange={setField('sittingHeight')} step="0.1" />
          </div>

          {/* Perímetros */}
          <div className={sectionClass}>
            {sectionTitle('Perímetros (cm)', '📐', '— ingresa hasta 3 mediciones, la app calcula la mediana')}
            <TripleInput label="Brazo relajado" unit="cm" value={form.armRelaxed} onChange={setField('armRelaxed')} />
            <TripleInput label="Brazo flexionado" unit="cm" value={form.armFlexed} onChange={setField('armFlexed')} />
            <TripleInput label="Antebrazo" unit="cm" value={form.forearm} onChange={setField('forearm')} />
            <TripleInput label="Cintura mínima" unit="cm" value={form.waistMin} onChange={setField('waistMin')} />
            <TripleInput label="Caderas máximo" unit="cm" value={form.hipMax} onChange={setField('hipMax')} />
            <TripleInput label="Muslo medial" unit="cm" value={form.medialThigh} onChange={setField('medialThigh')} />
            <TripleInput label="Pantorrilla máxima" unit="cm" value={form.maxCalf} onChange={setField('maxCalf')} />
          </div>

          {/* Diámetros */}
          <div className={sectionClass}>
            {sectionTitle('Diámetros (cm)', '📌', '— ingresa hasta 3 mediciones, la app calcula la mediana')}
            <TripleInput label="Humeral" unit="cm" value={form.humeral} onChange={setField('humeral')} />
            <TripleInput label="Femoral" unit="cm" value={form.femoral} onChange={setField('femoral')} />
            <TripleInput label="Bi-estiloideo" unit="cm" value={form.bistyloid} onChange={setField('bistyloid')} />
            <TripleInput label="Bi-maleolar" unit="cm" value={form.bimalleolar} onChange={setField('bimalleolar')} />
          </div>

          {/* Pliegues */}
          <div className={sectionClass}>
            {sectionTitle('Pliegues (mm)', '🔬', '— ingresa hasta 3 mediciones, la app calcula la mediana')}
            <TripleInput label="Tríceps" unit="mm" value={form.triceps} onChange={setField('triceps')} />
            <TripleInput label="Subescapular" unit="mm" value={form.subscapular} onChange={setField('subscapular')} />
            <TripleInput label="Bíceps" unit="mm" value={form.biceps} onChange={setField('biceps')} />
            <TripleInput label="Cresta Ilíaca" unit="mm" value={form.iliacCrest} onChange={setField('iliacCrest')} />
            <TripleInput label="Supraespinal" unit="mm" value={form.supraspinal} onChange={setField('supraspinal')} />
            <TripleInput label="Abdominal" unit="mm" value={form.abdominal} onChange={setField('abdominal')} />
            <TripleInput label="Muslo anterior" unit="mm" value={form.anteriorThigh} onChange={setField('anteriorThigh')} />
            <TripleInput label="Pantorrilla medial" unit="mm" value={form.medialCalf} onChange={setField('medialCalf')} />
          </div>

          {/* Anamnesis */}
          <div className={sectionClass}>
            {sectionTitle('Anamnesis', '📝')}
            <RichTextEditor
              content={form.anamnesis}
              onChange={(html) => setForm((p) => ({ ...p, anamnesis: html }))}
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <div className="flex gap-3 mb-8">
            <button onClick={() => navigate(`/patients/${patientId}`)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? 'Guardando...' : isNew ? 'Guardar consulta' : 'Actualizar consulta'}
            </button>
          </div>
        </div>

        {/* Panel de cálculos en tiempo real */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ⚡ Cálculos en Tiempo Real
            </h2>
            <div className="space-y-3">
              <CalcRow label="IMC" value={calc.imc} unit="kg/m²" color="blue" />
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-2 font-medium">Composición Corporal</p>
                <CalcRow label="% Grasa (D&W)" value={calc.fatPct} unit="%" color="red" />
                <CalcRow label="Kg Grasa" value={calc.kgFat} unit="kg" color="red" />
                <CalcRow label="Kg Masa Magra" value={calc.kgLean} unit="kg" color="green" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-2 font-medium">Músculo</p>
                <CalcRow label="Kg Músculo Martin" value={calc.kgMuscleMartin} unit="kg" color="green" />
                <CalcRow label="Kg Músculo Lee" value={calc.kgMuscleLee} unit="kg" color="green" />
                <CalcRow label="% Músculo" value={calc.musclePct} unit="%" color="green" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-2 font-medium">Esqueleto</p>
                <CalcRow label="Kg Esqueleto" value={calc.kgSkeleton} unit="kg" color="orange" />
                <CalcRow label="% Esqueleto" value={calc.skeletonPct} unit="%" color="orange" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <CalcRow label="Σ 8 Pliegues" value={calc.sumFolds} unit="mm" color="purple" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalcRow({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-700', red: 'text-red-600', green: 'text-green-700',
    orange: 'text-orange-600', purple: 'text-purple-700',
  };
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${value != null ? colors[color] : 'text-gray-300'}`}>
        {value != null ? `${value} ${unit}` : '—'}
      </span>
    </div>
  );
}
