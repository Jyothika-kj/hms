import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";

const ConsultationWindow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeApt = location.state?.activeApt;

  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [consultationData, setConsultationData] = useState({
    notes: "",
    prescriptions: [], // { medicine: id, frequency: "", duration_days: 1, instructions: "" }
  });

  const frequencyOptions = ['0-0-1', '0-1-0', '1-0-0', '1-1-0', '1-0-1', '0-1-1', '1-1-1', '1-1-1-1'];

  useEffect(() => {
    if (!activeApt) {
      navigate("/doctor", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const [medRes, histRes] = await Promise.all([
          api.get("/pharmacy/inventory/"),
          api.get(`/doctor/consultations/patient_history/?patient_id=${activeApt.patient}`)
        ]);
        setMedicines(medRes.data);
        setHistoryDocs(histRes.data);
      } catch (err) {
        console.error("Consultation fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeApt, navigate]);

  const toggleHistoryItem = (id) => {
    setExpandedHistoryItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveConsultation = () => {
    if (!consultationData.notes.trim()) {
      alert("Please enter consultation notes.");
      return;
    }

    const invalidDuration = consultationData.prescriptions.find(p => p.medicine && (p.duration_days > 90 || p.duration_days < 1));
    if (invalidDuration) {
      alert("Medicine duration must be between 1 and 90 days.");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSave = async () => {
    setIsSaving(true);
    try {
      const consResponse = await api.post("/doctor/consultations/", {
        appointment: activeApt.id,
        patient: activeApt.patient,
        notes: consultationData.notes,
      });
      
      const validPrescriptions = consultationData.prescriptions.filter(p => p.medicine);
      
      if (validPrescriptions.length > 0) {
        const promises = validPrescriptions.map(p => 
          api.post("/doctor/prescriptions/", {
            consultation: consResponse.data.id,
            medicine: p.medicine,
            frequency: p.frequency,
            duration_days: p.duration_days,
            instructions: p.instructions,
          })
        );
        
        await Promise.all(promises);
      }
      
      setShowConfirmModal(false);
      alert("Consultation saved successfully.");
      navigate("/doctor");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data).map(([key, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : val;
          return `${key}: ${msg}`;
        }).join('\n');
        alert(`Error saving consultation:\n${messages}`);
      } else {
        alert("Error saving consultation. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (consultationData.notes || consultationData.prescriptions.length > 0) {
      if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
        navigate("/doctor");
      }
    } else {
      navigate("/doctor");
    }
  };

  const addPrescriptionRow = () => {
    setConsultationData({
      ...consultationData,
      prescriptions: [...consultationData.prescriptions, { medicine: "", frequency: "1-0-1", duration_days: 1, instructions: "" }]
    });
  };

  // Prevent selecting same medicine twice
  const getAvailableMedicines = (currentIndex) => {
    const selectedMedIds = consultationData.prescriptions
      .map((p, idx) => idx !== currentIndex ? p.medicine : null)
      .filter(id => id);
    
    return medicines.filter(m => !selectedMedIds.includes(m.id.toString()) && !selectedMedIds.includes(m.id));
  };

  if (!activeApt) return null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Main Consultation Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${showHistory ? 'xl:pr-[420px]' : ''}`}>
        <header className="p-4 md:p-8 medical-gradient text-white shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center max-w-6xl mx-auto w-full gap-4 md:gap-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{activeApt.patient_name}</h2>
              <div className="mt-1 font-medium opacity-90 flex flex-wrap gap-x-3 gap-y-1 text-sm md:text-base">
                 <span>ID: <span className="font-black">{activeApt.patient}</span></span>
                 <span className="hidden sm:inline">•</span>
                 <span>Age: <span className="font-black">{activeApt.patient_details?.age || 'N/A'}</span></span>
                 <span className="hidden sm:inline">•</span>
                 <span>Gender: <span className="font-black">{activeApt.patient_details?.gender || 'N/A'}</span></span>
                 <span className="hidden sm:inline">•</span>
                 <span>Blood: <span className="font-black">{activeApt.patient_details?.blood_group || 'N/A'}</span></span>
              </div>
              <p className="font-medium opacity-80 text-[10px] md:text-sm mt-1">Token: <span className="font-black">#{activeApt.token_number}</span> • Time: {activeApt.start_time}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold uppercase tracking-wide transition-all text-[10px] md:text-xs border ${
                  showHistory 
                    ? 'bg-white/20 border-white text-white' 
                    : 'bg-white/10 hover:bg-white/20 border-transparent text-white'
                }`}
              >
                {showHistory ? 'Hide' : 'History'}
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold uppercase tracking-wide transition-all text-[10px] md:text-xs text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveConsultation}
                className="w-full md:w-auto bg-white text-medical-primary px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-[10px] md:text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Notes Section */}
            <div className="space-y-4">
              <label className="text-sm font-black uppercase tracking-[0.15em] text-slate-400 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Consultation Notes
              </label>
              <textarea 
                className="w-full h-40 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all text-slate-700 font-medium leading-relaxed"
                placeholder="Record patient symptoms, diagnosis, and clinical observations here..."
                value={consultationData.notes}
                onChange={e => setConsultationData({...consultationData, notes: e.target.value})}
              />
            </div>

            {/* Prescriptions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black uppercase tracking-[0.15em] text-slate-400 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.812.683l-.533.639a2 2 0 00.312 2.766l2.164 1.731a2 2 0 002.492 0l2.164-1.731a2 2 0 00.312-2.766l-.533-.639z" />
                  </svg>
                  Prescriptions
                </label>
                <button 
                  onClick={addPrescriptionRow}
                  className="bg-medical-secondary/10 text-medical-secondary px-4 py-2 rounded-lg flex items-center text-xs font-black uppercase tracking-wider hover:bg-medical-secondary/20 transition-colors"
                >
                  + Add Medication
                </button>
              </div>
              
              <div className="space-y-4">
                {consultationData.prescriptions.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 px-1">Medicine</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-medical-secondary font-medium text-sm"
                        value={p.medicine}
                        onChange={e => {
                          const newP = [...consultationData.prescriptions];
                          newP[idx].medicine = e.target.value;
                          setConsultationData({...consultationData, prescriptions: newP});
                        }}
                      >
                        <option value="">Select Medicine</option>
                        {getAvailableMedicines(idx).map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 px-1">Frequency</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-medical-secondary font-medium text-sm"
                        value={p.frequency}
                        onChange={e => {
                          const newP = [...consultationData.prescriptions];
                          newP[idx].frequency = e.target.value;
                          setConsultationData({...consultationData, prescriptions: newP});
                        }}
                      >
                        {frequencyOptions.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 px-1">Duration (Days)</label>
                      <input 
                        type="number"
                        min="1"
                        max="90"
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-medical-secondary font-medium text-sm ${p.duration_days > 90 ? 'border-red-500 text-red-600' : 'border-slate-200'}`}
                        value={p.duration_days}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          const newP = [...consultationData.prescriptions];
                          newP[idx].duration_days = val;
                          setConsultationData({...consultationData, prescriptions: newP});
                        }}
                      />
                      {p.duration_days > 90 && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1 animate-pulse">Max 90 days</p>}
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 px-1">Instructions</label>
                      <input 
                        placeholder="Special remarks..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-medical-secondary font-medium text-sm"
                        value={p.instructions}
                        onChange={e => {
                          const newP = [...consultationData.prescriptions];
                          newP[idx].instructions = e.target.value;
                          setConsultationData({...consultationData, prescriptions: newP});
                        }}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                      <button 
                        onClick={() => {
                           const newP = consultationData.prescriptions.filter((_, i) => i !== idx);
                           setConsultationData({...consultationData, prescriptions: newP});
                        }}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {consultationData.prescriptions.length === 0 && (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-3xl">
                    <p className="text-sm font-medium text-slate-400">No medications prescribed yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Timeline History Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-800">Patient Timeline</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{historyDocs.length} past consultations</p>
          </div>
          <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {historyDocs.length > 0 ? (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-medical-secondary via-medical-primary to-slate-200 rounded-full" />
              
              <div className="space-y-4">
                {historyDocs.map((c, idx) => (
                  <div key={c.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-6 top-4 w-[18px] h-[18px] rounded-full bg-white border-[3px] border-medical-secondary shadow-sm flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-medical-secondary" />
                    </div>

                    {/* Card */}
                    <div 
                      className={`rounded-2xl border transition-all duration-200 cursor-pointer ${
                        expandedHistoryItems[c.id] 
                          ? 'border-medical-secondary/30 bg-white shadow-md shadow-medical-secondary/10' 
                          : 'border-slate-100 bg-white hover:border-medical-secondary/20 hover:shadow-sm'
                      }`}
                      onClick={() => toggleHistoryItem(c.id)}
                    >
                      {/* Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-medical-primary">
                            {new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Dr. {c.doctor_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.prescriptions && c.prescriptions.length > 0 && (
                            <span className="text-[9px] font-black text-medical-secondary bg-medical-secondary/5 px-1.5 py-0.5 rounded border border-medical-secondary/10">
                              {c.prescriptions.length} Rx
                            </span>
                          )}
                          <svg 
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expandedHistoryItems[c.id] ? 'rotate-180' : ''}`} 
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded body */}
                      <div className={`overflow-hidden transition-all duration-200 ${expandedHistoryItems[c.id] ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                          {/* Notes */}
                          <div className="pt-3">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Notes</p>
                            <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{c.notes}</p>
                          </div>

                          {/* Prescriptions */}
                          {c.prescriptions && c.prescriptions.length > 0 && (
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Prescriptions</p>
                              <div className="space-y-1.5">
                                {c.prescriptions.map(p => (
                                  <div key={p.id} className="flex items-center justify-between bg-medical-secondary/5 p-2.5 rounded-xl border border-medical-secondary/10">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-medical-secondary/10 text-medical-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-700 text-xs">{p.medicine_name}</p>
                                        {p.instructions && <p className="text-[9px] text-slate-500 italic truncate mt-0.5">{p.instructions}</p>}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0">
                                      <span className="text-[10px] font-black text-medical-secondary bg-white px-1.5 py-0.5 rounded border border-medical-secondary/20 shadow-sm">{p.frequency}</span>
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.duration_days}d</span>
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
             <div className="text-center py-10">
               <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               </div>
               <p className="text-slate-400 font-bold text-sm">No past consultations found.</p>
               <p className="text-slate-300 font-medium text-xs mt-1">This is the patient's first visit.</p>
             </div>
          )}
        </div>
      </div>
      
      {/* Confirmation & Review Modal (Token Style) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border-8 border-slate-50 overflow-hidden flex flex-col">
            
            <div className="p-8 pb-4">
              <div className="w-20 h-20 mx-auto bg-medical-secondary/10 text-medical-secondary rounded-full flex items-center justify-center mb-6 border-4 border-medical-secondary/20 animate-pulse">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              
              <p className="text-[10px] font-black uppercase text-medical-secondary tracking-[0.2em] mb-1">Consultation Summary</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Review Record</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Appointment ID: {activeApt.id}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
              {/* Ticket Details */}
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left relative overflow-hidden">
                {/* Decorative cutouts for ticket look */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white rounded-full border border-slate-100 -translate-y-1/2" />
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white rounded-full border border-slate-100 -translate-y-1/2" />

                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Patient</span>
                  <span className="font-black text-slate-800 tracking-tight">{activeApt.patient_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="font-black text-slate-800">{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="border-t border-dashed border-slate-200 pt-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Findings & Notes</span>
                  <p className="text-xs text-slate-600 font-bold italic leading-relaxed line-clamp-3">
                    "{consultationData.notes}"
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Prescriptions</span>
                  <div className="space-y-2">
                    {consultationData.prescriptions.filter(p => p.medicine).length > 0 ? (
                      consultationData.prescriptions.filter(p => p.medicine).map((p, idx) => {
                        const med = medicines.find(m => m.id.toString() === p.medicine.toString() || m.id === p.medicine);
                        return (
                          <div key={idx} className="flex justify-between items-start text-[10px] group">
                            <div className="flex-1 pr-2">
                              <p className="font-black text-slate-700 leading-tight">{med?.name || "Medicine"}</p>
                              {p.instructions && <p className="text-[8px] text-slate-400 font-bold">Inst: {p.instructions}</p>}
                            </div>
                            <div className="text-right shrink-0">
                               <p className="font-black text-medical-primary">{p.frequency}</p>
                               <p className="text-[8px] font-bold text-slate-400 tracking-tighter">{p.duration_days}d</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] font-bold text-slate-300 italic">No prescriptions added.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={executeSave}
                  disabled={isSaving}
                  className="w-full medical-gradient text-white font-black py-4 rounded-2xl shadow-xl shadow-medical-secondary/20 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm & Save'
                  )}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSaving}
                  className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Go Back to Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationWindow;
