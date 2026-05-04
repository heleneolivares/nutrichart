import { useState, FormEvent } from 'react';
import api from '../../api/client';
import { Patient } from '../../types';

interface Props {
  patient: Patient | null;
  onClose: () => void;
  onSave: () => void;
}

const ACTIVITY_LEVELS = ['sedentario', 'ligero', 'moderado', 'activo', 'muy activo'];

export default function PatientFormModal({ patient, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    sex: patient?.sex ?? 'M',
    birthDate: patient?.birthDate ? patient.birthDate.split('T')[0] : '',
    activityLevel: patient?.activityLevel ?? 'moderado',
    phone: patient?.phone ?? '',
    email: patient?.email ?? '',
    notes: patient?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (patient) {
        await api.put(`/patients/${patient.id}`, form);
      } else {
        await api.post('/patients', form);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{patient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input type="text" value={form.firstName} onChange={set('firstName')} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input type="text" value={form.lastName} onChange={set('lastName')} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sexo *</label>
              <select value={form.sex} onChange={set('sex')} className={inputClass}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento *</label>
              <input type="date" value={form.birthDate} onChange={set('birthDate')} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nivel de actividad física</label>
            <select value={form.activityLevel} onChange={set('activityLevel')} className={inputClass}>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} className={inputClass} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
