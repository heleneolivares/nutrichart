import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Patient } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PatientFormModal from '../components/Patients/PatientFormModal';

function age(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', { params: search ? { search } : {} });
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este paciente y todas sus consultas?')) return;
    await api.delete(`/patients/${id}`);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">{patients.length} paciente{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditPatient(null); setShowModal(true); }}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
        >
          + Nuevo Paciente
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      {loading ? (
        <div className="mt-16"><LoadingSpinner size="lg" /></div>
      ) : patients.length === 0 ? (
        <div className="text-center mt-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-lg font-medium">{search ? 'Sin resultados' : 'No hay pacientes aún'}</p>
          <p className="text-sm">{!search && 'Crea tu primer paciente con el botón superior'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => {
            const lastConsult = p.consultations?.[0];
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${p.sex === 'M' ? 'bg-blue-600' : 'bg-pink-500'}`}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-500">{p.sex === 'M' ? '♂ Masculino' : '♀ Femenino'} · {age(p.birthDate)} años</p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0 ml-2">{p.activityLevel}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    {lastConsult
                      ? `Última consulta: ${format(new Date(lastConsult.date), 'dd MMM yyyy', { locale: es })}`
                      : 'Sin consultas'}
                  </p>
                  <div className="flex gap-2">
                    <Link to={`/patients/${p.id}`} className="flex-1 text-center bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                      Ver ficha
                    </Link>
                    <button onClick={() => { setEditPatient(p); setShowModal(true); }} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PatientFormModal
          patient={editPatient}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchPatients(); }}
        />
      )}
    </div>
  );
}
