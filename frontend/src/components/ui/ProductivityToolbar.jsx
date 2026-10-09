import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Sparkles, Clock, AlertTriangle, Send, CheckCircle2, UserPlus, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import api from '@/services/api';

export default function ProductivityToolbar({ onRefreshNeeded }) {
  const [activeTab, setActiveTab] = useState(null); // 'admission' | 'cleaning' | 'transfer' | 'alerts'
  const [beds, setBeds] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Admission form state
  const [selectedBed, setSelectedBed] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [predictedStay, setPredictedStay] = useState('3');

  // Cleaning state
  const [cleaningBed, setCleaningBed] = useState('');
  const [cleaningStaff, setCleaningStaff] = useState('Staff 1');

  // Transfer state
  const [targetHospital, setTargetHospital] = useState('');
  const [transferWard, setTransferWard] = useState('ICU');
  const [transferPriority, setTransferPriority] = useState('Urgent');

  useEffect(() => {
    fetchBeds();
    fetchHospitals();
    fetchAlerts();
  }, []);

  const fetchBeds = async () => {
    try {
      const res = await api.get('/beds');
      if (res.data.success) {
        setBeds(res.data.data.beds || []);
      }
    } catch (err) {
      console.error('Fetch beds error:', err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/referrals/hospitals');
      if (res.data.success) {
        setHospitals(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch hospitals error:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      if (res.data.success) {
        setAlerts(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
    }
  };

  const handlePatientAdmission = async (e) => {
    e.preventDefault();
    if (!selectedBed || !patientName) return;
    setLoading(true);
    try {
      const res = await api.patch(`/beds/${selectedBed}/status`, {
        status: 'occupied',
        patientName,
        patientId: patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`
      });
      if (res.data.success) {
        setStatusMsg(`✅ Patient ${patientName} admitted to bed ${selectedBed}!`);
        setSelectedBed('');
        setPatientName('');
        setPatientId('');
        fetchBeds();
        if (onRefreshNeeded) onRefreshNeeded();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      setStatusMsg('❌ Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCleaning = async (e) => {
    e.preventDefault();
    if (!cleaningBed) return;
    setLoading(true);
    try {
      const res = await api.patch(`/beds/${cleaningBed}/status`, {
        status: 'cleaning'
      });
      if (res.data.success) {
        setStatusMsg(`🧼 Bed ${cleaningBed} is now marked as CLEANING! Task dispatched.`);
        setCleaningBed('');
        fetchBeds();
        if (onRefreshNeeded) onRefreshNeeded();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      setStatusMsg('❌ Failed to start cleaning');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchTransfer = async (e) => {
    e.preventDefault();
    if (!targetHospital) return;
    setLoading(true);
    try {
      const res = await api.post('/emergency-requests', {
        targetHospital,
        ward: transferWard,
        priority: transferPriority,
        notes: `Urgent patient transfer request (${transferPriority} priority)`
      });
      if (res.data.success) {
        setStatusMsg(`🚀 Emergency transfer request dispatched to hospital!`);
        setTargetHospital('');
        fetchAlerts();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      setStatusMsg('❌ Transfer dispatch completed');
      setTimeout(() => setStatusMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span>BedFlow AI Productivity Center</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === 'admission' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'admission' ? null : 'admission')}
            className="text-xs gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick Admission</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'cleaning' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'cleaning' ? null : 'cleaning')}
            className="text-xs gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Housekeeping Dispatch</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'transfer' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'transfer' ? null : 'transfer')}
            className="text-xs gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Send className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Transfer</span>
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-4 p-2.5 bg-cyan-950/80 border border-cyan-700 text-cyan-300 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'admission' && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handlePatientAdmission}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800"
          >
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Available Bed</label>
              <Select value={selectedBed} onValueChange={setSelectedBed}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Choose Bed" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs max-h-48">
                  {beds.filter(b => b.status === 'available').map(b => (
                    <SelectItem key={b._id || b.bedId} value={b.bedId}>
                      Bed {b.bedId} ({b.ward})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Patient Full Name</label>
              <Input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="bg-slate-900 border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Est. Stay Duration (Days)</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={predictedStay}
                onChange={(e) => setPredictedStay(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading || !selectedBed || !patientName}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                {loading ? 'Admitting...' : 'Admit & Allocate Bed'}
              </Button>
            </div>
          </motion.form>
        )}

        {activeTab === 'cleaning' && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleStartCleaning}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800"
          >
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Select Bed to Clean</label>
              <Select value={cleaningBed} onValueChange={setCleaningBed}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Choose Bed" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs max-h-48">
                  {beds.map(b => (
                    <SelectItem key={b._id || b.bedId} value={b.bedId}>
                      Bed {b.bedId} ({b.ward} - {b.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Assigned Housekeeper</label>
              <Input
                type="text"
                value={cleaningStaff}
                onChange={(e) => setCleaningStaff(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading || !cleaningBed}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                {loading ? 'Dispatching...' : 'Dispatch Housekeeping'}
              </Button>
            </div>
          </motion.form>
        )}

        {activeTab === 'transfer' && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleDispatchTransfer}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800"
          >
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Hospital</label>
              <Select value={targetHospital} onValueChange={setTargetHospital}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Select Hospital" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                  <SelectItem value="Apollo Hospitals">Apollo Hospitals (2.5 km)</SelectItem>
                  <SelectItem value="Fortis Hospital">Fortis Hospital (5.2 km)</SelectItem>
                  <SelectItem value="Max Super Speciality">Max Super Speciality (3.8 km)</SelectItem>
                  <SelectItem value="AIIMS Delhi">AIIMS Delhi (7.1 km)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Requested Ward</label>
              <Select value={transferWard} onValueChange={setTransferWard}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                  <SelectItem value="ICU">ICU Ward</SelectItem>
                  <SelectItem value="Emergency">Emergency Ward</SelectItem>
                  <SelectItem value="General">General Ward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Transfer Priority</label>
              <Select value={transferPriority} onValueChange={setTransferPriority}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                  <SelectItem value="Critical">🔴 Critical / Immediate</SelectItem>
                  <SelectItem value="Urgent">🟠 Urgent (High)</SelectItem>
                  <SelectItem value="Normal">🟢 Normal Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading || !targetHospital}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                {loading ? 'Sending...' : 'Dispatch Transfer Alert'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
