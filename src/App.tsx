/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ThreeGame from './components/ThreeGame';
import Editorial from './components/Editorial';
import { GameStatus, Language } from './types';
import { Volume2, VolumeX, Maximize2, Sparkles, Gamepad2 } from 'lucide-react';
import { gameAudio } from './utils/audio';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5); // Sleek Volume state
  const [highScore, setHighScore] = useState(1245678); // Iconic starting high score from the image, but real local storage updates it!
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');

  const [sessionStats, setSessionStats] = useState({
    score: 0,
    coins: 0,
    distance: 0,
    lives: 3,
  });

  const isRtl = currentLang === 'ar';

  const appTranslations = {
    en: {
      banner: "Play the blockbuster CyberMario 3D game online in real-time WebGL!",
      controls: "Use W, A, S, D keys or arrows [↑ → ↓ ←] to switch lanes, jump and slide.",
      platform: "PLATFORM: CYBER_PRO_3D",
      fullScreen: "FULL SCREEN",
      soundOn: "SOUND ON",
      soundOff: "SOUND OFF",
      volume: "VOLUME",
    },
    ar: {
      banner: "العب لعبة سايبر ماريو ثلاثية الأبعاد مباشرة على متصفحك!",
      controls: "استخدم مفاتيح W, A, S, D أو الأسهم [↑ → ↓ ←] للتنقل والقفز والانزلاق.",
      platform: "حالة النظام: متصل",
      fullScreen: "ملء الشاشة كاملاً",
      soundOn: "الصوت مفعّل",
      soundOff: "كتم الصوت",
      volume: "حجم الصوت",
    },
    es: {
      banner: "¡Juega al exitoso juego CyberMario 3D en línea en WebGL en tiempo real!",
      controls: "Usa las teclas W, A, S, D o las flechas [↑ → ↓ ←] para cambiar de carril, saltar y deslizarte.",
      platform: "PLATAFORMA: CYBER_PRO_3D",
      fullScreen: "PANTALLA COMPLETA",
      soundOn: "SONIDO ACTIVADO",
      soundOff: "SONIDO DESACTIVADO",
      volume: "VOLUMEN",
    },
    fr: {
      banner: "Jouez au jeu à succès CyberMario 3D en ligne en WebGL en temps réel !",
      controls: "Utilisez les touches W, A, S, D ou les flèches [↑ → ↓ ←] pour changer de voie, sauter et glisser.",
      platform: "PLATEFORME: CYBER_PRO_3D",
      fullScreen: "PLEIN ÉCRAN",
      soundOn: "SON ACTIVÉ",
      soundOff: "SON DÉSACTIVÉ",
      volume: "VOLUME",
    },
    zh: {
      banner: "在线实时 WebGL 畅玩 赛博马里奥 (CyberMario) 3D 热门游戏！",
      controls: "使用 W、A、S、D 键或方向键 [↑ → ↓ ←] 切换跑道、跳跃和滑行。",
      platform: "平台: CYBER_PRO_3D",
      fullScreen: "全屏",
      soundOn: "声音开启",
      soundOff: "静音",
      volume: "音量",
    },
  };

  const t = appTranslations[currentLang] || appTranslations.en;

  // Load High Score from localStorage on mount
  useEffect(() => {
    document.title = "CyberMario - 3D Cyberpunk Runner";
    const savedHighScore = localStorage.getItem('super_mario_3d_highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    gameAudio.volume = volume;
  }, []);

  // Update sound controller
  useEffect(() => {
    gameAudio.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    gameAudio.setSoundEnabled(newSoundState);
    if (newSoundState) {
      setVolume(0.5);
      gameAudio.volume = 0.5;
      if (gameStatus === 'RUNNING') {
        gameAudio.playBGM();
      }
    } else {
      setVolume(0);
      gameAudio.volume = 0;
      gameAudio.stopBGM();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    gameAudio.volume = val;
    if (val === 0) {
      setSoundEnabled(false);
      gameAudio.setSoundEnabled(false);
      gameAudio.stopBGM();
    } else {
      setSoundEnabled(true);
      gameAudio.setSoundEnabled(true);
      if (gameStatus === 'RUNNING') {
        gameAudio.playBGM();
      }
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
  };

  // Sync state changes from Three.js game engine
  const handleStatsChange = (updates: {
    score?: number;
    coins?: number;
    distance?: number;
    lives?: number;
    status?: GameStatus;
  }) => {
    setSessionStats((prev) => {
      const next = { ...prev };
      if (updates.score !== undefined) next.score = updates.score;
      if (updates.coins !== undefined) next.coins = updates.coins;
      if (updates.distance !== undefined) next.distance = updates.distance;
      if (updates.lives !== undefined) next.lives = updates.lives;

      // Handle High Score persistence
      if (updates.score !== undefined && updates.score > highScore) {
        setHighScore(updates.score);
        localStorage.setItem('super_mario_3d_highscore', updates.score.toString());
      }

      return next;
    });

    if (updates.status !== undefined) {
      setGameStatus(updates.status);
    }
  };

  const handleGameReset = () => {
    setSessionStats({
      score: 0,
      coins: 0,
      distance: 0,
      lives: 3,
    });
    setGameStatus('RUNNING');
  };

  const handleGameStart = () => {
    setGameStatus('RUNNING');
    gameAudio.playBGM();
  };

  // Trigger HTML5 Fullscreen on the main container inside ThreeGame
  const triggerFullScreenOnCanvas = () => {
    const gameContainer = document.querySelector('[style*="touch-action: none"]');
    if (gameContainer) {
      if (!document.fullscreenElement) {
        gameContainer.requestFullscreen().catch((err) => {
          console.error('Error enabling fullscreen from outside:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Header Section */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        highScore={highScore}
      />

      {/* Main Arcade Layout Grid */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 md:py-8 flex flex-col items-center gap-8 relative z-10">
        
        {/* Subtle decorative glowing background shapes */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* 2. Top Instructions & Game Hub (Centerpiece) */}
        <div className="w-full flex flex-col items-center gap-6 relative">
          
          {/* Top Instruction banner styled to match Screenshot 2 */}
          <div className="text-center space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-yellow-500 text-neon-yellow">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{t.banner}</span>
            </div>
            
            <p className="text-xs md:text-sm text-neutral-400 font-mono">
              <span>{t.controls}</span>
            </p>
          </div>

          {/* Center block: Perfectly Stretched Main Game Canvas */}
          <div className="w-full flex justify-center">
            
            {/* Central Embedded Console (Game view + controls) */}
            <div className="w-full max-w-6xl flex flex-col items-center gap-3">
              
              {/* The 3D Engine Component */}
              <ThreeGame
                status={gameStatus}
                soundEnabled={soundEnabled}
                currentLang={currentLang}
                onLanguageChange={handleLanguageChange}
                onStatsChange={handleStatsChange}
                onGameReset={handleGameReset}
                onGameStart={handleGameStart}
              />

              {/* Functional Control Bar directly below canvas, mirroring screenshot */}
              <div className="w-full flex flex-col md:flex-row gap-3 items-center justify-between px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-400 shadow-lg">
                
                {/* Left controls: HUD or status */}
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="uppercase text-[10px] tracking-wider text-neutral-500 font-black">
                    {t.platform}
                  </span>
                </div>

                {/* Centered: Full Screen button */}
                <button
                  onClick={triggerFullScreenOnCanvas}
                  className="px-4 py-1.5 rounded bg-cyan-950/30 hover:bg-cyan-500 hover:text-black border border-cyan-400/30 font-black tracking-widest text-[10px] uppercase transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-400 text-cyan-400"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  {t.fullScreen}
                </button>

                {/* Right controls: Integrated Volume range slider + Sound state */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSound}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-[10px] tracking-wider font-black uppercase text-pink-500 text-neon-pink"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                        <span className="hidden sm:inline">{t.soundOn}</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="hidden sm:inline text-neutral-500">{t.soundOff}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800/85 px-2.5 py-1 rounded-lg">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                      {t.volume}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 md:w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500 text-neon-pink"
                      style={{ outline: 'none' }}
                    />
                    <span className="text-[9px] font-black text-neutral-300 w-8 text-right font-mono">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Divider separator */}
        <div className="w-full border-t border-neutral-800/80 my-4"></div>

        {/* 4. Editorial Content & Guide Sections (Below the fold) */}
        <Editorial isRtl={isRtl} />

      </main>
    </div>
  );
}
