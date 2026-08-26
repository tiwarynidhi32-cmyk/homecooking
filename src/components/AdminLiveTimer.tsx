import React, { useEffect, useState } from 'react';
import { Clock, Flame, ShieldCheck, Copy, Check } from 'lucide-react';
import { Order } from '../types';

interface AdminLiveTimerProps {
  order: Order;
  compact?: boolean;
}

export function AdminLiveTimer({ order, compact = false }: AdminLiveTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  useEffect(() => {
    if (order.status !== 'COOKING') {
      if (order.durationSeconds) {
        setElapsedSeconds(order.durationSeconds);
      } else if (order.durationMinutes) {
        setElapsedSeconds(order.durationMinutes * 60);
      }
      return;
    }

    const calculateElapsed = () => {
      if (!order.startTime) return 0;
      const startMs = new Date(order.startTime).getTime();
      const nowMs = Date.now();
      const diff = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      return diff;
    };

    setElapsedSeconds(calculateElapsed());
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status, order.startTime, order.durationSeconds, order.durationMinutes]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const elapsedMins = Math.max(1, Math.ceil(elapsedSeconds / 60));
  const rate = order.ratePerMin || 3;
  const liveBill = order.type === 'PARTY' && order.totalAmount && order.totalAmount > (elapsedMins * rate)
    ? order.totalAmount
    : elapsedMins * rate;

  const copyOtp = () => {
    if (!order.otp) return;
    navigator.clipboard?.writeText(order.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  if (compact) {
    if (order.status === 'COOKING') {
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg text-[11px] font-mono font-black shadow-sm animate-pulse">
            <Flame size={12} className="text-yellow-300 animate-bounce" />
            <span>{formattedTime}</span>
          </div>
          <span className="text-[10px] font-black text-green-700">
            Est. ₹{liveBill} (₹{rate}/min)
          </span>
        </div>
      );
    }
    return (
      <span className="font-mono text-xs font-bold text-gray-700">
        {order.durationMinutes ? `${order.durationMinutes} mins` : order.durationSeconds ? `${Math.ceil(order.durationSeconds / 60)} mins` : '--'}
      </span>
    );
  }

  if (order.status === 'COOKING') {
    return (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-2xl shadow-md border border-red-400/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-100">Live Session Cooking</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-full text-[10px] font-mono font-bold">
            <Clock size={11} className="text-yellow-300" />
            <span>Started: {order.startTime ? new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-200 block">Elapsed Timer</span>
            <span className="text-2xl font-mono font-black text-white tracking-wider">{formattedTime}</span>
          </div>

          <div className="bg-black/30 backdrop-blur-sm p-3 rounded-xl text-right">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-200 block">Accumulated Bill</span>
            <span className="text-2xl font-black text-yellow-300">₹{liveBill}</span>
            <span className="text-[9px] text-red-200 block">@ ₹{rate}/min ({elapsedMins}m)</span>
          </div>
        </div>

        {order.otp && (
          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/90">
              <ShieldCheck size={14} className="text-yellow-300" />
              <span className="font-bold">Start OTP:</span>
              <span className="font-mono font-black tracking-widest text-yellow-300 text-sm bg-black/40 px-2 py-0.5 rounded-lg">{order.otp}</span>
            </div>
            <button
              onClick={copyOtp}
              className="text-[10px] font-bold text-white/80 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors"
            >
              {copiedOtp ? <Check size={11} className="text-green-300" /> : <Copy size={11} />}
              {copiedOtp ? 'Copied' : 'Copy OTP'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Cooking Duration</span>
        <span className="font-bold text-gray-800 text-sm">
          {order.durationMinutes ? `${order.durationMinutes} Minutes` : order.durationSeconds ? `${Math.ceil(order.durationSeconds / 60)} Minutes` : 'Not Started'}
        </span>
      </div>
      {order.otp && (
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Order OTP</span>
          <span className="font-mono font-black text-sm tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">{order.otp}</span>
        </div>
      )}
    </div>
  );
}
