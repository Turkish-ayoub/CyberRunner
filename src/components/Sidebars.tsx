/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Star, ShoppingCart } from 'lucide-react';

interface SidebarAdProps {
  side: 'left' | 'right';
  isRtl: boolean;
}

export function SidebarAd({ side, isRtl }: SidebarAdProps) {
  return (
    <div className="hidden xl:flex flex-col h-[600px] w-48 bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 sticky top-24 shrink-0 overflow-hidden relative group">
      {/* Glow highlight */}
      <div className={`absolute -inset-1 bg-gradient-to-b ${
        side === 'left' ? 'from-cyan-500/10 to-transparent' : 'from-pink-500/10 to-transparent'
      } opacity-50 group-hover:opacity-100 transition duration-300`}></div>

      <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
        {/* Ad Indicator */}
        <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-600 border border-neutral-800/80 px-2 py-0.5 rounded-full bg-neutral-900/50">
          {isRtl ? 'إعلان ممول' : 'ADVERTISEMENT'}
        </div>

        {/* Ad Content */}
        <div className="flex flex-col items-center gap-4 my-auto">
          <div className={`w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative ${
            side === 'left' ? 'border-neon-cyan' : 'border-neon-pink'
          }`}>
            {side === 'left' ? (
              <Flame className="w-8 h-8 text-cyan-400 animate-pulse" />
            ) : (
              <Star className="w-8 h-8 text-pink-400 animate-bounce" />
            )}
          </div>
          
          <div>
            <h4 className="font-display font-bold text-sm text-neutral-200">
              {side === 'left' 
                ? (isRtl ? 'مدينة النيون المحرمة' : "FORBIDDEN NEON CITY")
                : (isRtl ? 'مشروب نيترو سايبربانك' : "CYBER NITRO ELIXIR")
              }
            </h4>
            <p className="text-xs text-neutral-500 mt-2">
              {side === 'left'
                ? (isRtl ? 'العب مغامرة النيون المفتوحة مجاناً!' : 'Explore neon-drenched cyber highways now!')
                : (isRtl ? 'طاقة إضافية بنكهة الليزر الخارق!' : 'Boost running speed with 100% ionized plasma!')
              }
            </p>
          </div>

          <button className={`mt-2 px-4 py-1.5 rounded-lg font-mono text-[10px] font-black border transition-all flex items-center gap-1.5 ${
            side === 'left'
              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black'
              : 'bg-pink-950/40 border-pink-500/30 text-pink-400 hover:bg-pink-500 hover:text-black'
          }`}>
            <ShoppingCart className="w-3.5 h-3.5" />
            {isRtl ? 'احصل عليه' : 'PLAY NOW'}
          </button>
        </div>

        {/* Technical/Slot Indicator */}
        <div className="text-[9px] font-mono text-neutral-700 tracking-wider">
          {side === 'left' ? 'SLOT_01_BANNER_L' : 'SLOT_02_BANNER_R'}
        </div>
      </div>
    </div>
  );
}

interface BottomAdProps {
  isRtl: boolean;
}

export function BottomAd({ isRtl }: BottomAdProps) {
  return (
    <div className="w-full max-w-4xl bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 md:p-4 relative overflow-hidden group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/5 via-pink-500/5 to-transparent opacity-75 blur"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div className="text-[9px] uppercase font-mono tracking-widest text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded bg-neutral-900">
            {isRtl ? 'إعلان' : 'AD'}
          </div>
          <div className="text-left">
            <h4 className="font-display font-black text-sm text-yellow-400 tracking-wide text-neon-yellow">
              {isRtl ? 'بطولة سباق سايبر رنر ٢٠٢٦' : 'OFFICIAL CYBER RUNNER 2026 WORLD CUP'}
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isRtl 
                ? 'سجل الآن للمنافسة في حلبة النيون الكبرى واربح ١٠,٠٠٠ عملة ذهبية!'
                : 'Sign up to compete on the Neon Superhighway with 3D real-time controls. Grand prize: 10,000 gold coins!'
              }
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button className="px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-mono text-xs font-black tracking-widest transition-all hover:scale-105 shrink-0">
          {isRtl ? 'سجل مجاناً' : 'REGISTER FREE'}
        </button>
      </div>
    </div>
  );
}
