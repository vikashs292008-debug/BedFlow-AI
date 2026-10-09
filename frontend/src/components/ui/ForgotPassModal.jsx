import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';

export default function ForgotPassModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Reset code sent to your email!');
        if (res.data.data?.previewUrl) {
          setPreviewUrl(res.data.data.previewUrl);
        }
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please enter OTP and new password');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        setMessage('✅ Password reset successful! You can now log in.');
        setTimeout(() => {
          onClose();
          setStep(1);
          setEmail('');
          setOtp('');
          setNewPassword('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl max-w-md w-full p-6 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Reset Password</h3>
              <p className="text-xs text-slate-400">Email Verification & Password Recovery</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-md">
              {error}
            </div>
          )}

          {previewUrl && (
            <div className="mb-4 p-3 bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-xs rounded-md">
              <p className="font-semibold mb-1">📧 Ethereal Test Mail Preview:</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-cyan-200 break-all"
              >
                {previewUrl}
              </a>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="pl-9 bg-slate-950 border-slate-700 text-white focus:border-rose-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                {loading ? 'Sending Code...' : 'Send Recovery OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">6-Digit Reset OTP Code</label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center tracking-[8px] text-lg font-mono bg-slate-950 border-slate-700 text-rose-400 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="bg-slate-950 border-slate-700 text-white focus:border-rose-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !otp || !newPassword}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
