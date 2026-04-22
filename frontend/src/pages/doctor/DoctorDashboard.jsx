import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue");
  
  // History Search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const fetchAppointments = async () => {
    try {
      const aptRes = await api.get("/reception/appointments/");
      setAppointments(aptRes.data);
    } catch (err) {
      console.error("Doctor appointments fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!patientSearch.trim()) {
        setPatientSuggestions([]);
        return;
      }
      try {
        const res = await api.get(`/doctor/patients/?search=${patientSearch}`);
        setPatientSuggestions(res.data);
      } catch (err) {
        console.error("Patient search error", err);
      }
    };

    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleStartConsultation = (apt) => {
    navigate("/doctor/consultation", { state: { activeApt: apt } });
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientSearch("");
    setPatientSuggestions([]);
    setHistoryLoading(true);
    setExpandedItems({});
    try {
      const res = await api.get(`/doctor/consultations/patient_history/?patient_id=${patient.id}`);
      setPatientHistory(res.data);
    } catch (err) {
      console.error("History fetch error", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeAppointments = appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed');

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Clinical Workspace</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your consultations and patient records.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button 
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest ${activeTab === 'queue' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('queue')}
        >
          Appointment Queue
        </button>
        <button 
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest ${activeTab === 'history' ? 'text-medical-secondary border-b-2 border-medical-secondary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('history')}
        >
          Patient History
        </button>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
                <div className="w-2 h-6 bg-medical-primary rounded-full mr-3" />
                Today's Appointments
              </h2>
              <span className="bg-medical-primary/10 text-medical-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">{activeAppointments.length} Pending</span>
            </div>

            {activeAppointments.length > 0 ? (
              <div className="glass rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-medium min-w-[600px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Token</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Patient</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Time</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] uppercase font-black text-slate-400 tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeAppointments.map(apt => (
                        <tr key={apt.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 rounded-xl bg-medical-primary/5 text-medical-primary flex items-center justify-center font-black text-sm border border-medical-primary/10">
                              T{apt.token_number}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-black text-slate-800 text-sm">{apt.patient_name}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{apt.start_time}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleStartConsultation(apt)}
                              className="bg-medical-primary/10 text-medical-primary border border-medical-primary/20 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-medical-primary hover:text-white transition-all shadow-sm"
                            >
                              Start
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col items-center justify-center text-center p-16">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-700">All caught up!</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">No pending appointments in your queue.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
                <div className="w-2 h-6 bg-medical-secondary rounded-full mr-3" />
                Patient History Search
              </h2>
            </div>

            <div className="relative group max-w-lg">
              <input 
                type="text" 
                placeholder="Search by ID, Name or Contact..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-medical-secondary/10 shadow-sm transition-all font-bold"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              <svg className="absolute left-4 top-4.5 w-5 h-5 text-slate-400 group-hover:text-medical-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {patientSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                  {patientSuggestions.map(pat => (
                    <div 
                      key={pat.id} 
                      onClick={() => handleSelectPatient(pat)}
                      className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="font-black text-slate-800 text-sm">{pat.first_name} {pat.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {pat.id} • Ph: {pat.contact_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-medical-secondary/10 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-medical-secondary/20">
                  <h3 className="text-base md:text-lg font-black text-medical-secondary">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  <p className="text-[10px] md:text-xs font-bold text-medical-secondary/70 mt-1 uppercase tracking-wider">Age: {selectedPatient.age} • Gender: {selectedPatient.gender || 'N/A'} • Blood: {selectedPatient.blood_group || 'N/A'}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 px-1">Clinical Timeline</h4>
                  {historyLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-medical-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : patientHistory.length > 0 ? (
                    <div className="relative pl-8">
                      {/* Timeline line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-medical-secondary via-medical-primary to-slate-200 rounded-full" />
                      
                      <div className="space-y-6">
                        {patientHistory.map((c, idx) => (
                          <div key={c.id} className="relative animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 80}ms` }}>
                            {/* Timeline dot */}
                            <div className="absolute -left-8 top-5 w-[22px] h-[22px] rounded-full bg-white border-[3px] border-medical-secondary shadow-md shadow-medical-secondary/20 flex items-center justify-center z-10">
                              <div className="w-2 h-2 rounded-full bg-medical-secondary" />
                            </div>

                            {/* Card */}
                            <div 
                              className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 cursor-pointer ${
                                expandedItems[c.id] 
                                  ? 'border-medical-secondary/30 shadow-lg shadow-medical-secondary/5' 
                                  : 'border-slate-200 hover:border-medical-secondary/20 hover:shadow-md'
                              }`}
                              onClick={() => toggleExpanded(c.id)}
                            >
                              {/* Header — always visib                              <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-medical-primary tracking-wider bg-medical-primary/5 px-2.5 py-1 rounded-lg border border-medical-primary/10">
                                      {new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-500">Dr. {c.doctor_name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                  {c.prescriptions && c.prescriptions.length > 0 && (
                                    <span className="text-[9px] font-black uppercase text-medical-secondary tracking-widest bg-medical-secondary/5 px-2 py-0.5 rounded border border-medical-secondary/10">
                                      {c.prescriptions.length} Rx
                                    </span>
                                  )}
                                  <svg 
                                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedItems[c.id] ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>  </div>

                              {/* Expanded content */}
                              <div className={`overflow-hidden transition-all duration-300 ${expandedItems[c.id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                                  {/* Notes */}
                                  <div className="pt-4">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Consultation Notes</p>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                      <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                                    </div>
                                  </div>

                                  {/* Prescriptions */}
                                  {c.prescriptions && c.prescriptions.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Prescriptions</p>
                                      <div className="space-y-2">
                                        {c.prescriptions.map(p => (
                                          <div key={p.id} className="flex items-center justify-between bg-gradient-to-r from-medical-secondary/5 to-transparent p-3.5 rounded-xl border border-medical-secondary/10">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-medical-secondary/10 text-medical-secondary flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                              </div>
                                              <div>
                                                <p className="font-black text-slate-700 text-sm">{p.medicine_name}</p>
                                                {p.instructions && <p className="text-[10px] text-slate-500 italic mt-0.5">{p.instructions}</p>}
                                              </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-black text-medical-secondary bg-white px-2 py-1 rounded-md border border-medical-secondary/20 shadow-sm">{p.frequency}</span>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.duration_days} day(s)</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400">No consultation records found.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col items-center justify-center text-center p-16 opacity-60">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4 rotate-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-500">Search for a patient to view their clinical history and past records.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
