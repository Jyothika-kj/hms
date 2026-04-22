import { useState, useEffect } from "react";
import api from "../../utils/api";

const PharmacyDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showEditMedicine, setShowEditMedicine] = useState(false);
  const [showConfirmDispense, setShowConfirmDispense] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedPaymentConsId, setSelectedPaymentConsId] = useState(null);
  const [billSearch, setBillSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    stock_quantity: 0,
    min_stock: 10,
    unit: "mg",
    price: 0,
  });

  const fetchData = async () => {
    try {
      const [medRes, preRes, billRes] = await Promise.all([
        api.get("/pharmacy/inventory/"),
        api.get("/doctor/prescriptions/"),
        api.get("/pharmacy/bills/"),
      ]);
      setMedicines(medRes.data);
      setPrescriptions(preRes.data);
      setBills(billRes.data);
    } catch (err) {
      console.error("Pharmacy data error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotalQuantity = (frequency, duration) => {
    if (!frequency || !duration) return 0;
    // frequency format "1-0-1" -> sum of digits
    const dailyCount = frequency.split('-').reduce((acc, val) => acc + parseInt(val || 0), 0);
    return dailyCount * duration;
  };

  const handleDispense = async (prescription, quantity) => {
    try {
      await api.post("/pharmacy/bills/", {
        prescription: prescription.id,
        quantity_dispensed: quantity,
      });
      
      alert(`Success: ${quantity} units dispensed.`);
      setShowConfirmDispense(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || "Dispensing failed. Check stock levels.";
      alert(msg);
    }
  };

  const handleMarkAsPaid = async (consultationId) => {
    try {
      const consultationBills = bills.filter(b => b.consultation_id === consultationId && !b.is_paid);
      const promises = consultationBills.map(b => 
        api.patch(`/pharmacy/bills/${b.id}/`, { is_paid: true })
      );
      await Promise.all(promises);
      alert("Payment collected successfully.");
      setShowPaymentConfirm(false);
      fetchData();
    } catch (err) {
      alert("Failed to collect payment.");
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (medicines.some(m => m.name.toLowerCase() === newMedicine.name.toLowerCase().trim())) {
      alert(`Medicine "${newMedicine.name}" already exists in the inventory.`);
      return;
    }
    try {
      await api.post("/pharmacy/inventory/", newMedicine);
      setShowAddMedicine(false);
      setNewMedicine({ name: "", stock_quantity: 0, min_stock: 10, unit: "mg", price: 0 });
      fetchData();
    } catch (err) {
      alert("Error adding medicine.");
    }
  };

  const handleEditMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/pharmacy/inventory/${selectedMedicine.id}/`, selectedMedicine);
      setShowEditMedicine(false);
      fetchData();
    } catch (err) {
      alert("Error updating medicine.");
    }
  };

  // Sort medicines to push lowest stock to the top
  const sortedMedicines = [...medicines]
    .filter(m => m.name.toLowerCase().includes(inventorySearch.toLowerCase()))
    .sort((a, b) => {
      const aLow = a.stock_quantity <= a.min_stock;
      const bLow = b.stock_quantity <= b.min_stock;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.stock_quantity - b.stock_quantity;
  });

  // Filter prescriptions queue by patient name
  const filteredPrescriptions = prescriptions
    .filter(p => !bills.some(b => b.prescription === p.id))
    .filter(p => {
      if (!prescriptionSearch.trim()) return true;
      const search = prescriptionSearch.toLowerCase();
      return (
        (p.patient_name || '').toLowerCase().includes(search) ||
        (p.patient_id || '').toString().includes(search)
      );
    });

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pharmacy Hub</h1>
          <p className="text-medical-text-muted mt-1">Inventory control and dispensing management.</p>
        </div>
        <button 
          onClick={() => setShowAddMedicine(true)}
          className="w-full md:w-auto bg-medical-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center text-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Inventory
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
        <button 
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest whitespace-nowrap ${activeTab === 'inventory' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button 
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest whitespace-nowrap ${activeTab === 'prescriptions' ? 'text-medical-secondary border-b-2 border-medical-secondary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          Queue
        </button>
        <button 
          className={`pb-4 font-black text-sm transition-colors uppercase tracking-widest whitespace-nowrap ${activeTab === 'bills' ? 'text-medical-primary border-b-2 border-medical-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('bills')}
        >
          Bills
        </button>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Inventory Column */}
        {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <div className="w-2 h-6 bg-medical-primary rounded-full mr-3" />
              Stock Inventory
            </h2>
            <div className="relative group w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 shadow-sm transition-all font-bold text-sm"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-hover:text-medical-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="glass rounded-[1.5rem] md:rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">Medicine Name</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">Stock</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">Unit Price</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMedicines.map(m => {
                    const isLow = m.stock_quantity <= m.min_stock;
                    return (
                    <tr key={m.id} className={`transition-colors group ${isLow ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-slate-50/40'}`}>
                      <td className="px-6 py-5">
                        <p className={`font-black text-sm ${isLow ? 'text-red-700' : 'text-slate-800'} leading-none`}>{m.name}</p>
                        <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${isLow ? 'text-red-500' : 'text-medical-primary'}`}>{m.unit}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-3 ${isLow ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className={`font-black ${isLow ? 'text-red-700' : 'text-slate-700'}`}>
                             {m.stock_quantity} <span className="text-[9px] font-bold uppercase tracking-widest ml-1 opacity-50">(Min: {m.min_stock})</span>
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-5 font-bold ${isLow ? 'text-red-600' : 'text-slate-600'}`}>${m.price}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <button 
                          onClick={() => { setSelectedMedicine(m); setShowEditMedicine(true); }}
                          className="text-slate-400 hover:text-medical-secondary p-2 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
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

        {/* Prescription Queue Tab */}
        {activeTab === 'prescriptions' && (
        <div className="space-y-4 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <div className="w-2 h-6 bg-medical-secondary rounded-full mr-3" />
              Dispensing Queue
            </h2>
            <div className="relative group w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-medical-secondary/10 shadow-sm transition-all font-bold text-sm"
                value={prescriptionSearch}
                onChange={(e) => setPrescriptionSearch(e.target.value)}
              />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-hover:text-medical-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="glass rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-medium min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Doctor</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Prescription</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Frequency</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Duration</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Total Qty</th>
                    <th className="px-6 py-4 text-right text-[10px] uppercase font-black text-slate-400 tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrescriptions.map(p => {
                    const totalQty = calculateTotalQuantity(p.frequency, p.duration_days);
                    return (
                    <tr key={p.id} className="transition-colors group hover:bg-slate-50/40">
                        <td className="px-6 py-5">
                            <p className="font-black text-slate-800 text-sm tracking-tight">{p.patient_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">ID: {p.patient_id}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dr. {p.doctor_name}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="font-black text-slate-800 text-sm tracking-tight">{p.medicine_name}</p>
                            <p className="text-xs text-slate-400 italic mt-1">"{p.instructions || 'No instructions'}"</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="font-black text-medical-secondary text-xs bg-medical-secondary/5 px-2 py-1 rounded-md border border-medical-secondary/10">{p.frequency}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{p.duration_days}d</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="px-3 py-1 bg-medical-secondary/5 text-medical-secondary rounded-lg font-black text-xs border border-medical-secondary/10">
                              {totalQty}
                            </span>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end">
                            <button 
                              onClick={() => {
                                setSelectedPrescription(p);
                                setShowConfirmDispense(true);
                              }}
                              className="bg-medical-secondary/10 text-medical-secondary border border-medical-secondary/20 hover:bg-medical-secondary hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              Dispense
                            </button>
                        </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredPrescriptions.length === 0 && (
              <div className="flex flex-col items-center justify-center p-16 text-center opacity-50">
                <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="font-black text-slate-600 text-sm">Queue is clear</p>
                <p className="text-xs font-bold text-slate-400 mt-1">No pending prescriptions to dispense.</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Consultation Bills Tab */}
        {activeTab === 'bills' && (() => {
          const uniqueConsultations = Array.from(new Set(bills.map(b => b.consultation_id)));
          
          const filteredConsultations = uniqueConsultations.filter(consId => {
            const consBills = bills.filter(b => b.consultation_id === consId);
            const patient = consBills[0]?.patient_full_name || "";
            const doctor = consBills[0]?.doctor_name || "";
            const medicinesStr = consBills.map(b => b.medicine_name).join(" ").toLowerCase();
            const search = billSearch.toLowerCase();
            
            return (
              patient.toLowerCase().includes(search) ||
              doctor.toLowerCase().includes(search) ||
              medicinesStr.includes(search) ||
              consId.toString().includes(search)
            );
          });

          // Sort unpaid to top
          const sortedConsultations = [...filteredConsultations].sort((a, b) => {
             const aPaid = bills.filter(bill => bill.consultation_id === a).every(bill => bill.is_paid);
             const bPaid = bills.filter(bill => bill.consultation_id === b).every(bill => bill.is_paid);
             if (aPaid && !bPaid) return 1;
             if (!aPaid && bPaid) return -1;
             return b - a; // Secondary sort by ID desc
          });

          // Compute suggestions
          const allSuggestions = Array.from(new Set([
            ...bills.map(b => b.patient_full_name),
            ...bills.map(b => b.doctor_name),
            ...bills.map(b => b.medicine_name)
          ])).filter(Boolean);

          return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Billing Archive</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review and manage consultation payments</p>
                  </div>
                  
                  <div className="relative group w-full lg:min-w-[300px] lg:w-auto">
                     <input 
                       type="text" 
                       list="billing-suggestions"
                       placeholder="Search..." 
                       className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition-all font-bold text-sm"
                      value={billSearch}
                      onChange={(e) => setBillSearch(e.target.value)}
                    />
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-300 group-focus-within:text-medical-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <datalist id="billing-suggestions">
                      {allSuggestions.map(s => <option key={s} value={s} />)}
                    </datalist>
                 </div>
               </div>
               
               <div className="glass rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left font-medium min-w-[900px]">
                     <thead className="bg-slate-50/50 border-b border-slate-200">
                       <tr>
                          <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Inv #</th>
                          <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Patient Details</th>
                          <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Dispensed Items</th>
                          <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Bill</th>
                          <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Payment Action</th>
                       </tr>
                     </thead>
                   <tbody className="divide-y divide-slate-100">
                     {sortedConsultations.map(consId => {
                        const consBills = bills.filter(b => b.consultation_id === consId);
                        const patient = consBills[0]?.patient_full_name;
                        const patientId = consBills[0]?.patient_id;
                        const doctor = consBills[0]?.doctor_name;
                        const total = consBills.reduce((acc, b) => acc + parseFloat(b.total_amount), 0);
                        const isSettled = consBills.every(b => b.is_paid);
                        
                        return (
                          <tr key={consId} className={`hover:bg-slate-50/40 transition-colors group ${!isSettled ? 'bg-amber-50/20' : ''}`}>
                            <td className="px-6 py-5">
                               <span className="font-black text-slate-400 text-xs">C-{consId}</span>
                            </td>
                            <td className="px-6 py-5">
                               <p className="font-black text-slate-800 text-sm tracking-tight">{patient}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {patientId}</p>
                               <div className="mt-2 pt-1.5 border-t border-slate-100/50 w-full inline-flex">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Dr. {doctor}</span>
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex flex-wrap gap-1.5 justify-center">
                                 {consBills.map(b => (
                                   <span key={b.id} className="px-2 py-0.5 bg-white text-[10px] font-bold text-slate-600 rounded-md border border-slate-200/50 shadow-sm">
                                     {b.medicine_name} <span className="opacity-40 ml-1">x{b.quantity_dispensed}</span>
                                   </span>
                                 ))}
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <span className={`font-black text-sm ${!isSettled ? 'text-medical-secondary' : 'text-medical-primary'}`}>
                                 ${total.toFixed(2)}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                               {isSettled ? (
                                 <span className="inline-flex items-center text-emerald-500 font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-lg">
                                   <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                   Settled
                                 </span>
                               ) : (
                                 <button 
                                   onClick={() => {
                                     setSelectedPaymentConsId(consId);
                                     setShowPaymentConfirm(true);
                                   }}
                                   className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                                 >
                                   Collect Payment
                                 </button>
                               )}
                            </td>
                          </tr>
                        );
                     })}
                   </tbody>
                 </table>
               </div>
                 
                 {sortedConsultations.length === 0 && (
                   <div className="flex flex-col items-center justify-center p-20 text-center opacity-40">
                      <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="font-black text-slate-800 tracking-tight">No records match your search criteria</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Adjust your filters to find existing bills</p>
                   </div>
                 )}
               </div>
            </div>
          );
        })()}
      </div>

      {/* Add Medicine Modal */}
      {showAddMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Register New Medicine</h2>
              <button 
                onClick={() => setShowAddMedicine(false)}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-5">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Name</label>
                <input type="text" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-primary outline-none" 
                  onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} required placeholder="e.g. Paracetamol" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Stock</label>
                  <input type="number" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-primary outline-none" 
                    onChange={e => setNewMedicine({...newMedicine, stock_quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Min Stock</label>
                  <input type="number" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-primary outline-none" 
                    value={newMedicine.min_stock} onChange={e => setNewMedicine({...newMedicine, min_stock: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Unit</label>
                  <select className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-primary outline-none cursor-pointer" 
                    value={newMedicine.unit} onChange={e => setNewMedicine({...newMedicine, unit: e.target.value})} required>
                     <option value="mg">mg</option>
                     <option value="ml">ml</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Unit Price ($)</label>
                <input type="number" step="0.01" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-primary outline-none" 
                  onChange={e => setNewMedicine({...newMedicine, price: e.target.value})} required />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full medical-gradient text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Add to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditMedicine && selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Inventory File</h2>
              <button 
                onClick={() => setShowEditMedicine(false)}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditMedicine} className="space-y-5">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Name</label>
                <input type="text" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-slate-600" 
                  value={selectedMedicine.name} disabled />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Stock</label>
                  <input type="number" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-secondary outline-none font-bold" 
                    value={selectedMedicine.stock_quantity} onChange={e => setSelectedMedicine({...selectedMedicine, stock_quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Min Stock</label>
                  <input type="number" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-secondary outline-none font-bold" 
                    value={selectedMedicine.min_stock} onChange={e => setSelectedMedicine({...selectedMedicine, min_stock: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Unit</label>
                  <select className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-secondary outline-none cursor-pointer font-bold" 
                    value={selectedMedicine.unit} onChange={e => setSelectedMedicine({...selectedMedicine, unit: e.target.value})} required>
                     <option value="mg">mg</option>
                     <option value="ml">ml</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Unit Price ($)</label>
                <input type="number" step="0.01" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-medical-secondary outline-none font-bold" 
                  value={selectedMedicine.price} onChange={e => setSelectedMedicine({...selectedMedicine, price: e.target.value})} required />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full medical-gradient text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Update Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispensing Confirmation Modal */}
      {showConfirmDispense && selectedPrescription && (() => {
         const qty = calculateTotalQuantity(selectedPrescription.frequency, selectedPrescription.duration_days);
         const medicineDetails = medicines.find(m => m.id === selectedPrescription.medicine);
         const unitPrice = medicineDetails?.price || 0;
         const subtotal = qty * unitPrice;

         return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border-8 border-slate-50">
              <div className="w-16 h-16 mx-auto bg-medical-secondary/10 text-medical-secondary rounded-full flex items-center justify-center mb-6 border border-medical-secondary/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Verify Dispense Quantity</p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedPrescription.medicine_name}</h2>
              
              <div className="my-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200/50">
                  <div className="pb-4">
                    <div className="text-4xl font-black text-medical-secondary mb-1">
                      {qty}
                      <span className="text-lg ml-1 opacity-50 uppercase tracking-tighter">Units</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedPrescription.frequency} • {selectedPrescription.duration_days} Days
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold px-2">
                       <span className="text-slate-400">Patient</span>
                       <span className="text-slate-700">{selectedPrescription.patient_name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold px-2">
                       <span className="text-slate-400">Doctor</span>
                       <span className="text-slate-700">Dr. {selectedPrescription.doctor_name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold px-2">
                       <span className="text-slate-400">Unit Price</span>
                       <span className="text-slate-700">${parseFloat(unitPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black px-2 text-medical-primary">
                       <span>Total Estimated</span>
                       <span>${subtotal.toFixed(2)}</span>
                    </div>
                  </div>
              </div>
              
              <p className="text-xs font-bold text-slate-500 mb-8 px-4 leading-relaxed">Confirming will deduct stock and generate an invoice for {selectedPrescription.patient_name}.</p>
              
              <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirmDispense(false)}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl text-xs active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDispense(selectedPrescription, qty)}
                    className="flex-3 bg-medical-secondary text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-lg shadow-medical-secondary/20 active:scale-95 transition-all px-8"
                  >
                    Confirm & Dispense
                  </button>
              </div>
            </div>
          </div>
         );
      })()}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && selectedPaymentConsId && (() => {
        const consBills = bills.filter(b => b.consultation_id === selectedPaymentConsId && !b.is_paid);
        const patient = consBills[0]?.patient_full_name || "Unknown";
        const doctor = consBills[0]?.doctor_name || "Unknown";
        const grandTotal = consBills.reduce((acc, b) => acc + parseFloat(b.total_amount), 0);

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 relative border-8 border-slate-50">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-200">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Payment Confirmation</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Collect Payment</h2>
              </div>

              {/* Patient & Doctor Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-400">Patient</span>
                  <span className="font-black text-slate-700">{patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-400">Doctor</span>
                  <span className="font-black text-slate-700">Dr. {doctor}</span>
                </div>
              </div>

              {/* Line items breakdown */}
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Price Breakdown</p>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50/80">
                    <span className="col-span-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Medicine</span>
                    <span className="col-span-2 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Qty</span>
                    <span className="col-span-2 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Price</span>
                    <span className="col-span-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Total</span>
                  </div>
                  {/* Rows */}
                  {consBills.map(b => (
                    <div key={b.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50/40 transition-colors">
                      <span className="col-span-5 text-xs font-bold text-slate-700 truncate">{b.medicine_name}</span>
                      <span className="col-span-2 text-xs font-bold text-slate-500 text-center">{b.quantity_dispensed}</span>
                      <span className="col-span-2 text-xs font-bold text-slate-500 text-center">${parseFloat(b.price_per_unit).toFixed(2)}</span>
                      <span className="col-span-3 text-xs font-black text-slate-700 text-right">${parseFloat(b.total_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/50 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-black text-amber-800 uppercase tracking-widest text-xs">Grand Total</span>
                  <span className="text-3xl font-black text-amber-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPaymentConfirm(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleMarkAsPaid(selectedPaymentConsId)}
                  className="flex-[2] bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PharmacyDashboard;
