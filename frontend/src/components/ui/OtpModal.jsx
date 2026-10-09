import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, RefreshCw, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';

export default function OtpModal({ isOpen, onClose, email, onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setMessage('✅ Email verified successfully!');
        if (res.data.data?.token) {
          localStorage.setItem('authToken', res.data.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.data.user));
        }
        setTimeout(() => {
          onVerified(res.data.data);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/send-otp', { email });
      setMessage('New verification code sent to your email!');
      if (res.data.data?.previewUrl) {
        setPreviewUrl(res.data.data.previewUrl);
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResending(false);
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
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Verify Your Email</h3>
              <p className="text-xs text-slate-400">Code sent to <span className="text-cyan-400 font-medium">{email}</span></p>
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

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Enter 6-Digit OTP Code</label>
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center tracking-[10px] text-xl font-mono bg-slate-950 border-slate-700 text-cyan-400 focus:border-cyan-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
            >
              {loading ? 'Verifying...' : 'Confirm & Verify Email'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Didn't receive code? Resend OTP</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
