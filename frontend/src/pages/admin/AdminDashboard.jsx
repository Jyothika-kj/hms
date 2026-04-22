import { useState, useEffect } from "react";
import api from "../../utils/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [users, setUsers] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Form States
  const [staffError, setStaffError] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    groups: ["Receptionist"],
    specialization: "",
    consultation_fee: 50.0,
    available_start_time: "09:00",
    available_end_time: "17:00",
    working_days: "MON,TUE,WED,THU,FRI"
  });

  const [newSpec, setNewSpec] = useState({ name: "" });
  
  const [newOverride, setNewOverride] = useState({
    doctor: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "17:00",
    is_available: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, oRes] = await Promise.all([
        api.get("/admin/users/"),
        api.get("/admin/specializations/"),
        api.get("/admin/overrides/"),
      ]);
      setUsers(uRes.data);
      setSpecializations(sRes.data);
      setOverrides(oRes.data);
    } catch (err) {
      console.error("Data fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError(null);
    try {
      await api.post("/admin/users/", newUser);
      setShowStaffModal(false);
      resetStaffForm();
      fetchData();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorData = err.response.data.error;
        if (typeof errorData === 'string') {
          setStaffError(errorData);
        } else if (typeof errorData === 'object') {
          // Flatten serializer array format e.g., {"username": ["already exists"]}
          const firstKey = Object.keys(errorData)[0];
          const message = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
          setStaffError(`${firstKey.replace('_', ' ').toUpperCase()}: ${message}`);
        } else {
          setStaffError("Registration blocked due to invalid formatting.");
        }
      } else {
        setStaffError("Registration failed. Please check network or required fields.");
      }
    }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/specializations/", newSpec);
      setShowSpecModal(false);
      setNewSpec({ name: "" });
      fetchData();
    } catch (err) {
      alert("Failed to create specialization.");
    }
  };

  const handleCreateOverride = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/overrides/", newOverride);
      setShowOverrideModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to create override. Highly likely an override already exists for this doctor on this date.");
    }
  };

  const deleteOverride = async (id) => {
    if (!confirm("Are you sure you want to remove this schedule exception?")) return;
    try {
      await api.delete(`/admin/overrides/${id}/`);
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const resetStaffForm = () => {
    setStaffError(null);
    setNewUser({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
      groups: ["Receptionist"],
      specialization: "",
      consultation_fee: 50.0,
      available_start_time: "09:00",
      available_end_time: "17:00",
      working_days: "MON,TUE,WED,THU,FRI"
    });
  };

  const toggleWorkingDay = (day) => {
      const days = newUser.working_days.split(",").map(d => d.trim()).filter(Boolean);
      let updated;
      if (days.includes(day)) {
          updated = days.filter(d => d !== day);
      } else {
          updated = [...days, day];
      }
      setNewUser({...newUser, working_days: updated.join(",")});
  };

  const days = [
    { val: "MON", label: "Mon" },
    { val: "TUE", label: "Tue" },
    { val: "WED", label: "Wed" },
    { val: "THU", label: "Thu" },
    { val: "FRI", label: "Fri" },
    { val: "SAT", label: "Sat" },
    { val: "SUN", label: "Sun" },
  ];

  const doctorsOnly = users.filter(u => u.groups.includes("Doctor"));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Admin Console</h1>
          <p className="text-slate-500 font-medium mt-1">Hospital infrastructure and personnel control center.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab("staff")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-medical-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Staff Directory
          </button>
          <button 
            onClick={() => setActiveTab("specs")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'specs' ? 'bg-white text-medical-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Specializations
          </button>
          <button 
            onClick={() => setActiveTab("overrides")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overrides' ? 'bg-white text-medical-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Schedule Overrides
          </button>
        </div>
      </header>

      {activeTab === "staff" ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Personnel Roster</h3>
              <p className="text-sm text-slate-500 font-medium">{users.length} active healthcare providers</p>
            </div>
            <button 
              onClick={() => setShowStaffModal(true)}
              className="w-full sm:w-auto medical-gradient text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              + Register Staff
            </button>
          </div>

          <div className="glass rounded-[1.5rem] md:rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Provider</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Role/Dept</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-medical-primary/10 text-medical-primary flex items-center justify-center font-black shadow-inner flex-shrink-0">
                            {u.first_name?.[0] || u.username?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{u.email || "—"}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1.5">
                              {u.groups.map(g => (
                              <span key={g} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                  {g}
                              </span>
                              ))}
                          </div>
                          {u.doctor_profile && (
                              <span className="text-[10px] font-bold text-medical-primary ml-1">
                                  Dept: {u.doctor_profile.specialization_name}
                              </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "specs" ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Medical Specializations</h3>
              <p className="text-sm text-slate-500 font-medium">Define hospital departments</p>
            </div>
            <button 
              onClick={() => setShowSpecModal(true)}
              className="w-full sm:w-auto medical-gradient text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              + Add Dept
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specializations.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-medical-primary/20 transition-all group">
                <div className="w-12 h-12 bg-medical-primary/5 text-medical-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.812.683l-.533.639a2 2 0 00.312 2.766l2.164 1.731a2 2 0 002.492 0l2.164-1.731a2 2 0 00.312-2.766l-.533-.639z" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">{s.name}</h4>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm gap-4">
                <div>
                <h3 className="text-lg font-bold text-slate-800">Availability Overrides</h3>
                <p className="text-sm text-slate-500 font-medium">Date-specific schedule exceptions</p>
                </div>
                <button 
                onClick={() => setShowOverrideModal(true)}
                className="w-full sm:w-auto medical-gradient text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                + Add Exception
                </button>
            </div>

            <div className="glass rounded-[1.5rem] md:rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                        <tr>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Doctor</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Target Date</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Effective Hours</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {overrides.map((o) => {
                            const dr = users.find(u => u.id === o.doctor);
                            return (
                                <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5 font-bold text-slate-800">{dr ? `${dr.first_name} ${dr.last_name}` : "Unknown"}</td>
                                <td className="px-6 py-5 text-sm font-medium text-slate-600">{o.date}</td>
                                <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                    {o.is_available ? `${o.start_time} - ${o.end_time}` : "—"}
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${o.is_available ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {o.is_available ? "Available Override" : "Off-Duty"}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button onClick={() => deleteOverride(o.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Staff Registration Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Staff Registration</h2>
                <p className="text-sm text-slate-400 font-medium">Verify credentials before proceeding</p>
              </div>
              <button 
                onClick={() => { setShowStaffModal(false); setStaffError(null); }}
                className="p-2 md:p-3 rounded-2xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all border border-transparent"
              >
                <svg className="w-6 h-6 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-6 md:space-y-8">
              {staffError && (
                <div className="bg-red-50 text-red-500 p-4 md:p-5 rounded-2xl border border-red-100/50 flex items-center gap-3 md:gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-100/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="font-bold text-xs md:text-sm tracking-tight leading-tight">{staffError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">First Name</label>
                  <input 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                    placeholder="John"
                    value={newUser.first_name}
                    onChange={e => setNewUser({...newUser, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Last Name</label>
                  <input 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                    placeholder="Doe"
                    value={newUser.last_name}
                    onChange={e => setNewUser({...newUser, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Username</label>
                  <input 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Password</label>
                  <input 
                    type="password"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
                  <input 
                    type="email"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Institutional Role</label>
                  <select 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold appearance-none cursor-pointer"
                    value={newUser.groups[0]}
                    onChange={e => setNewUser({...newUser, groups: [e.target.value]})}
                  >
                    <option value="Receptionist">Receptionist</option>
                    <option value="Doctor">Doctor (Clinical Provider)</option>
                    <option value="Pharmacist">Pharmacist</option>
                  </select>
                </div>
              </div>

              {newUser.groups[0] === "Doctor" && (
                <div className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 space-y-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-medical-primary animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-medical-primary">Revised Clinical Defaults</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Medical Specialization</label>
                      <select 
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                        value={newUser.specialization}
                        onChange={e => setNewUser({...newUser, specialization: e.target.value})}
                        required
                      >
                        <option value="">Select Field</option>
                        {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Base Fee (USD)</label>
                      <input 
                        type="number"
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                        value={newUser.consultation_fee}
                        onChange={e => setNewUser({...newUser, consultation_fee: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Default Start Time</label>
                      <input 
                        type="time"
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                        value={newUser.available_start_time}
                        onChange={e => setNewUser({...newUser, available_start_time: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Default End Time</label>
                      <input 
                        type="time"
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                        value={newUser.available_end_time}
                        onChange={e => setNewUser({...newUser, available_end_time: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Working Days (Default)</label>
                    <div className="flex flex-wrap gap-2">
                        {days.map(d => (
                            <button
                                key={d.val}
                                type="button"
                                onClick={() => toggleWorkingDay(d.val)}
                                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                                    newUser.working_days.includes(d.val) ? "bg-medical-primary text-white border-medical-primary shadow-md" : "bg-white text-slate-400 border-slate-100 hover:border-medical-primary/30"
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <button type="submit" className="w-full medical-gradient text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-xs">
                  Finalize Account Creation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Define Exception</h2>
            <form onSubmit={handleCreateOverride} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Select Physician</label>
                <select 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold appearance-none cursor-pointer"
                    value={newOverride.doctor}
                    onChange={e => setNewOverride({...newOverride, doctor: e.target.value})}
                    required
                >
                    <option value="">Choose Doctor</option>
                    {doctorsOnly.map(d => <option key={d.id} value={d.id}>DR. {d.first_name} {d.last_name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Date</label>
                <input 
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                  value={newOverride.date}
                  onChange={e => setNewOverride({...newOverride, date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                    <button 
                        type="button" 
                        onClick={() => setNewOverride({...newOverride, is_available: !newOverride.is_available})}
                        className={`text-[10px] font-black uppercase py-1 px-3 rounded-lg border transition-all ${newOverride.is_available ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                    >
                        {newOverride.is_available ? "Setting: Available" : "Setting: Off-Duty"}
                    </button>
                  </div>
                  
                  {newOverride.is_available && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400">Start</label>
                            <input type="time" value={newOverride.start_time} onChange={e => setNewOverride({...newOverride, start_time: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" required />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400">End</label>
                            <input type="time" value={newOverride.end_time} onChange={e => setNewOverride({...newOverride, end_time: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" required />
                         </div>
                      </div>
                  )}
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowOverrideModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] medical-gradient text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Apply Override</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialization Creation Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">New Department</h2>
            <form onSubmit={handleCreateSpec} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Department Name</label>
                <input 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold"
                  placeholder="e.g. Cardiology"
                  value={newSpec.name}
                  onChange={e => setNewSpec({...newSpec, name: e.target.value})}
                  required
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowSpecModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] medical-gradient text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
