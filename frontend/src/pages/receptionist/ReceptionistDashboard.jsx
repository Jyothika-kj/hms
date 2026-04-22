import { useState, useEffect } from "react";
import api from "../../utils/api";

const ReceptionistDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showBookApt, setShowBookApt] = useState(false);
  const [showEditApt, setShowEditApt] = useState(false);

  // Selection state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);

  // UI View state
  const [activeTab, setActiveTab] = useState("patients");
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [viewedPatient, setViewedPatient] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [viewedBillApt, setViewedBillApt] = useState(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorAvailability, setSelectedDoctorAvailability] = useState(null);
  const [filters, setFilters] = useState({
    specialization: "",
    doctorName: "",
  });

  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    contact_number: "",
    address: "",
    blood_group: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  const [bookingData, setBookingData] = useState({
    doctor: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
  });

  const fetchData = async () => {
    try {
      const [patRes, aptRes, specRes] = await Promise.all([
        api.get(`/reception/patients/?search=${search}`),
        api.get("/reception/appointments/"),
        api.get("/admin/specializations/"),
      ]);
      setPatients(patRes.data);
      setAppointments(aptRes.data);
      setSpecializations(specRes.data);
    } catch (err) {
      console.error("Data fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      // Fetch all users with Doctor group
      const res = await api.get("/admin/users/");
      const docs = res.data.filter(u => u.groups.includes("Doctor"));
      setDoctors(docs);
    } catch (err) {
      console.error("Doctor fetch error", err);
    }
  };

  const checkAvailability = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      const res = await api.get(`/admin/users/${doctorId}/availability/?date=${date}`);
      setSelectedDoctorAvailability(res.data);
      if (res.data.is_available) {
        setBookingData(prev => ({ ...prev, start_time: res.data.start_time }));
      } else {
        setBookingData(prev => ({ ...prev, start_time: "" }));
      }
    } catch (err) {
      console.error("Availability check error", err);
      setSelectedDoctorAvailability(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  useEffect(() => {
    if (showBookApt || showEditApt) {
      fetchDoctors();
    }
  }, [showBookApt, showEditApt]);

  useEffect(() => {
    if (bookingData.doctor && bookingData.date) {
      checkAvailability(bookingData.doctor, bookingData.date);
    }
  }, [bookingData.doctor, bookingData.date]);

  const validatePatientForm = (patient) => {
    const newErrors = {};
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const addressRegex = /^[A-Za-z0-9\s\-#/,.:]+$/; // Including comma and dot as they are essential for addresses

    if (!patient.first_name || !patient.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    } else if (!nameRegex.test(patient.first_name)) {
      newErrors.first_name = "Only alphabets are allowed.";
    }

    if (!patient.last_name || !patient.last_name.trim()) {
      newErrors.last_name = "Last name is required.";
    } else if (!nameRegex.test(patient.last_name)) {
      newErrors.last_name = "Only alphabets are allowed.";
    }

    if (!patient.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required.";
    } else {
      const dobDate = new Date(patient.date_of_birth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 150);

      if (dobDate > today) {
        newErrors.date_of_birth = "Date of birth cannot be in the future.";
      } else if (dobDate < minDate) {
        newErrors.date_of_birth = "Date of birth cannot be more than 150 years in the past.";
      }
    }

    if (!patient.contact_number) {
      newErrors.contact_number = "Contact number is required.";
    } else if (!phoneRegex.test(patient.contact_number)) {
      newErrors.contact_number = "Must be 10 digits starting with 6, 7, 8, or 9.";
    }

    if (!patient.gender) {
      newErrors.gender = "Gender is required.";
    }

    if (!patient.blood_group) {
      newErrors.blood_group = "Blood group is required.";
    }

    if (!patient.address || !patient.address.trim()) {
      newErrors.address = "Address is required.";
    } else if (!addressRegex.test(patient.address)) {
      newErrors.address = "Allowed: alphabets, numbers, and -, #, /, comma, dot.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!validatePatientForm(newPatient)) return;
    try {
      await api.post("/reception/patients/", newPatient);
      setShowAddPatient(false);
      setNewPatient({ first_name: "", last_name: "", date_of_birth: "", gender: "", contact_number: "", address: "", blood_group: "" });
      fetchData();
    } catch (err) {
      alert("Error adding patient.");
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    if (!validatePatientForm(selectedPatient)) return;
    try {
      await api.put(`/reception/patients/${selectedPatient.id}/`, selectedPatient);
      setShowEditPatient(false);
      fetchData();
    } catch (err) {
      alert("Error updating patient.");
    }
  };

  const validateAppointmentTime = () => {
    const now = new Date();
    // Use client's local timezone implicitly for 'today' limits
    const selectedDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`);
    if (selectedDateTime < now) {
      alert("Appointments cannot be booked in the past.");
      return false;
    }
    return true;
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!validateAppointmentTime()) return;
    try {
      const response = await api.post("/reception/appointments/", {
        patient: selectedPatient.id,
        doctor: bookingData.doctor,
        appointment_date: bookingData.date,
        start_time: bookingData.start_time,
      });
      setShowBookApt(false);
      setBookedAppointment(response.data);
      setShowBookingSuccess(true);
      fetchData();
    } catch (err) {
      alert("Booking failed. Slot might be taken or doctor unavailable.");
    }
  };

  const handleEditApt = async (e) => {
    e.preventDefault();
    if (!validateAppointmentTime()) return;
    try {
      await api.patch(`/reception/appointments/${selectedApt.id}/`, {
        doctor: bookingData.doctor,
        appointment_date: bookingData.date,
        start_time: bookingData.start_time,
        status: 'Scheduled'
      });
      setShowEditApt(false);
      fetchData();
      alert("Appointment rescheduled successfully!");
    } catch (err) {
      alert("Reschedule failed. Slot might be taken or doctor unavailable.");
    }
  };

  const handleCancelApt = async (aptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.patch(`/reception/appointments/${aptId}/`, { status: 'Cancelled' });
      alert("Appointment cancelled successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to cancel appointment.");
    }
  };

  const filteredDoctors = doctors.filter(d => {
    const matchesSpec = !filters.specialization || d.doctor_profile?.specialization === parseInt(filters.specialization);
    const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
    const matchesName = !filters.doctorName || fullName.includes(filters.doctorName.toLowerCase());
    return matchesSpec && matchesName;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Reception Desk</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time clinical scheduling and patient management.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest ${activeTab === 'patients' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('patients')}
        >
          Patient Management
        </button>
        <button
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest ${activeTab === 'appointments' ? 'text-medical-secondary border-b-2 border-medical-secondary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointment Management
        </button>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
                <div className="w-2 h-6 bg-medical-primary rounded-full mr-3" />
                Patient Directory
              </h2>
              <div className="flex gap-4 w-full sm:w-auto max-w-lg">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 shadow-sm transition-all font-bold text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-hover:text-medical-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => {
                    setErrors({});
                    setShowAddPatient(true);
                  }}
                  className="medical-gradient text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  New Patient
                </button>
              </div>
            </div>
            <div className="glass rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium min-w-[600px]">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Patient Name</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Age</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Gender</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-800 text-sm tracking-tight">{p.first_name} {p.last_name}</p>
                        </td>
                        <td className="px-6 py-5 text-slate-600 text-sm font-bold">{p.contact_number}</td>
                        <td className="px-6 py-5 text-slate-500 text-xs font-bold">{p.age}</td>
                        <td className="px-6 py-5 text-slate-500 text-xs font-bold">{p.gender || '-'}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex gap-3 justify-end items-center">
                            <button
                              onClick={() => { setViewedPatient(p); setShowPatientDetails(true); }}
                              className="text-slate-300 hover:text-medical-primary p-2 transition-colors tooltip"
                              title="View Details"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setErrors({});
                                setSelectedPatient(p);
                                setShowEditPatient(true);
                              }}
                              className="text-slate-300 hover:text-medical-secondary p-2 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setSelectedPatient(p); setShowBookApt(true); }}
                              className="bg-medical-secondary/10 text-medical-secondary border border-medical-secondary/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-medical-secondary hover:text-white transition-all shadow-sm"
                            >
                              Book
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Queue Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight">
              <div className="w-2 h-6 bg-medical-secondary rounded-full mr-3" />
              Todays Queue
            </h2>
            <div className="glass rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium min-w-[800px]">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Token</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Patient</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Doctor</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Time</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] uppercase font-black text-slate-400 tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed').map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-xl bg-medical-secondary/5 text-medical-secondary flex items-center justify-center font-black text-sm border border-medical-secondary/10">
                            {apt.token_number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800 text-sm">{apt.patient_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DR. {apt.doctor_name}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-900 text-sm font-black">{apt.start_time}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => {
                                setViewedBillApt(apt);
                                setShowBillModal(true);
                              }}
                              className="bg-medical-primary/10 text-medical-primary border border-medical-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-medical-primary hover:text-white transition-all shadow-sm"
                            >
                              Bill
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patients.find(p => p.id === apt.patient) || { first_name: apt.patient_name, last_name: "" });
                                setSelectedApt(apt);
                                setBookingData({
                                  doctor: apt.doctor,
                                  date: apt.appointment_date,
                                  start_time: apt.start_time
                                });
                                setShowEditApt(true);
                              }}
                              className="bg-medical-secondary/10 text-medical-secondary border border-medical-secondary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-medical-secondary hover:text-white transition-all shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelApt(apt.id)}
                              className="bg-red-50 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                              X
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Appointment Modal (Dynamic Availability Integration) */}
      {showBookApt && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Clinical Slot Booking</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Patient: {selectedPatient.first_name} {selectedPatient.last_name}</p>
              </div>
              <button onClick={() => setShowBookApt(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Specialization</label>
                  <select
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-medical-secondary/10 font-black text-slate-700 transition-all cursor-pointer"
                    value={filters.specialization}
                    onChange={e => setFilters({ ...filters, specialization: e.target.value })}
                  >
                    <option value="">All Field Specialties</option>
                    {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Doctor Search</label>
                  <input
                    placeholder="Doctor name..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-medical-secondary/10 font-black transition-all"
                    value={filters.doctorName}
                    onChange={e => setFilters({ ...filters, doctorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Doctor Selection</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredDoctors.map(d => (
                      <div
                        key={d.id}
                        onClick={() => setBookingData({ ...bookingData, doctor: d.id })}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${bookingData.doctor === d.id ? "bg-medical-secondary text-white border-medical-secondary shadow-lg" : "bg-white border-slate-100 hover:border-medical-secondary/40"
                          }`}
                      >
                        <div>
                          <p className="font-black text-sm">DR. {d.first_name} {d.last_name}</p>
                          <p className={`text-[10px] font-bold uppercase ${bookingData.doctor === d.id ? 'text-white/80' : 'text-slate-400'}`}>
                            {d.doctor_profile?.specialization_name}
                          </p>
                        </div>
                        {bookingData.doctor === d.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Appointment Date</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-medical-secondary animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-medical-secondary">Effective Availability</h3>
                  </div>

                  {!bookingData.doctor ? (
                    <p className="text-xs font-bold text-slate-400 text-center py-6 italic">Please select a provider first</p>
                  ) : selectedDoctorAvailability ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {selectedDoctorAvailability.is_available ? (
                        <>
                          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-100">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Duty Range</span>
                            <span className="text-sm font-black text-slate-800">{selectedDoctorAvailability.start_time} - {selectedDoctorAvailability.end_time}</span>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">
                            Role: {selectedDoctorAvailability.source === 'override' ? 'Date-Specific Override' : 'Recurring Base Schedule'}
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Start Time</label>
                            <input
                              type="time"
                              className="w-full px-6 py-3.5 rounded-xl bg-white border border-slate-200 outline-none font-black"
                              value={bookingData.start_time}
                              onChange={e => setBookingData({ ...bookingData, start_time: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center py-6 space-y-3">
                          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <p className="text-xs font-black text-red-400 uppercase tracking-widest">Off-Duty for Selected Date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-medical-secondary rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookAppointment}
                  disabled={!bookingData.doctor || !selectedDoctorAvailability?.is_available || !bookingData.start_time}
                  className="w-full medical-gradient text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditPatient && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Edit Patient Record</h2>
              <button onClick={() => setShowEditPatient(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditPatient} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">First Name</label>
                  <input type="text" value={selectedPatient.first_name} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    onChange={e => setSelectedPatient({ ...selectedPatient, first_name: e.target.value })} required />
                  {errors.first_name && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Last Name</label>
                  <input type="text" value={selectedPatient.last_name} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    onChange={e => setSelectedPatient({ ...selectedPatient, last_name: e.target.value })} required />
                  {errors.last_name && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.last_name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Contact</label>
                  <input type="text" value={selectedPatient.contact_number} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    onChange={e => setSelectedPatient({ ...selectedPatient, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                  {errors.contact_number && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.contact_number}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">DOB</label>
                  <input type="date" value={selectedPatient.date_of_birth} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    onChange={e => setSelectedPatient({ ...selectedPatient, date_of_birth: e.target.value })} required />
                  {errors.date_of_birth && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.date_of_birth}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Blood Group</label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    value={selectedPatient.blood_group || ""} onChange={e => setSelectedPatient({ ...selectedPatient, blood_group: e.target.value })}>
                    <option value="">Select</option>
                    {bloodGroupOptions.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  {errors.blood_group && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.blood_group}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Gender</label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    value={selectedPatient.gender || ""} onChange={e => setSelectedPatient({ ...selectedPatient, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.gender}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Residential Address</label>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold h-28"
                  value={selectedPatient.address || ""} onChange={e => setSelectedPatient({ ...selectedPatient, address: e.target.value })} />
                {errors.address && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.address}</p>}
              </div>
              <button type="submit" className="w-full medical-gradient text-white font-black uppercase tracking-widest py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all mt-4">Update</button>
            </form>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">New Registration</h2>
              <button onClick={() => setShowAddPatient(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">First Name</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })} required />
                  {errors.first_name && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Last Name</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })} required />
                  {errors.last_name && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.last_name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Date of Birth</label>
                  <input type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} required />
                  {errors.date_of_birth && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.date_of_birth}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Contact Number</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    value={newPatient.contact_number} onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                  {errors.contact_number && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.contact_number}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Blood Group <span className="text-red-400">*</span></label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    value={newPatient.blood_group} onChange={e => setNewPatient({ ...newPatient, blood_group: e.target.value })} required>
                    <option value="">Select</option>
                    {bloodGroupOptions.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  {errors.blood_group && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.blood_group}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Gender <span className="text-red-400">*</span></label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.gender}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Residential Address <span className="text-red-400">*</span></label>
                <textarea className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold h-28 focus:ring-4 focus:ring-medical-primary/10 transition-all"
                  value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} required />
                {errors.address && <p className="text-red-500 text-[10px] mt-1 px-1 font-bold">{errors.address}</p>}
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddPatient(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-[2rem] uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 medical-gradient text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all uppercase text-xs tracking-widest">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditApt && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Reschedule / Change</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Target Patient: {selectedApt.patient_name}</p>
              </div>
              <button onClick={() => setShowEditApt(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Clinical Dept</label>
                  <select
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-medical-secondary/10 font-black text-slate-700 transition-all cursor-pointer"
                    value={filters.specialization}
                    onChange={e => setFilters({ ...filters, specialization: e.target.value })}
                  >
                    <option value="">All Field Specialties</option>
                    {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Doctor Search</label>
                  <input
                    placeholder="Doctor name..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-medical-secondary/10 font-black transition-all"
                    value={filters.doctorName}
                    onChange={e => setFilters({ ...filters, doctorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Doctor Selection</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredDoctors.map(d => (
                      <div
                        key={d.id}
                        onClick={() => setBookingData({ ...bookingData, doctor: d.id })}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${bookingData.doctor === d.id ? "bg-medical-secondary text-white border-medical-secondary shadow-lg" : "bg-white border-slate-100 hover:border-medical-secondary/40"
                          }`}
                      >
                        <div>
                          <p className="font-black text-sm">DR. {d.first_name} {d.last_name}</p>
                          <p className={`text-[10px] font-bold uppercase ${bookingData.doctor === d.id ? 'text-white/80' : 'text-slate-400'}`}>
                            {d.doctor_profile?.specialization_name}
                          </p>
                        </div>
                        {bookingData.doctor === d.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Appointment Date</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black focus:ring-4 focus:ring-medical-primary/10 transition-all"
                    value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-medical-secondary animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-medical-secondary">Effective Availability</h3>
                  </div>

                  {!bookingData.doctor ? (
                    <p className="text-xs font-bold text-slate-400 text-center py-6 italic">Please select a Doctor first</p>
                  ) : selectedDoctorAvailability ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {selectedDoctorAvailability.is_available ? (
                        <>
                          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-100">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Duty Range</span>
                            <span className="text-sm font-black text-slate-800">{selectedDoctorAvailability.start_time} - {selectedDoctorAvailability.end_time}</span>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Start Time</label>
                            <input
                              type="time"
                              className="w-full px-6 py-3.5 rounded-xl bg-white border border-slate-200 outline-none font-black"
                              value={bookingData.start_time}
                              onChange={e => setBookingData({ ...bookingData, start_time: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center py-6 space-y-3">
                          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <p className="text-xs font-black text-red-400 uppercase tracking-widest">Off-Duty for Selected Date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-medical-secondary rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleEditApt}
                  disabled={!bookingData.doctor || !selectedDoctorAvailability?.is_available || !bookingData.start_time}
                  className="w-full medical-gradient text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  Update Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientDetails && viewedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Patient File</h2>
              <button onClick={() => setShowPatientDetails(false)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                <p className="font-black text-slate-800 text-lg">{viewedPatient.first_name} {viewedPatient.last_name}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</label>
                <p className="font-black text-slate-600 text-lg">{viewedPatient.contact_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Age</label>
                <p className="font-bold text-slate-600 text-md">{viewedPatient.age} <span className="text-slate-400 text-xs ml-1">(DOB: {viewedPatient.date_of_birth})</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender</label>
                <p className="font-bold text-slate-600 text-md">{viewedPatient.gender || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Blood</label>
                <p className="font-bold text-slate-600 text-md">{viewedPatient.blood_group || 'Unknown'}</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Residential Address</label>
              <div className="p-4 bg-slate-50 rounded-2xl mt-2 border border-slate-100">
                <p className="font-medium text-slate-600 leading-relaxed">{viewedPatient.address || 'No address registered.'}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={() => { setShowPatientDetails(false); setSelectedPatient(viewedPatient); setShowEditPatient(true); }}
                className="flex-1 medical-gradient text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill View Modal */}
      {showBillModal && viewedBillApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border-8 border-slate-50">
            <button onClick={() => setShowBillModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-16 h-16 mx-auto bg-medical-primary/10 text-medical-primary rounded-full flex items-center justify-center mb-6 border border-medical-primary/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Appointment Invoice</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Token #{viewedBillApt.token_number}</h2>
            <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Patient</span>
                <span className="font-extrabold text-slate-700">{viewedBillApt.patient_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Slot Date</span>
                <span className="font-extrabold text-slate-700">{viewedBillApt.appointment_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Slot Time</span>
                <span className="font-extrabold text-slate-700">{viewedBillApt.start_time}</span>
              </div>
              <div className="border-t border-slate-200/60 pt-3 flex justify-between text-lg">
                <span className="font-black text-slate-800">Total Fee</span>
                <span className="font-black text-medical-primary">${viewedBillApt.bill?.amount || '0.00'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowBillModal(false)}
              className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}

      {/* Booking Success Modal — Shows bill with token */}
      {showBookingSuccess && bookedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border-8 border-slate-50">
            <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Booking Confirmed</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-1">Token #{bookedAppointment.token_number}</h2>
            <p className="text-xs font-bold text-slate-400 mb-6">Appointment has been successfully scheduled</p>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left mb-6">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Patient</span>
                <span className="font-extrabold text-slate-700">{bookedAppointment.patient_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Doctor</span>
                <span className="font-extrabold text-slate-700">Dr. {bookedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Date</span>
                <span className="font-extrabold text-slate-700">{bookedAppointment.appointment_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Time</span>
                <span className="font-extrabold text-slate-700">{bookedAppointment.start_time}</span>
              </div>
              <div className="border-t border-slate-200/60 pt-3 flex justify-between text-lg">
                <span className="font-black text-slate-800">Consultation Fee</span>
                <span className="font-black text-medical-primary">${bookedAppointment.bill?.amount || '0.00'}</span>
              </div>
            </div>

            <button
              onClick={() => { setShowBookingSuccess(false); setBookedAppointment(null); }}
              className="w-full medical-gradient text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
