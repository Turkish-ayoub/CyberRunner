/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Gamepad2, Languages, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highScore: number;
}

export default function Header({
  currentLang,
  onLanguageChange,
  soundEnabled,
  onToggleSound,
  highScore,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isRtl = currentLang === 'ar';

  const menuLabels = {
    en: { home: 'Home', gameplay: 'Gameplay', history: 'Lore', highScore: 'HIGH SCORE:', tagline: 'HTML5 Cyberpunk Arcade Edition 2026' },
    ar: { home: 'الرئيسية', gameplay: 'طريقة اللعب', history: 'القصة', highScore: 'أعلى نتيجة:', tagline: 'إصدار أركيد سايبر رنر ٢٠٢٦' },
    es: { home: 'Inicio', gameplay: 'Jugabilidad', history: 'Historia', highScore: 'PUNTUACIÓN MÁXIMA:', tagline: 'Edición Cyber Runner Arcade 2026' },
    fr: { home: 'Accueil', gameplay: 'Jouabilité', history: 'Histoire', highScore: 'MEILLEUR SCORE :', tagline: 'Édition Cyber Runner Arcade 2026' },
    zh: { home: '首页', gameplay: '游戏玩法', history: '背景故事', highScore: '最高得分:', tagline: '赛博跑酷街机版 2026' },
  };

  const labels = menuLabels[currentLang] || menuLabels.en;

  const menuItems = [
    { label: labels.home, href: '#home' },
    { label: labels.gameplay, href: '#gameplay' },
    { label: labels.history, href: '#history' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-4 lg:px-8 py-3 flex items-center justify-between" id="home" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 text-white p-2 rounded-lg border border-neutral-800 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </div>
        
        <div>
          <h1 className="font-mono text-xl md:text-2xl font-black tracking-wider flex items-center gap-1">
            <span className="text-cyan-400 text-neon-cyan">CYBER</span>
            <span className="text-pink-500 text-neon-pink">RUNNER</span>
            <span className="text-yellow-400 text-neon-yellow text-xs border border-yellow-400/30 px-1.5 py-0.5 rounded ml-1 bg-yellow-950/40 animate-pulse">3D</span>
          </h1>
          <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase hidden md:block">
            {labels.tagline}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
        {menuItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className="text-neutral-400 hover:text-white transition-colors hover:text-neon-cyan font-display font-medium relative group"
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full"></span>
          </a>
        ))}
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* High Score Badge */}
        <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs text-yellow-400">
          <span className="hidden sm:inline text-neutral-400 text-[10px] uppercase tracking-wider">
            {labels.highScore}
          </span>
          <span className="font-black tracking-widest">{highScore.toLocaleString()}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg border transition-all ${
            soundEnabled
              ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/50'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 transition-colors text-xs font-mono"
          >
            <Languages className="w-4 h-4 text-neutral-400" />
            <span className="uppercase">{currentLang}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden z-50">
              {[
                { code: 'en', label: 'English (US)' },
                { code: 'ar', label: 'العربية (AR)' },
                { code: 'es', label: 'Español (ES)' },
                { code: 'fr', label: 'Français (FR)' },
                { code: 'zh', label: '中文 (ZH)' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code as Language);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors hover:bg-neutral-800 ${
                    currentLang === lang.code ? 'text-cyan-400 bg-neutral-950/50' : 'text-neutral-400'
                  }`}
                  style={{ direction: lang.code === 'ar' ? 'rtl' : 'ltr' }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
