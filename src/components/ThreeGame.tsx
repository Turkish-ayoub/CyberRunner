/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameStatus, Lane, GameEntity, ObstacleType, Language } from '../types';
import { gameAudio } from '../utils/audio';
import { PowerUpHUD, PowerUpType } from './PowerUpManager';
import { NeonMenuBackground } from './NeonMenuBackground';
import { storage } from '../utils/storage';
import { playRewardedAd, playInterstitialAd, shouldPlayInterstitial, gameAdManager } from '../utils/monetization';
import {
  createBrickTexture,
  createPipeTexture,
  createQuestionBlockTexture,
  createCoinTexture,
} from '../utils/textures';
import { Play, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Gamepad2, Pause, Music, ShoppingBag, ArrowLeft, Settings, Map, Lock, Trophy, Heart } from 'lucide-react';
import { ShopShowcase, buildSmoothCyberCharacter } from './ShopShowcase';

// Character avatar thumbnails imports (cyber-styled generated artworks)
import marioRedImg from '../assets/images/mario_red.png';
import marioBlueImg from '../assets/images/mario_blue.png';
import luigiGreenImg from '../assets/images/luigi_green.png';
import warioYellowImg from '../assets/images/wario_yellow.png';
import gorillaImg from '../assets/images/gorilla.png';
import peachImg from '../assets/images/peach.png';
import daisyImg from '../assets/images/daisy.png';
import rosalinaImg from '../assets/images/rosalina.png';

interface ThreeGameProps {
  status: GameStatus;
  soundEnabled: boolean;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onStatsChange: (updates: {
    score?: number;
    coins?: number;
    distance?: number;
    lives?: number;
    status?: GameStatus;
  }) => void;
  onGameReset: () => void;
  onGameStart: () => void;
}

export const CHARACTER_ROSTER = [
  {
    id: 'red_mario',
    name: 'Cyber Runner Red',
    description: 'The legendary cybernetic speedster of Neo-Tokyo. Default operative.',
    price: 0,
    color: '#e60012',
    accentColor: '#0035bb',
    image: 'mario_red.png',
    thumbnail: marioRedImg,
  },
  {
    id: 'blue_mario',
    name: 'Cobalt Operative',
    description: 'Optimized with cyber-boosted agility modules and cobalt alloys.',
    price: 15000,
    color: '#0035bb',
    accentColor: '#00c3c3',
    image: 'mario_blue.png',
    thumbnail: marioBlueImg,
  },
  {
    id: 'green_mario',
    name: 'Emerald Striker',
    description: 'Precision-tuned for ultra-high jumps and hover maneuvers.',
    price: 20500,
    color: '#22c55e',
    accentColor: '#102060',
    image: 'luigi_green.png',
    thumbnail: luigiGreenImg,
  },
  {
    id: 'yellow_mario',
    name: 'Solar Vanguard',
    description: 'Greedy and heavy-set, built with gold-plated composite plating.',
    price: 40000,
    color: '#eab308',
    accentColor: '#6d28d9',
    image: 'wario_yellow.png',
    thumbnail: warioYellowImg,
  },
  {
    id: 'cyber_gorilla',
    name: 'Mecha Cyber Titan',
    description: 'Unleash brute force! Heavy-duty cybernetic cyber-titan build.',
    price: 60000,
    color: '#5c4033',
    accentColor: '#3e2723',
    image: 'gorilla.png',
    thumbnail: gorillaImg,
  },
  {
    id: 'princess_peach',
    name: 'Princess Nova',
    description: 'Premium neon cyber-monarch. Elegant pink neon light aesthetics.',
    price: 80000,
    color: '#ff1493',
    accentColor: '#ffb6c1',
    image: 'peach.png',
    thumbnail: peachImg,
  },
  {
    id: 'princess_daisy',
    name: 'Solar Valkyrie',
    description: 'High-octane energetic visual model. Dynamic orange/yellow flow.',
    price: 100000,
    color: '#ff6600',
    accentColor: '#ffcc00',
    image: 'daisy.png',
    thumbnail: daisyImg,
  },
  {
    id: 'rosalina',
    name: 'Cosmic Astral Operative',
    description: 'Cosmic goddess. Shines with platinum blonde and cosmic teal shaders.',
    price: 125000,
    color: '#00acc1',
    accentColor: '#e0f7fa',
    image: 'rosalina.png',
    thumbnail: rosalinaImg,
  }
];

export const CONSUMABLES_LIST = [
  {
    id: 'hearts',
    name: 'Extra Heart (Life)',
    description: 'Instantly revive on crash. Skips ad requirement.',
    price: 500,
    color: '#ef4444',
    accentColor: '#ec4899',
    icon: '❤️',
  },
  {
    id: 'shields',
    name: 'Cyber-Shield',
    description: 'Temporary 10s invincibility. Double score multiplier.',
    price: 1000,
    color: '#06b6d4',
    accentColor: '#3b82f6',
    icon: '🛡️',
  },
  {
    id: 'magnets',
    name: 'Data-Magnet',
    description: 'Pull golden coins towards you automatically for 10s.',
    price: 800,
    color: '#eab308',
    accentColor: '#ca8a04',
    icon: '🧲',
  },
];

interface ThreeCharacterPreviewProps {
  charId: string;
  color: string;
  accentColor: string;
}

const ThreeCharacterPreview: React.FC<ThreeCharacterPreviewProps> = ({ charId, color, accentColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 200;
    const height = containerRef.current.clientHeight || 150;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.0, 2.2);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 0.9);
    dirLight.position.set(1.5, 3.5, 2.5);
    scene.add(dirLight);

    const spotLight = new THREE.SpotLight(accentColor || color || 0x00f0ff, 2.5, 8, Math.PI / 4, 0.35, 1.2);
    spotLight.position.set(0, 3.0, 2.0);
    spotLight.target.position.set(0, 0.6, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x151520, metalness: 0.8, roughness: 0.2 })
    );
    pedestal.position.set(0, -0.05, 0);
    scene.add(pedestal);

    const charGroup = new THREE.Group();
    charGroup.position.set(0, 0, 0);
    buildSmoothCyberCharacter(charGroup, charId, color, accentColor);
    scene.add(charGroup);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      charGroup.rotation.y += 0.012;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [charId, color, accentColor]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[140px] flex items-center justify-center relative bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 rounded-xl overflow-hidden"
    />
  );
};

interface CharacterThumbnailProps {
  charId: string;
  name: string;
  color: string;
  accentColor: string;
}

const CharacterThumbnail: React.FC<CharacterThumbnailProps> = ({ charId, name, color, accentColor }) => {
  return (
    <div 
      className="relative w-full aspect-square md:aspect-[4/3] rounded-xl overflow-hidden border flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 transition-all duration-300 group shadow-lg"
      style={{
        borderColor: `${color}40`,
        boxShadow: `0 0 15px ${color}15, inset 0 0 10px ${color}10`,
      }}
    >
      <ThreeCharacterPreview charId={charId} color={color} accentColor={accentColor} />

      <div className="absolute bottom-0 left-0 right-0 bg-neutral-950/85 backdrop-blur-sm py-1 border-t border-white/5 flex items-center justify-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span className="text-[8px] text-neutral-400 font-mono tracking-widest uppercase">
          SYNC CHARACTER MODULE
        </span>
      </div>

      <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
    </div>
  );
};

interface ThreeMapPreviewProps {
  mapId: number;
  theme: MapTheme;
  isUnlocked: boolean;
  isActive: boolean;
}

const ThreeMapPreview: React.FC<ThreeMapPreviewProps> = ({ mapId, theme, isUnlocked, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // If the map is locked, do NOT instantiate Three.js at all. 
  // Return a super lightweight, high-performance, beautiful 2D CSS-designed preview!
  if (!isUnlocked) {
    return (
      <div className="w-full h-[64px] rounded-lg border border-neutral-900/60 bg-neutral-950/20 relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 to-neutral-950/60" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:8px_8px]" />
        <span className="text-[11px] text-neutral-700 font-mono font-black tracking-widest uppercase relative z-10">LOCKED</span>
      </div>
    );
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 100;
    const height = containerRef.current.clientHeight || 70;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.fogColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10);
    camera.position.set(0, 0.9, 2.2);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    // Explicitly style the canvas element to prevent any CSS reset or flex shrink/stretch warping
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity * 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(theme.dirColor, theme.dirIntensity);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);

    const trackMat = new THREE.MeshStandardMaterial({
      color: theme.sidePlatform,
      roughness: 0.4,
      metalness: theme.variant === 2 ? 0.9 : 0.2
    });

    const trackGeom = new THREE.BoxGeometry(0.8, 0.1, 2.5);
    const trackMesh = new THREE.Mesh(trackGeom, trackMat);
    trackMesh.position.set(0, -0.05, 0);
    previewGroup.add(trackMesh);

    const borderMat = new THREE.MeshBasicMaterial({ color: theme.neonBorder });
    const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.5), borderMat);
    borderL.position.set(-0.42, 0, 0);
    const borderR = borderL.clone();
    borderR.position.x = 0.42;
    previewGroup.add(borderL);
    previewGroup.add(borderR);

    if (mapId === 1) {
      const gridHelper = new THREE.GridHelper(2, 8, theme.neonBorder, theme.neonPink);
      gridHelper.position.set(0, 0.01, 0);
      previewGroup.add(gridHelper);

      const pillarMat = new THREE.MeshStandardMaterial({ color: theme.neonPink, emissive: theme.neonPink, emissiveIntensity: 0.5 });
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), pillarMat);
      p1.position.set(-0.55, 0.4, -0.5);
      const p2 = p1.clone();
      p2.position.set(0.55, 0.4, 0.2);
      previewGroup.add(p1);
      previewGroup.add(p2);
    } else if (mapId === 2) {
      trackMat.color.set('#1a1a1a');
      trackMat.roughness = 0.9;

      const lavaMat = new THREE.MeshBasicMaterial({ color: '#ff4500' });
      const lavaL = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.5), lavaMat);
      lavaL.rotation.x = -Math.PI / 2;
      lavaL.position.set(-0.6, -0.04, 0);
      const lavaR = lavaL.clone();
      lavaR.position.x = 0.6;
      previewGroup.add(lavaL);
      previewGroup.add(lavaR);

      const rockMat = new THREE.MeshStandardMaterial({ color: '#2b1108', roughness: 0.9 });
      const rockGeom = new THREE.ConeGeometry(0.12, 0.6, 5);
      const rock1 = new THREE.Mesh(rockGeom, rockMat);
      rock1.position.set(-0.6, 0.25, -0.4);
      const rock2 = rock1.clone();
      rock2.position.set(0.6, 0.25, 0.3);
      previewGroup.add(rock1);
      previewGroup.add(rock2);
    } else if (mapId === 3) {
      trackMat.color.set('#ffd700');
      trackMat.metalness = 0.9;
      trackMat.roughness = 0.1;

      const pyrGeom = new THREE.ConeGeometry(0.2, 0.4, 4);
      const pyrMat = new THREE.MeshStandardMaterial({ color: '#bfa343', roughness: 0.6 });
      const pyr1 = new THREE.Mesh(pyrGeom, pyrMat);
      pyr1.position.set(-0.6, 0.15, -0.6);
      const pyr2 = pyr1.clone();
      pyr2.position.set(0.6, 0.15, -0.2);
      previewGroup.add(pyr1);
      previewGroup.add(pyr2);
    } else if (mapId === 4) {
      trackMat.color.set('#001a33');
      const waterMat = new THREE.MeshBasicMaterial({ color: '#00ffcc', transparent: true, opacity: 0.3 });
      const waterOverlay = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.5), waterMat);
      waterOverlay.rotation.x = -Math.PI / 2;
      waterOverlay.position.set(0, 0.05, 0);
      previewGroup.add(waterOverlay);

      const coralMat = new THREE.MeshStandardMaterial({ color: '#ff00aa', emissive: '#aa0077' });
      const coral = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 12), coralMat);
      coral.position.set(-0.55, 0.2, -0.3);
      previewGroup.add(coral);
    } else if (mapId === 5) {
      trackMat.color.set('#1a2608');
      const sludgeMat = new THREE.MeshBasicMaterial({ color: '#39ff14' });
      const sludge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.5), sludgeMat);
      sludge.rotation.x = -Math.PI / 2;
      sludge.position.set(-0.55, -0.04, 0);
      previewGroup.add(sludge);

      const barrelMat = new THREE.MeshStandardMaterial({ color: '#2a5a14', roughness: 0.3 });
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), barrelMat);
      barrel.position.set(0.55, 0.12, -0.1);
      previewGroup.add(barrel);
    } else if (mapId === 6) {
      trackMat.color.set('#80b3ff');
      trackMat.roughness = 0.05;
      trackMat.metalness = 0.5;

      const iceMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#00ffff',
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1
      });
      const iceGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
      const tower1 = new THREE.Mesh(iceGeom, iceMat);
      tower1.position.set(-0.6, 0.35, -0.5);
      const tower2 = tower1.clone();
      tower2.position.set(0.6, 0.35, 0.2);
      previewGroup.add(tower1);
      previewGroup.add(tower2);
    } else if (mapId === 7) {
      trackMat.color.set('#120526');
      trackMat.roughness = 0.8;

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#2a124d', roughness: 0.9 });
      const pGeom = new THREE.BoxGeometry(0.1, 0.6, 0.1);
      const pil1 = new THREE.Mesh(pGeom, pillarMat);
      pil1.position.set(-0.55, 0.25, -0.4);
      const pil2 = pil1.clone();
      pil2.position.set(0.55, 0.25, 0.2);
      previewGroup.add(pil1);
      previewGroup.add(pil2);

      const fenceMat = new THREE.MeshBasicMaterial({ color: '#7f00ff', transparent: true, opacity: 0.5 });
      const fenceL = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 2.5), fenceMat);
      fenceL.position.set(-0.45, 0.2, 0);
      const fenceR = fenceL.clone();
      fenceR.position.x = 0.45;
      previewGroup.add(fenceL);
      previewGroup.add(fenceR);
    } else if (mapId === 8) {
      trackMat.color.set('#5c3a21');
      trackMat.roughness = 0.7;

      const cloudMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 });
      const cloudGeom = new THREE.SphereGeometry(0.18, 8, 8);
      const cl1 = new THREE.Mesh(cloudGeom, cloudMat);
      cl1.position.set(-0.65, 0.1, -0.3);
      const cl2 = cl1.clone();
      cl2.position.set(0.65, 0.15, 0.4);
      previewGroup.add(cl1);
      previewGroup.add(cl2);
    } else if (mapId === 9) {
      trackMat.color.set('#000000');
      trackMat.roughness = 0.9;

      const stripeColors = ['#ff0000', '#ffaa00', '#ffff00', '#00ff00', '#00ffff', '#7f00ff'];
      stripeColors.forEach((color, idx) => {
        const stripeMat = new THREE.MeshBasicMaterial({ color });
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 2.5), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(-0.35 + idx * 0.14, 0.01, 0);
        previewGroup.add(stripe);
      });
    } else if (mapId === 10) {
      trackMat.color.set('#1a000d');
      trackMat.roughness = 0.9;

      const magmaMat = new THREE.MeshBasicMaterial({ color: '#ff0000' });
      const magmaL = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.5), magmaMat);
      magmaL.rotation.x = -Math.PI / 2;
      magmaL.position.set(-0.6, -0.04, 0);
      previewGroup.add(magmaL);

      const spikeMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.8 });
      const spikeGeom = new THREE.ConeGeometry(0.08, 0.5, 4);
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      spike.position.set(0.55, 0.2, -0.2);
      previewGroup.add(spike);
    }

    let animationId: number;
    let t = 0;
    const animate = () => {
      // If the map preview is NOT active, do not request any animation frames.
      // Simply render once and stop!
      if (!isActive) {
        renderer.render(scene, camera);
        return;
      }
      
      animationId = requestAnimationFrame(animate);
      t += 0.01;
      previewGroup.rotation.y = Math.sin(t) * 0.15;
      previewGroup.position.z = Math.cos(t * 0.5) * 0.08;
      renderer.render(scene, camera);
    };
    
    // Kick off animation/render
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      
      // If not animating, render the resized view once
      if (!isActive) {
        renderer.render(scene, camera);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mapId, theme, isUnlocked, isActive]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[64px] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 relative shadow-inner"
    />
  );
};



const TRANSLATIONS = {
  en: {
    title: "CYBER RUNNER",
    subtitle: "3D CYBERPUNK RUNNER",
    description: "Experience AAA-quality WebGL rendering in Neo-Tokyo. Dodge neon barriers, grab floating data cubes, and set the ultimate high score!",
    play: "START RUNNING",
    settings: "GAME CONFIG",
    shop: "GOLDEN SHOP",
    bgmVolume: "BGM VOLUME",
    sfxVolume: "SFX VOLUME",
    language: "SELECT LANGUAGE",
    back: "BACK TO MENU",
    shopSoon: "SHOP LOADING SOON...",
    shopDesc: "Unlock premium characters, neon themes, and legendary power-ups using your collected Golden Coins!",
    score: "SCORE",
    coins: "COINS",
    distance: "DISTANCE",
    lives: "LIVES",
    paused: "GAME PAUSED",
    resume: "RESUME GAME",
    restart: "RESTART GAME",
    returnMenu: "RETURN TO MENU",
    gameover: "GAME OVER",
    continueReplay: "CONTINUE / REPLAY",
    jump: "▲ Jump",
    slide: "▼ Slide",
    lanes: "◀ ▶ Lanes",
    activeEffects: "SHIELD ACTIVE",
    pauseBtn: "PAUSE",
  },
  ar: {
    title: "سايبر رانر",
    subtitle: "عدّاء السايبربانك ثلاثي الأبعاد",
    description: "اختبر مهارات الأركيد الأسطورية في عالم نيون ثلاثي الأبعاد فائق السرعة. تفادى حواجز النيون واجمع مكعبات البيانات!",
    play: "ابدأ اللعب الآن",
    settings: "خيارات اللعبة",
    shop: "متجر الذهب",
    bgmVolume: "الموسيقى الخلفية",
    sfxVolume: "المؤثرات الصوتية",
    language: "اختر اللغة",
    back: "العودة للقائمة",
    shopSoon: "المتجر يفتح قريباً...",
    shopDesc: "افتح شخصيات ممتازة، سمات نيون، وقدرات خارقة أسطورية باستخدام عملاتك الذهبية المجموعة!",
    score: "النتيجة",
    coins: "العملات",
    distance: "المسافة",
    lives: "القلوب",
    paused: "تم الإيقاف مؤقتاً",
    resume: "استئناف اللعب",
    restart: "إعادة التشغيل",
    returnMenu: "العودة للقائمة الرئيسية",
    gameover: "انتهت اللعبة",
    continueReplay: "إعادة المحاولة",
    jump: "▲ القفز",
    slide: "▼ الانزلاق",
    lanes: "◀ ▶ الحارات",
    activeEffects: "الدرع نشط",
    pauseBtn: "إيقاف مؤقت",
  },
  es: {
    title: "CYBER RUNNER",
    subtitle: "CORREDOR CYBERPUNK 3D",
    description: "Experimenta un renderizado WebGL de calidad AAA en Neo-Tokyo. ¡Esquiva barreras de neón, atrapa cubos de datos y consigue el récord!",
    play: "EMPEZAR JUEGO",
    settings: "CONFIGURACIÓN",
    shop: "TIENDA DORADA",
    bgmVolume: "VOLUMEN BGM",
    sfxVolume: "VOLUMEN SFX",
    language: "SELECCIONAR IDIOMA",
    back: "VOLVER AL MENÚ",
    shopSoon: "TIENDA DISPONIBLE PRONTO...",
    shopDesc: "¡Desbloquea personajes premium, temas de neón y potenciadores legendarios con tus Monedas de Oro recolectadas!",
    score: "PUNTUACIÓN",
    coins: "MONEDAS",
    distance: "DISTANCIA",
    lives: "VIDAS",
    paused: "JUEGO PAUSADO",
    resume: "REANUDAR JUEGO",
    restart: "REINICIAR JUEGO",
    returnMenu: "VOLVER AL MENÚ",
    gameover: "JUEGO TERMINADO",
    continueReplay: "REPRODUCIR / CONTINUAR",
    jump: "▲ Saltar",
    slide: "▼ Deslizar",
    lanes: "◀ ▶ Carriles",
    activeEffects: "ESCUDO ACTIVO",
    pauseBtn: "PAUSA",
  },
  fr: {
    title: "CYBER RUNNER",
    subtitle: "COURSE CYBERPUNK 3D",
    description: "Découvrez un rendu WebGL de qualité AAA à Neo-Tokyo. Évitez les barrières néon, attrapez les cubes de données et établissez le record ultime !",
    play: "COMMENCER LE JEU",
    settings: "RÉGLAGES",
    shop: "BOUTIQUE D'OR",
    bgmVolume: "VOLUME BGM",
    sfxVolume: "VOLUME SFX",
    language: "CHOISIR LA LANGUE",
    back: "RETOUR AU MENU",
    shopSoon: "BOUTIQUE BIENTÔT DISPONIBLE...",
    shopDesc: "Débloquez des personnages premiums, des thèmes néons et des bonus légendaires grâce aux pièces d'or collectées !",
    score: "SCORE",
    coins: "PIÈCES",
    distance: "DISTANCE",
    lives: "VIES",
    paused: "JEU EN PAUSE",
    resume: "REPRENDRE LE JEU",
    restart: "RECOMMENCER",
    returnMenu: "RETOUR AU MENU",
    gameover: "PARTIE TERMINÉE",
    continueReplay: "CONTINUER / REJOUER",
    jump: "▲ Sauter",
    slide: "▼ Glisser",
    lanes: "◀ ▶ Voies",
    activeEffects: "BOUCLIER ACTIF",
    pauseBtn: "PAUSE",
  },
  zh: {
    title: "赛博跑酷 (CYBER RUNNER)",
    subtitle: "3D 赛博朋克跑酷游戏",
    description: "体验新东京 (Neo-Tokyo) 风格的 AAA 级 WebGL 渲染跑酷。躲避霓虹屏障，撞击数据立方体，创造终极高分！",
    play: "开始游戏",
    settings: "游戏设置",
    shop: "黄金商店",
    bgmVolume: "背景音乐音量",
    sfxVolume: "动作音效音量",
    language: "选择语言",
    back: "返回主菜单",
    shopSoon: "商店即将开业...",
    shopDesc: "使用收集到的金币解锁高级角色、霓虹主题和传奇道具！",
    score: "得分",
    coins: "金币",
    distance: "距离",
    lives: "生命值",
    paused: "游戏已暂停",
    resume: "继续游戏",
    restart: "重新开始",
    returnMenu: "返回主菜单",
    gameover: "游戏结束",
    continueReplay: "继续 / 重新开始",
    jump: "▲ 跳跃",
    slide: "▼ 下铲",
    lanes: "◀ ▶ 换道",
    activeEffects: "护盾处于激活状态",
    pauseBtn: "暂停",
  }
};

interface MapTheme {
  name: string;
  subtitle: string;
  variant: number; // 0, 1, or 2 (visual mesh child index to show)
  topColor: string;
  midColor: string;
  bottomColor: string;
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  ambientIntensity: number;
  dirColor: string;
  dirIntensity: number;
  rimColor: string;
  rimIntensity: number;
  neonBorder: string;
  neonPink: string;
  pipeColor: string;
  pipeEmissive: string;
  sidePlatform: string;
}

const MAP_THEMES: Record<number, MapTheme> = {
  1: {
    name: "CYBER NEON METROPOLIS",
    subtitle: "WORLD 1-1: ELECTRIC HIGHWAY",
    variant: 0,
    topColor: '#04010d', midColor: '#100523', bottomColor: '#cc124d',
    fogColor: '#1a0a2a', fogDensity: 0.015,
    ambientColor: '#ffccff', ambientIntensity: 0.35,
    dirColor: '#ff5500', dirIntensity: 2.2,
    rimColor: '#bf00ff', rimIntensity: 1.5,
    neonBorder: '#00ffff', neonPink: '#ff00ff',
    pipeColor: '#00c325', pipeEmissive: '#003300',
    sidePlatform: '#120a1c'
  },
  2: {
    name: "LAVA OBSIDIAN CAVERN",
    subtitle: "WORLD 2-1: MOLTEN DEPTHS",
    variant: 1,
    topColor: '#100200', midColor: '#2c0500', bottomColor: '#e63900',
    fogColor: '#3d0c02', fogDensity: 0.018,
    ambientColor: '#2b0600', ambientIntensity: 0.45,
    dirColor: '#ff4400', dirIntensity: 2.4,
    rimColor: '#ffaa00', rimIntensity: 1.8,
    neonBorder: '#ff5500', neonPink: '#ffaa00',
    pipeColor: '#651a02', pipeEmissive: '#e63900',
    sidePlatform: '#1e0400'
  },
  3: {
    name: "GOLDEN DESERT CITADEL",
    subtitle: "WORLD 3-1: PYRAMID DUNES",
    variant: 2,
    topColor: '#080700', midColor: '#171200', bottomColor: '#bf8f00',
    fogColor: '#1c1700', fogDensity: 0.02,
    ambientColor: '#141000', ambientIntensity: 0.4,
    dirColor: '#ffd700', dirIntensity: 2.6,
    rimColor: '#cc0000', rimIntensity: 2.0,
    neonBorder: '#ffd700', neonPink: '#cc0000',
    pipeColor: '#241a00', pipeEmissive: '#ffd700',
    sidePlatform: '#0e0c00'
  },
  4: {
    name: "DEEP OCEAN TRENCH",
    subtitle: "WORLD 4-1: AQUATIC DEPTHS",
    variant: 0,
    topColor: '#000511', midColor: '#001026', bottomColor: '#003366',
    fogColor: '#000714', fogDensity: 0.025,
    ambientColor: '#00ffcc', ambientIntensity: 0.5,
    dirColor: '#0066ff', dirIntensity: 2.0,
    rimColor: '#00ffaa', rimIntensity: 1.7,
    neonBorder: '#00ffcc', neonPink: '#0044ff',
    pipeColor: '#002244', pipeEmissive: '#00ffcc',
    sidePlatform: '#00081a'
  },
  5: {
    name: "TOXIC ALGAE SWAMP",
    subtitle: "WORLD 5-1: BIO-WASTE BAYOU",
    variant: 1,
    topColor: '#051100', midColor: '#102600', bottomColor: '#264d00',
    fogColor: '#071400', fogDensity: 0.02,
    ambientColor: '#7fff00', ambientIntensity: 0.45,
    dirColor: '#39ff14', dirIntensity: 2.3,
    rimColor: '#adff2f', rimIntensity: 1.6,
    neonBorder: '#39ff14', neonPink: '#7fff00',
    pipeColor: '#102600', pipeEmissive: '#39ff14',
    sidePlatform: '#0a1400'
  },
  6: {
    name: "FROZEN GLACIER VAULT",
    subtitle: "WORLD 6-1: SHIVER BURN ICE",
    variant: 2,
    topColor: '#05101a', midColor: '#10243d', bottomColor: '#4d80b3',
    fogColor: '#0d2233', fogDensity: 0.018,
    ambientColor: '#e6f2ff', ambientIntensity: 0.4,
    dirColor: '#00ffff', dirIntensity: 2.2,
    rimColor: '#ffffff', rimIntensity: 1.5,
    neonBorder: '#e6f2ff', neonPink: '#00ffff',
    pipeColor: '#1a334d', pipeEmissive: '#00ffff',
    sidePlatform: '#051424'
  },
  7: {
    name: "HAUNTED BOO MANSION",
    subtitle: "WORLD 7-1: GHOSTLY ECHOES",
    variant: 0,
    topColor: '#030108', midColor: '#0d041c', bottomColor: '#200540',
    fogColor: '#0a0314', fogDensity: 0.024,
    ambientColor: '#9933ff', ambientIntensity: 0.3,
    dirColor: '#7f00ff', dirIntensity: 2.1,
    rimColor: '#ffffff', rimIntensity: 1.6,
    neonBorder: '#7f00ff', neonPink: '#ffffff',
    pipeColor: '#1c0d30', pipeEmissive: '#7f00ff',
    sidePlatform: '#08020f'
  },
  8: {
    name: "SKY HIGH AIRSHIP",
    subtitle: "WORLD 8-1: CLOUD PATROL",
    variant: 1,
    topColor: '#081226', midColor: '#1a2d4d', bottomColor: '#4d80e6',
    fogColor: '#101a2e', fogDensity: 0.014,
    ambientColor: '#ffcc00', ambientIntensity: 0.4,
    dirColor: '#ffbb00', dirIntensity: 2.4,
    rimColor: '#ff6600', rimIntensity: 1.8,
    neonBorder: '#ffcc00', neonPink: '#ff6600',
    pipeColor: '#4d2e00', pipeEmissive: '#ffcc00',
    sidePlatform: '#101a2e'
  },
  9: {
    name: "RAINBOW ROAD GALAXY",
    subtitle: "WORLD 9-1: COSMIC HIGHWAY",
    variant: 0,
    topColor: '#000005', midColor: '#060017', bottomColor: '#18003a',
    fogColor: '#04000d', fogDensity: 0.016,
    ambientColor: '#ff00ff', ambientIntensity: 0.45,
    dirColor: '#00ffff', dirIntensity: 2.5,
    rimColor: '#ff00aa', rimIntensity: 1.9,
    neonBorder: '#ff007f', neonPink: '#00ffff',
    pipeColor: '#09001f', pipeEmissive: '#ff007f',
    sidePlatform: '#04000f'
  },
  10: {
    name: "CYBER TITAN CORE",
    subtitle: "WORLD 10-1: FINAL SHOWDOWN",
    variant: 2,
    topColor: '#050002', midColor: '#140008', bottomColor: '#3d001a',
    fogColor: '#0a0004', fogDensity: 0.022,
    ambientColor: '#ff3300', ambientIntensity: 0.5,
    dirColor: '#cc0000', dirIntensity: 2.8,
    rimColor: '#ff9900', rimIntensity: 2.1,
    neonBorder: '#cc0000', neonPink: '#ff3300',
    pipeColor: '#1f000d', pipeEmissive: '#cc0000',
    sidePlatform: '#0f0006'
  }
};

export default function ThreeGame({
  status,
  soundEnabled,
  currentLang,
  onLanguageChange,
  onStatsChange,
  onGameReset,
  onGameStart,
}: ThreeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRtl = currentLang === 'ar';

  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [princessCharId, setPrincessCharId] = useState<string | undefined>(undefined);
  const [activationKey, setActivationKey] = useState<number>(0);

  const [bgmVol, setBgmVol] = useState(gameAudio.bgmVolume);
  const [sfxVol, setSfxVol] = useState(gameAudio.sfxVolume);

  // Refs for HUD elements to allow direct DOM manipulation, bypassing React re-renders for solid 60 FPS performance
  const hudScoreRef = useRef<HTMLSpanElement>(null);
  const hudCoinsRef = useRef<HTMLSpanElement>(null);
  const hudDistanceRef = useRef<HTMLSpanElement>(null);
  const hudLivesRef = useRef<HTMLDivElement>(null);
  const hudShieldRef = useRef<HTMLDivElement>(null);
  const hudShieldTimeRef = useRef<HTMLSpanElement>(null);
  const hudLevelUpRef = useRef<HTMLDivElement>(null);
  const hudLevelUpTextRef = useRef<HTMLSpanElement>(null);
  const hudFogOverlayRef = useRef<HTMLDivElement>(null);

  // Wrap onStatsChange in a ref to avoid triggering the main 3D engine initialization useEffect
  const onStatsChangeRef = useRef(onStatsChange);
  useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
  }, [onStatsChange]);

  // Game internal state kept in a ref to decouple React renders from physics and animation ticks
  const stateRef = useRef({
    status: 'IDLE' as GameStatus,
    score: 0,
    coins: 0,
    distance: 0,
    lives: 3,
    invincibleTime: 0, // seconds
    shieldActive: false,
    shieldTime: 0,
    speed: 16.0, // initial speed
    maxSpeed: 35.0,
    lastSpawnTime: 0,
    lastDistanceScoreTime: 0,
    playerLane: 0 as Lane,
    playerTargetX: 0,
    playerCurrentX: 0,
    playerY: 0,
    playerJumpVelocity: 0,
    playerIsJumping: false,
    playerIsSliding: false,
    playerSlideTime: 0,
    laneWidth: 2.5,
    entities: [] as { entityDef: GameEntity & { poolKey?: string; isDying?: boolean; deathTime?: number; isMoving?: boolean; currentX?: number } & any; mesh: THREE.Group }[],
    roadTiles: [] as THREE.Group[],
    clouds: [] as THREE.Mesh[],
    sceneryItems: [] as THREE.Group[],
    particles: [] as { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[],
    cameraShake: 0,
    activeLevel: 1,
    currentSpawnLevel: 1,
    pools: {} as Record<string, THREE.Group[]>,
    fogBlockActive: false,
    fogBlockTime: 0,
    fogBlockDuration: 0,
    activeMap: 1,
    selectedCharacter: 'red_mario',
    isTemporaryTrial: false,
    laserTime: 0,
    superBounceTime: 0,
    jetpackTime: 0,
    princessTime: 0,
    princessCharId: 'Peach',
    magnetTime: 0,
    nitroTime: 0,
    fireLaser: null as (() => void) | null,
    skyObstacleActiveEvent: null as 'BOMB' | 'ARROW' | 'LIGHTNING' | null,
    nextSkyEventTimestamp: 0,
    lastSkySpawnTime: 0,
    skyEventPhase: null as 'WARNING' | 'SPAWNED' | null,
    skyEventTimer: 0,
    skyEventLane: 0 as Lane,
    skyFlashFrames: 0,
    skyObstacles: [] as {
      id: string;
      type: 'BOMB' | 'LIGHTNING' | 'ARROW' | 'SHOCKWAVE';
      mesh: THREE.Object3D;
      lane: Lane;
      x: number;
      y: number;
      z: number;
      swayDir?: number;
      swayTime?: number;
      warningTime?: number;
      strikeDuration?: number;
      hasStruck?: boolean;
      fallSpeed?: number;
      mockEntityDef?: any;
    }[],
    dragonActive: false,
    dragonSide: 'LEFT' as 'LEFT' | 'RIGHT',
    dragonType: 'LOW' as 'LOW' | 'HIGH',
    dragonX: 0,
    dragonSpeed: 0,
    dragonWarningTimer: 0,
    nextDragonTimestamp: 0,
    dragonMesh: null as THREE.Group | null,
    dragonBodySegments: [] as any[],
    dragonFireMesh: null as any,
    dragonSegmentPositions: [] as THREE.Vector3[],
  });

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [menuView, setMenuView] = useState<'MAIN' | 'SETTINGS' | 'SHOP' | 'MAPS'>('MAIN');
  const [isWarmedUp, setIsWarmedUp] = useState(false);

  // --- Dynamic Sky Obstacles React states for HUD / full-screen flashes ---
  const [skyObstacleActiveEvent, setSkyObstacleActiveEvent] = useState<'BOMB' | 'ARROW' | 'LIGHTNING' | null>(null);
  const [nextSkyEventTimestamp, setNextSkyEventTimestamp] = useState<number>(0);
  const [skyWarningType, setSkyWarningType] = useState<'BOMB' | 'ARROW' | null>(null);
  const [skyFlashActive, setSkyFlashActive] = useState<boolean>(false);

  // --- Surprise Cyber Fire Dragon React states for HUD / Warning indicators ---
  const [dragonWarningSide, setDragonWarningSide] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [dragonWarningType, setDragonWarningType] = useState<'LOW' | 'HIGH' | null>(null);

  const [activeMap, setActiveMap] = useState<number>(() => {
    return storage.getActiveMap();
  });

  const [unlockedMaps, setUnlockedMaps] = useState<number[]>(() => {
    return storage.getUnlockedMaps();
  });

  const [mapCompleted, setMapCompleted] = useState(false);

  // --- Cyber Runner Character Selection & Shop States ---
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    return storage.getCoins();
  });

  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(() => {
    return storage.getUnlockedCharacters();
  });

  const [selectedCharacter, setSelectedCharacter] = useState<string>(() => {
    return storage.getSelectedCharacter();
  });

  const [isTemporaryTrial, setIsTemporaryTrial] = useState<boolean>(() => {
    return storage.isTemporaryTrial();
  });

  // --- Cyber-PowerUp Inventory State ---
  const [playerInventory, setPlayerInventory] = useState<{
    hearts: number;
    shields: number;
    magnets: number;
  }>(() => {
    return storage.getInventory();
  });

  useEffect(() => {
    storage.setInventory(playerInventory);
  }, [playerInventory]);

  // Video Ad states
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [adCharacterId, setAdCharacterId] = useState('');
  const [adWatchCount, setAdWatchCount] = useState(0);

  // Coin Exchange states
  const [isCoinExchangeOpen, setIsCoinExchangeOpen] = useState(false);
  const [isWatchingExchangeAd, setIsWatchingExchangeAd] = useState(false);
  const [exchangeAdTier, setExchangeAdTier] = useState<1 | 2 | 3 | null>(null);
  const [exchangeAdCurrentIndex, setExchangeAdCurrentIndex] = useState(0);
  const [exchangeAdCountdown, setExchangeAdCountdown] = useState(0);

  // Revive states
  const [currentRunRevives, setCurrentRunRevives] = useState(0);
  const [isWatchingReviveAd, setIsWatchingReviveAd] = useState(false);
  const [reviveAdCurrentIndex, setReviveAdCurrentIndex] = useState(0);
  const [reviveAdCountdown, setReviveAdCountdown] = useState(0);

  // useRef guards to prevent double-triggering across re-renders / StrictMode
  const processedExchangeAdRef = useRef<string | null>(null);
  const processedReviveAdRef = useRef<string | null>(null);
  const processedTrialAdRef = useRef<string | null>(null);

  // Coin Exchange Ad sequence timer
  useEffect(() => {
    let interval: any;
    if (isWatchingExchangeAd && exchangeAdCountdown > 0) {
      interval = setInterval(() => {
        setExchangeAdCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWatchingExchangeAd, exchangeAdCountdown]);

  useEffect(() => {
    if (isWatchingExchangeAd && exchangeAdCountdown === 0 && exchangeAdTier !== null) {
      const requiredAds = exchangeAdTier === 1 ? 1 : exchangeAdTier === 2 ? 2 : 3;
      const currentIdx = exchangeAdCurrentIndex;

      // Unique key for the current tier and ad index step
      const key = `${exchangeAdTier}-${currentIdx}`;
      if (processedExchangeAdRef.current === key) {
        return;
      }
      processedExchangeAdRef.current = key;

      const nextIndex = currentIdx + 1;
      if (nextIndex >= requiredAds) {
        const coinsToAward = exchangeAdTier === 1 ? 300 : exchangeAdTier === 2 ? 800 : 1500;
        setTotalCoins((prevCoins) => prevCoins + coinsToAward);
        setIsWatchingExchangeAd(false);
        setExchangeAdTier(null);
        setExchangeAdCurrentIndex(0);
        gameAudio.playCoin();
      } else {
        setExchangeAdCurrentIndex(nextIndex);
        setExchangeAdCountdown(1); // 1s countdown per ad
        gameAudio.playCoin();
      }
    }
  }, [isWatchingExchangeAd, exchangeAdCountdown, exchangeAdCurrentIndex, exchangeAdTier]);

  // Revive Ad sequence timer
  useEffect(() => {
    let interval: any;
    if (isWatchingReviveAd && reviveAdCountdown > 0) {
      interval = setInterval(() => {
        setReviveAdCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWatchingReviveAd, reviveAdCountdown]);

  useEffect(() => {
    if (isWatchingReviveAd && reviveAdCountdown === 0) {
      const requiredAds = currentRunRevives + 1;
      const currentIdx = reviveAdCurrentIndex;

      // Unique key for the current revive count and ad index step
      const key = `${currentRunRevives}-${currentIdx}`;
      if (processedReviveAdRef.current === key) {
        return;
      }
      processedReviveAdRef.current = key;

      const nextIndex = currentIdx + 1;
      if (nextIndex >= requiredAds) {
        setIsWatchingReviveAd(false);
        setReviveAdCurrentIndex(0);
        
        const state = stateRef.current;
        state.lives = 1;
        state.invincibleTime = 2.0;
        state.status = 'RUNNING';
        
        if (hudLivesRef.current) {
          const hearts = hudLivesRef.current.children;
          for (let idx = 0; idx < 3; idx++) {
            const heart = hearts[idx] as HTMLElement;
            if (heart) {
              if (idx < 1) {
                heart.className = 'text-lg transition-transform scale-100 text-red-500 text-neon-pink';
              } else {
                heart.className = 'text-lg transition-transform scale-75 text-neutral-700';
              }
            }
          }
        }
        
        gameAudio.playBGM();
        onStatsChangeRef.current({ lives: 1, status: 'RUNNING' });
        setCurrentRunRevives((r) => r + 1);
      } else {
        setReviveAdCurrentIndex(nextIndex);
        setReviveAdCountdown(1); // 1s countdown per ad
        gameAudio.playCoin();
      }
    }
  }, [isWatchingReviveAd, reviveAdCountdown, reviveAdCurrentIndex, currentRunRevives]);

  const handleStartExchangeAd = (tier: 1 | 2 | 3) => {
    gameAudio.playBlockHit();
    setIsCoinExchangeOpen(false);
    gameAdManager.buyCoinsWithAds(tier, (coinsEarned) => {
      const nextTotal = storage.addCoins(coinsEarned);
      setTotalCoins(nextTotal);
    });
  };

  const handleStartReviveAd = () => {
    gameAudio.playBlockHit();
    setIsWatchingReviveAd(false);
    gameAdManager.watchMultipleRewardedAds(1, () => {
      const state = stateRef.current;
      state.lives = 1;
      state.invincibleTime = 2.0;
      state.status = 'RUNNING';
      setCurrentRunRevives((r) => r + 1);
      gameAudio.playBGM();
      onStatsChangeRef.current({ lives: 1, status: 'RUNNING' });
    }, {
      rewardTitle: 'Emergency Ad Revive',
    });
  };

  const handleUseStoredHeart = () => {
    if (playerInventory.hearts <= 0) return;
    
    gameAudio.playBlockHit();
    
    // Decrement from inventory
    setPlayerInventory(prev => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - 1)
    }));

    const state = stateRef.current;
    state.lives = 1;
    state.invincibleTime = 2.0;
    state.status = 'RUNNING';
    
    if (hudLivesRef.current) {
      const hearts = hudLivesRef.current.children;
      for (let idx = 0; idx < 3; idx++) {
        const heart = hearts[idx] as HTMLElement;
        if (heart) {
          if (idx < 1) {
            heart.className = 'text-lg transition-transform scale-100 text-red-500 text-neon-pink';
          } else {
            heart.className = 'text-lg transition-transform scale-75 text-neutral-700';
          }
        }
      }
    }
    
    gameAudio.playBGM();
    onStatsChangeRef.current({ lives: 1, status: 'RUNNING' });
  };

  // Sync state values for character selection
  useEffect(() => {
    stateRef.current.selectedCharacter = selectedCharacter;
    storage.setSelectedCharacter(selectedCharacter);
  }, [selectedCharacter]);

  useEffect(() => {
    stateRef.current.isTemporaryTrial = isTemporaryTrial;
    storage.setTemporaryTrial(isTemporaryTrial);
  }, [isTemporaryTrial]);

  useEffect(() => {
    storage.setUnlockedCharacters(unlockedCharacters);
  }, [unlockedCharacters]);

  useEffect(() => {
    storage.setCoins(totalCoins);
  }, [totalCoins]);

  // Snappy sequence ad trial timer
  useEffect(() => {
    let interval: any;
    if (isShowingAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isShowingAd, adTimer]);

  useEffect(() => {
    if (isShowingAd && adTimer === 0) {
      const char = CHARACTER_ROSTER.find(c => c.id === adCharacterId);
      const requiredAds = char ? Math.max(1, Math.floor(char.price / 10000)) : 1;
      const currentCount = adWatchCount;

      // Unique key for current character trial and watch step index
      const key = `${adCharacterId}-${currentCount}`;
      if (processedTrialAdRef.current === key) {
        return;
      }
      processedTrialAdRef.current = key;
      
      const nextCount = currentCount + 1;
      if (nextCount >= requiredAds) {
        setIsShowingAd(false);
        setIsTemporaryTrial(true);
        setSelectedCharacter(adCharacterId);
        onGameStart();
      } else {
        setAdWatchCount(nextCount);
        setAdTimer(1);
        gameAudio.playCoin();
      }
    }
  }, [isShowingAd, adTimer, adWatchCount, adCharacterId, onGameStart]);

  const handleWatchAdToTry = (charId: string) => {
    const char = CHARACTER_ROSTER.find((c) => c.id === charId);
    const price = char?.price || 10000;
    const name = char?.name || 'Operative';

    gameAudio.playBlockHit();
    gameAdManager.trialCharacter(price, charId, name, (unlockedId) => {
      setIsTemporaryTrial(true);
      setSelectedCharacter(unlockedId);
      onGameStart();
    });
  };

  // Sync active map choice to localStorage and stateRef
  useEffect(() => {
    storage.setActiveMap(activeMap);
    stateRef.current.activeMap = activeMap;
  }, [activeMap]);

  // Sync state values for HUD
  useEffect(() => {
    stateRef.current.status = status;
    if (status === 'RUNNING') {
      gameAudio.playBGM();
    } else {
      gameAudio.stopBGM();
    }
    if (status === 'IDLE') {
      setMenuView('MAIN');
    }
  }, [status]);

  useEffect(() => {
    gameAudio.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleBgmVolChange = (vol: number) => {
    setBgmVol(vol);
    gameAudio.bgmVolume = vol;
  };

  const handleSfxVolChange = (vol: number) => {
    setSfxVol(vol);
    gameAudio.sfxVolume = vol;
  };

  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
  };

  const handlePauseToggle = () => {
    if (status === 'RUNNING') {
      onStatsChangeRef.current({ status: 'PAUSED' });
      gameAudio.playBlockHit();
    } else if (status === 'PAUSED') {
      onStatsChangeRef.current({ status: 'RUNNING' });
      gameAudio.playCoin();
    }
  };

  const handleResume = () => {
    onStatsChangeRef.current({ status: 'RUNNING' });
    gameAudio.playCoin();
  };

  const handleReturnToMainMenu = () => {
    // Reset state and HUD elements
    setCurrentRunRevives(0);
    const state = stateRef.current;

    // Clean up active sky obstacles
    if (state.skyObstacles) {
      state.skyObstacles.forEach((obs) => {
        obs.mesh.parent?.remove(obs.mesh);
      });
      state.skyObstacles = [];
    }
    state.skyObstacleActiveEvent = null;
    state.lastSkySpawnTime = 0;

    // Reset sky states
    const minCooldownSeconds = 15;
    const maxCooldownSeconds = 30;
    const nextTime = Date.now() + (Math.random() * (maxCooldownSeconds - minCooldownSeconds) + minCooldownSeconds) * 1000;
    state.nextSkyEventTimestamp = nextTime;
    setNextSkyEventTimestamp(nextTime);
    setSkyObstacleActiveEvent(null);
    setSkyWarningType(null);
    setSkyFlashActive(false);

    // Clean up active cyber dragon
    if (state.dragonMesh) {
      state.dragonMesh.parent?.remove(state.dragonMesh);
      state.dragonMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      state.dragonMesh = null;
    }
    state.dragonActive = false;
    state.dragonBodySegments = [];
    state.dragonFireMesh = null;
    state.dragonSegmentPositions = [];
    state.dragonWarningTimer = 0;
    const minDragonCooldown = 40;
    const maxDragonCooldown = 60;
    const nextDragonTime = Date.now() + (Math.random() * (maxDragonCooldown - minDragonCooldown) + minDragonCooldown) * 1000;
    state.nextDragonTimestamp = nextDragonTime;
    setDragonWarningSide(null);
    setDragonWarningType(null);

    state.entities.forEach(({ entityDef, mesh }) => {
      mesh.parent?.remove(mesh);
      if (entityDef.poolKey && state.pools[entityDef.poolKey]) {
        state.pools[entityDef.poolKey].push(mesh);
      }
    });
    state.entities = [];
    state.score = 0;
    state.coins = 0;
    state.distance = 0;
    state.lives = 3;
    state.speed = 15.0 + ((state.activeMap || 1) - 1) * 1.5;
    state.invincibleTime = 0;
    state.shieldActive = false;
    state.laserTime = 0;
    state.superBounceTime = 0;
    state.jetpackTime = 0;
    state.princessTime = 0;
    state.magnetTime = 0;
    state.nitroTime = 0;
    state.playerLane = 0;
    state.playerCurrentX = 0;
    state.playerY = 0;
    state.playerIsJumping = false;
    state.playerIsSliding = false;
    state.activeLevel = 1;
    state.currentSpawnLevel = 1;

    // Reset scenery positions and set their level 1 sub-group to visible
    state.sceneryItems.forEach((item, index) => {
      const stepIndex = Math.floor(index / 4);
      const isRoadside = item.userData.isRoadside;
      const z = -120 + stepIndex * 18 + (isRoadside ? 9 : 0);
      item.position.z = z;
      
      const isRight = item.userData.isRight;
      if (isRoadside) {
        item.position.x = isRight ? 5.2 : -5.2;
      } else {
        item.position.x = isRight ? (16 + Math.random() * 12) : (-16 - Math.random() * 12);
      }
      
      if (item.children[0]) item.children[0].visible = true;
      if (item.children[1]) item.children[1].visible = false;
      if (item.children[2]) item.children[2].visible = false;
    });

    // Reset road tiles positions and set Level 1 sub-group to visible
    state.roadTiles.forEach((tile, index) => {
      tile.position.z = -index * 20; // tileLength is 20
      if (tile.children[0]) tile.children[0].visible = true;
      if (tile.children[1]) tile.children[1].visible = false;
      if (tile.children[2]) tile.children[2].visible = false;
    });

    if (hudScoreRef.current) hudScoreRef.current.textContent = '0';
    if (hudCoinsRef.current) hudCoinsRef.current.textContent = '000';
    if (hudDistanceRef.current) hudDistanceRef.current.textContent = '0m';
    if (hudLivesRef.current) {
      const hearts = hudLivesRef.current.children;
      for (let idx = 0; idx < 3; idx++) {
        const heart = hearts[idx] as HTMLElement;
        if (heart) {
          heart.className = 'text-lg transition-transform scale-100 text-red-500 text-neon-pink';
        }
      }
    }
    if (hudShieldRef.current) {
      hudShieldRef.current.style.display = 'none';
    }

    onStatsChangeRef.current({ status: 'IDLE', score: 0, coins: 0, distance: 0, lives: 3 });
    gameAudio.stopBGM();
    setMenuView('MAIN');
  };

  // Handle Full Screen toggling using HTML5 Fullscreen API
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (stateRef.current.status === 'RUNNING') {
          onStatsChangeRef.current({ status: 'PAUSED' });
          gameAudio.playBlockHit();
          return;
        } else if (stateRef.current.status === 'PAUSED') {
          onStatsChangeRef.current({ status: 'RUNNING' });
          gameAudio.playCoin();
          return;
        }
      }

      if (stateRef.current.status !== 'RUNNING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (stateRef.current.playerLane === 0) {
          stateRef.current.playerLane = -1;
        } else if (stateRef.current.playerLane === 1) {
          stateRef.current.playerLane = 0;
        }
        gameAudio.playSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (stateRef.current.playerLane === 0) {
          stateRef.current.playerLane = 1;
        } else if (stateRef.current.playerLane === -1) {
          stateRef.current.playerLane = 0;
        }
        gameAudio.playSlide();
      } else if (e.key === ' ' || e.key === 'Shift') {
        if (stateRef.current.laserTime > 0) {
          e.preventDefault();
          if (stateRef.current.fireLaser) {
            stateRef.current.fireLaser();
          }
          return;
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (stateRef.current.jetpackTime > 0) return; // Flying! No jump needed.
        if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
          stateRef.current.playerIsJumping = true;
          const jumpMultiplier = stateRef.current.superBounceTime > 0 ? 1.8 : 1.0;
          stateRef.current.playerJumpVelocity = 14 * jumpMultiplier;
          gameAudio.playJump();
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (stateRef.current.jetpackTime > 0) return; // Flying! No slide needed.
        if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
          stateRef.current.playerIsSliding = true;
          stateRef.current.playerSlideTime = 0.65;
          gameAudio.playSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch / Swipe handler
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeHandledRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.PointerEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    swipeHandledRef.current = false;
  };

  const handleTouchMove = (e: React.PointerEvent) => {
    if (!touchStartRef.current || swipeHandledRef.current || stateRef.current.status !== 'RUNNING') return;

    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;
    const minSwipeDist = 25; // responsive swipe distance

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDist) {
        swipeHandledRef.current = true;
        if (diffX > 0) {
          if (stateRef.current.playerLane === 0) {
            stateRef.current.playerLane = 1;
          } else if (stateRef.current.playerLane === -1) {
            stateRef.current.playerLane = 0;
          }
          gameAudio.playSlide();
        } else {
          if (stateRef.current.playerLane === 0) {
            stateRef.current.playerLane = -1;
          } else if (stateRef.current.playerLane === 1) {
            stateRef.current.playerLane = 0;
          }
          gameAudio.playSlide();
        }
      }
    } else {
      if (Math.abs(diffY) > minSwipeDist) {
        swipeHandledRef.current = true;
        if (diffY < 0) {
          if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
            stateRef.current.playerIsJumping = true;
            const jumpMultiplier = stateRef.current.superBounceTime > 0 ? 1.8 : 1.0;
            stateRef.current.playerJumpVelocity = 14 * jumpMultiplier;
            gameAudio.playJump();
          }
        } else {
          if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
            stateRef.current.playerIsSliding = true;
            stateRef.current.playerSlideTime = 0.65;
            gameAudio.playSlide();
          }
        }
      }
    }
  };

  const handleTouchEnd = (e: React.PointerEvent) => {
    if (!touchStartRef.current || stateRef.current.status !== 'RUNNING') {
      touchStartRef.current = null;
      swipeHandledRef.current = false;
      return;
    }

    if (!swipeHandledRef.current) {
      const diffX = e.clientX - touchStartRef.current.x;
      const diffY = e.clientY - touchStartRef.current.y;
      const minSwipeDist = 20;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDist) {
          if (diffX > 0) {
            if (stateRef.current.playerLane === 0) {
              stateRef.current.playerLane = 1;
            } else if (stateRef.current.playerLane === -1) {
              stateRef.current.playerLane = 0;
            }
            gameAudio.playSlide();
          } else {
            if (stateRef.current.playerLane === 0) {
              stateRef.current.playerLane = -1;
            } else if (stateRef.current.playerLane === 1) {
              stateRef.current.playerLane = 0;
            }
            gameAudio.playSlide();
          }
        }
      } else {
        if (Math.abs(diffY) > minSwipeDist) {
          if (diffY < 0) {
            if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
              stateRef.current.playerIsJumping = true;
              const jumpMultiplier = stateRef.current.superBounceTime > 0 ? 1.8 : 1.0;
              stateRef.current.playerJumpVelocity = 14 * jumpMultiplier;
              gameAudio.playJump();
            }
          } else {
            if (!stateRef.current.playerIsJumping && !stateRef.current.playerIsSliding) {
              stateRef.current.playerIsSliding = true;
              stateRef.current.playerSlideTime = 0.65;
              gameAudio.playSlide();
            }
          }
        }
      }
    }

    touchStartRef.current = null;
    swipeHandledRef.current = false;
  };

  // Main 3D Engine Setup - Runs EXACTLY once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const triggerLevelUpBanner = (level: number) => {
      if (!hudLevelUpRef.current || !hudLevelUpTextRef.current) return;
      
      let levelNameEn = '';
      let levelNameAr = '';
      
      if (level === 2) {
        levelNameEn = 'LAVA CAVERN';
        levelNameAr = 'كهف الحمم البركانية';
      } else if (level === 3) {
        levelNameEn = "CYBER CORE CITADEL";
        levelNameAr = 'القلعة السيبرانية الذهبية';
      } else {
        levelNameEn = 'NEON METROPOLIS';
        levelNameAr = 'مدينة النيون المستقبلية';
      }
      
      hudLevelUpTextRef.current.textContent = isRtl ? levelNameAr : levelNameEn;
      
      hudLevelUpRef.current.style.display = 'flex';
      hudLevelUpRef.current.className = "absolute top-1/3 left-1/2 -translate-x-1/2 bg-neutral-950/95 border-2 border-yellow-500 px-6 py-3 rounded-2xl text-center z-25 pointer-events-none font-mono text-base text-yellow-400 flex flex-col items-center gap-1 shadow-2xl shadow-yellow-500/40 max-w-sm transition-all scale-100 duration-300 opacity-100 animate-bounce";
      
      setTimeout(() => {
        if (hudLevelUpRef.current) {
          hudLevelUpRef.current.className = "absolute top-1/3 left-1/2 -translate-x-1/2 bg-neutral-950/95 border-2 border-yellow-500 px-6 py-3 rounded-2xl text-center z-25 pointer-events-none font-mono text-base text-yellow-400 flex flex-col items-center gap-1 shadow-2xl shadow-yellow-500/40 max-w-sm transition-all scale-75 duration-300 opacity-0";
          setTimeout(() => {
            if (hudLevelUpRef.current) hudLevelUpRef.current.style.display = 'none';
          }, 300);
        }
      }, 2500);
    };

    // 1. Scene, Camera, and WebGL Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060718, 0.022); // Deep mysterious tech-noir/neon horizon fog

    // Sunset gradient sky texture via canvas
    const bgTextureCanvas = document.createElement('canvas');
    bgTextureCanvas.width = 256;
    bgTextureCanvas.height = 512;
    const bgCtx = bgTextureCanvas.getContext('2d')!;
    const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#03010a'); // Sky top deep space black
    bgGrad.addColorStop(0.35, '#0a031e'); // Dark cyberspace indigo
    bgGrad.addColorStop(0.65, '#2e022c'); // Dark neon violet
    bgGrad.addColorStop(0.88, '#91004a'); // Mysterious twilight magenta
    bgGrad.addColorStop(1, '#ff3b00'); // Ambient cyberpunk red glow
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, 256, 512);
    const bgTexture = new THREE.CanvasTexture(bgTextureCanvas);
    scene.background = bgTexture;

    // Massive wide city lower ground floor/plane
    const lowerGroundGeom = new THREE.PlaneGeometry(1200, 1200);
    const lowerGroundMat = new THREE.MeshStandardMaterial({
      color: '#030108', // Deep tech-noir dark indigo/black
      roughness: 0.95,
      metalness: 0.15,
      emissive: '#080212', // Subtle cyber glow from beneath
      emissiveIntensity: 0.18
    });
    const lowerGround = new THREE.Mesh(lowerGroundGeom, lowerGroundMat);
    lowerGround.rotation.x = -Math.PI / 2;
    lowerGround.position.y = -15; // 15 units below track
    lowerGround.receiveShadow = true;
    scene.add(lowerGround);

    // Glowing tech cyber-grid on the floor
    const gridHelper = new THREE.GridHelper(1200, 120, '#00ffcc', '#22003c');
    gridHelper.position.y = -14.9; // Just slightly above the plane
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.16;
    }
    scene.add(gridHelper);

    const initialWidth = containerRef.current?.clientWidth || canvas.clientWidth || 800;
    const initialHeight = containerRef.current?.clientHeight || canvas.clientHeight || 450;
    const initialAspect = initialWidth / initialHeight;

    const camera = new THREE.PerspectiveCamera(
      55,
      initialAspect,
      0.1,
      150
    );
    camera.position.set(0, 3.8, 6.5);
    camera.lookAt(0, 1.2, -10);
    scene.add(camera);

    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 512;
    fogCanvas.height = 512;
    const fogCtx = fogCanvas.getContext('2d')!;
    const fogRadGrad = fogCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    fogRadGrad.addColorStop(0, 'rgba(240, 240, 245, 0.98)');
    fogRadGrad.addColorStop(0.5, 'rgba(195, 200, 210, 0.95)');
    fogRadGrad.addColorStop(1, 'rgba(145, 150, 160, 0.85)');
    fogCtx.fillStyle = fogRadGrad;
    fogCtx.fillRect(0, 0, 512, 512);
    const fogTexture = new THREE.CanvasTexture(fogCanvas);

    const fogQuadGeom = new THREE.PlaneGeometry(20, 20);
    const fogQuadMat = new THREE.MeshBasicMaterial({
      map: fogTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      depthTest: false,
    });
    const fogQuad = new THREE.Mesh(fogQuadGeom, fogQuadMat);
    fogQuad.position.set(0, 0, -1.0); // Directly in front of camera lens
    camera.add(fogQuad);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Procedural Textures and Materials
    const brickTex = createBrickTexture();
    const pipeTex = createPipeTexture();
    const qBlockTex = createQuestionBlockTexture();
    const coinTex = createCoinTexture();

    // Create "M" emblem texture on the fly for Mario's cap
    const emblemCanvas = document.createElement('canvas');
    emblemCanvas.width = 128;
    emblemCanvas.height = 128;
    const emblemCtx = emblemCanvas.getContext('2d')!;
    emblemCtx.fillStyle = '#ffffff';
    emblemCtx.beginPath();
    emblemCtx.arc(64, 64, 60, 0, Math.PI * 2);
    emblemCtx.fill();
    emblemCtx.fillStyle = '#e60012';
    emblemCtx.font = 'bold 80px "Inter", sans-serif';
    emblemCtx.textAlign = 'center';
    emblemCtx.textBaseline = 'middle';
    emblemCtx.fillText('M', 64, 64);
    const emblemTex = new THREE.CanvasTexture(emblemCanvas);

    // Advanced materials with realistic physical values
    const roadMat = new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.7, // realistic brick/stone roughness
      metalness: 0.15,
    });
    brickTex.repeat.set(1.5, 4);

    const sidePlatformMat = new THREE.MeshStandardMaterial({
      color: '#120a1c',
      roughness: 0.3,
      metalness: 0.5,
    });

    const neonBorderMat = new THREE.MeshStandardMaterial({
      color: '#00ffff',
      emissive: '#00ffff',
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });

    const neonPinkMat = new THREE.MeshStandardMaterial({
      color: '#ff00ff',
      emissive: '#ff00ff',
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });

    const pipeMat = new THREE.MeshStandardMaterial({
      color: '#00c325',
      roughness: 0.3, // glossy metallic pipes as requested
      metalness: 0.8, // glossy metallic
      emissive: '#003300',
      emissiveIntensity: 0.2,
    });

    const coinMat = new THREE.MeshStandardMaterial({
      map: coinTex,
      metalness: 0.95,
      roughness: 0.1,
      emissive: '#ffd700',
      emissiveIntensity: 0.4,
    });

    const qBlockMat = new THREE.MeshStandardMaterial({
      map: qBlockTex,
      roughness: 0.2,
      metalness: 0.7,
      emissive: '#ffa500',
      emissiveIntensity: 0.15,
    });

    const goombaMat = new THREE.MeshStandardMaterial({
      color: '#8b5a2b',
      roughness: 0.6,
    });

    const goombaCapMat = new THREE.MeshStandardMaterial({
      color: '#653c15',
      roughness: 0.5,
    });

    // 3. Cinematic Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.65); // Strong neural ambient fill
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 2.0); // Strong sunset keylight
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -4.5;
    dirLight.shadow.camera.right = 4.5;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.bias = -0.001;
    dirLight.shadow.normalBias = 0.04;
    scene.add(dirLight);

    // Rim light from behind and above to separate player/objects from background
    const rimLight = new THREE.DirectionalLight('#bf00ff', 1.5); // Electric magenta rim light
    rimLight.position.set(-10, 8, -15);
    scene.add(rimLight);

    // Static ambient point lights for atmospheric horizon glow
    const ambientPinkLight = new THREE.PointLight('#ff00aa', 2.5, 30);
    ambientPinkLight.position.set(7, 5, -30);
    scene.add(ambientPinkLight);

    const ambientCyanLight = new THREE.PointLight('#00ffff', 2.5, 30);
    ambientCyanLight.position.set(-7, 5, -15);
    scene.add(ambientCyanLight);

    // 4. Geometries Pooling to prevent allocation memory leaks
    const coinGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 14);
    const blockGeom = new THREE.BoxGeometry(0.75, 0.75, 0.75);
    const pipeRimGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.4, 18);
    const pipeBodyGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 18);
    const crossbarGeom = new THREE.CylinderGeometry(0.45, 0.45, 5.0, 14);
    const supportGeom = new THREE.CylinderGeometry(0.35, 0.35, 4.0, 14);
    const stemGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 12);
    const capGeom = new THREE.SphereGeometry(0.5, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyeGeom = new THREE.BoxGeometry(0.06, 0.16, 0.08);
    const pupilGeom = new THREE.BoxGeometry(0.04, 0.08, 0.04);

    // 5. Upgrade Cyber-Runner Composite 3D Model (Original Stylized Chibi Hero)
    const marioGroup = new THREE.Group();

    // Material definitions with beautiful shading properties (Toy-Like / Chibi / Polished aesthetic)
    const overallsMat = new THREE.MeshStandardMaterial({ color: '#0035bb', roughness: 0.55, metalness: 0.12 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#e60012', roughness: 0.45, metalness: 0.15 });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.35, metalness: 0.4 });
    const buttonMat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.2, roughness: 0.1 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.4, metalness: 0.1 });
    const gloveCuffMat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.2 });
    const bootMat = new THREE.MeshStandardMaterial({ color: '#e60012', roughness: 0.50, metalness: 0.15 });
    const soleMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.8 });
    const mustacheMat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.0 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.15, metalness: 0.8 });
    const eyeBlueMat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.5, roughness: 0.1 });
    const eyeBlackMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 2.5 });
    const eyeHighlightMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1, emissive: '#ffffff', emissiveIntensity: 1.5 });
    const neonCyanMat = new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.5, roughness: 0.1 });

    // 1. Torso & Tech Jacket (Smooth, streamlined cylinder with high collar & cyber zipper)
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.58, 24), shirtMat);
    torsoMesh.position.y = 0.62;
    
    // High-tech cyber collar ring
    const neckMesh = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 10, 20), neonCyanMat);
    neckMesh.position.set(0, 0.30, 0);
    neckMesh.rotation.x = Math.PI / 2;
    torsoMesh.add(neckMesh);

    // Glowing vertical chest zipper stripe
    const bibMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.48, 0.02), neonCyanMat);
    bibMesh.position.set(0, 0.02, 0.22);
    torsoMesh.add(bibMesh);

    // Minimalist chest badge
    const pocketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), buttonMat);
    pocketMesh.position.set(0.10, 0.12, 0.22);
    torsoMesh.add(pocketMesh);

    // Cyber energy pack on the back with dual glowing vents
    const cyberPack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.10), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 }));
    cyberPack.position.set(0, 0.05, -0.18);
    
    const ventL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), neonCyanMat);
    ventL.position.set(-0.06, 0.08, -0.06);
    ventL.rotation.x = Math.PI / 2;
    cyberPack.add(ventL);

    const ventR = ventL.clone();
    ventR.position.x = 0.06;
    cyberPack.add(ventR);
    torsoMesh.add(cyberPack);

    marioGroup.add(torsoMesh);

    // 2. Minimalist Utility Trousers (Matte Blue, Smooth Single Geometry)
    const overallsPants = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.28, 24), overallsMat);
    overallsPants.position.y = 0.35;
    marioGroup.add(overallsPants);

    // Decorative dummy placeholders for compatibility
    const hipL = new THREE.Group();
    const hipR = new THREE.Group();
    const strapL = new THREE.Group();
    const strapR = new THREE.Group();
    const backStrapL = new THREE.Group();
    const backStrapR = new THREE.Group();
    const buttonL = new THREE.Group();
    const buttonR = new THREE.Group();
    marioGroup.add(hipL, hipR, strapL, strapR, backStrapL, backStrapR, buttonL, buttonR);

    // 3. Articulated Sleeves & Hands (Chibi Proportions, Smooth Glove Mittens)
    const buildAdvancedGlove = (isRight: boolean) => {
      const gloveGroup = new THREE.Group();

      // Wrist neon cuff
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 8, 16), gloveCuffMat);
      cuff.rotation.x = Math.PI / 2;
      gloveGroup.add(cuff);

      // Smooth Chibi Palm
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), gloveMat);
      palm.position.set(0, -0.05, 0);
      palm.scale.set(1.1, 0.85, 0.7);
      gloveGroup.add(palm);

      // Distinct Chibi Thumb
      const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 8), gloveMat);
      thumb.position.set(isRight ? 0.042 : -0.042, -0.04, 0.015);
      thumb.rotation.z = isRight ? -Math.PI / 4 : Math.PI / 4;
      thumb.rotation.y = Math.PI / 6;
      gloveGroup.add(thumb);

      // Glowing Palm Sensor Node
      const palmSensor = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), neonCyanMat);
      palmSensor.position.set(0, -0.05, 0.035);
      gloveGroup.add(palmSensor);

      return gloveGroup;
    };

    // Arm Left
    const armL = new THREE.Group();
    armL.position.set(-0.30, 0.80, 0);
    
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 14), shirtMat);
    armL.add(shoulderL);
    
    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.18, 14), shirtMat);
    upperArmL.position.set(0, -0.09, 0);
    armL.add(upperArmL);
    
    const forearmL = new THREE.Group();
    forearmL.position.set(0, -0.18, 0);
    
    const lowerArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.16, 14), shirtMat);
    lowerArmL.position.set(0, -0.08, 0);
    forearmL.add(lowerArmL);
    
    const gloveL = buildAdvancedGlove(false);
    gloveL.position.set(0, -0.16, 0);
    forearmL.add(gloveL);
    
    armL.add(forearmL);
    marioGroup.add(armL);

    // Arm Right
    const armR = new THREE.Group();
    armR.position.set(0.30, 0.80, 0);
    
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 14), shirtMat);
    armR.add(shoulderR);
    
    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.18, 14), shirtMat);
    upperArmR.position.set(0, -0.09, 0);
    armR.add(upperArmR);
    
    const forearmR = new THREE.Group();
    forearmR.position.set(0, -0.18, 0);
    
    const lowerArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.16, 14), shirtMat);
    lowerArmR.position.set(0, -0.08, 0);
    forearmR.add(lowerArmR);
    
    const gloveR = buildAdvancedGlove(true);
    gloveR.position.set(0, -0.16, 0);
    forearmR.add(gloveR);
    
    armR.add(forearmR);
    marioGroup.add(armR);

    // 4. Utility Trousers Legs & High-Top Cyber Boots
    const legL = new THREE.Group();
    legL.position.set(-0.15, 0.24, 0);
    
    const upperLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.20, 16), overallsMat);
    upperLegL.position.set(0, -0.08, 0);
    legL.add(upperLegL);
    
    const shinL = new THREE.Group();
    shinL.position.set(0, -0.18, 0);
    
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 }));
    kneeL.position.set(0, 0, 0.02);
    shinL.add(kneeL);
    
    const lowerLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.18, 16), overallsMat);
    lowerLegL.position.set(0, -0.08, 0);
    shinL.add(lowerLegL);

    const legCuffL = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 16), neonCyanMat);
    legCuffL.position.set(0, -0.16, 0);
    legCuffL.rotation.x = Math.PI / 2;
    shinL.add(legCuffL);
    
    legL.add(shinL);
    marioGroup.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.15, 0.24, 0);
    
    const upperLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.20, 16), overallsMat);
    upperLegR.position.set(0, -0.08, 0);
    legR.add(upperLegR);
    
    const shinR = new THREE.Group();
    shinR.position.set(0, -0.18, 0);
    
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 }));
    kneeR.position.set(0, 0, 0.02);
    shinR.add(kneeR);
    
    const lowerLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.18, 16), overallsMat);
    lowerLegR.position.set(0, -0.08, 0);
    shinR.add(lowerLegR);

    const legCuffR = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 16), neonCyanMat);
    legCuffR.position.set(0, -0.16, 0);
    legCuffR.rotation.x = Math.PI / 2;
    shinR.add(legCuffR);
    
    legR.add(shinR);
    marioGroup.add(legR);

    // High-Top Cyber Runner Sneakers
    const buildAdvancedBoot = () => {
      const bootGroup = new THREE.Group();

      // Thick Cushioning Sole
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.28), soleMat);
      sole.position.set(0, 0.02, 0.03);
      bootGroup.add(sole);

      // Cyan Neon Underglow Channel
      const underglow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.26), neonCyanMat);
      underglow.position.set(0, 0.008, 0.03);
      bootGroup.add(underglow);

      // Sleek Upper Sneaker
      const upper = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 14), bootMat);
      upper.position.set(0, 0.07, 0.02);
      upper.scale.set(1.1, 0.8, 1.3);
      bootGroup.add(upper);

      return bootGroup;
    };

    const bootLGroup = buildAdvancedBoot();
    bootLGroup.position.set(-0.15, 0.05, 0);
    marioGroup.add(bootLGroup);

    const bootRGroup = buildAdvancedBoot();
    bootRGroup.position.set(0.15, 0.05, 0);
    marioGroup.add(bootRGroup);

    // 5. Head Group (Clean Chibi Head, Dark Gloss Visor, Glowing Cyan Digital Eyes, Backward Cap)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.25;

    // Smooth Chibi Head Chassis
    const faceMesh = new THREE.Mesh(new THREE.SphereGeometry(0.30, 24, 24), skinMat);
    headGroup.add(faceMesh);

    // Smooth Dark Gloss Visor Faceplate
    const visorFace = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 20), eyeWhiteMat);
    visorFace.position.set(0, 0.02, 0.04);
    visorFace.scale.set(0.95, 0.90, 0.95);
    headGroup.add(visorFace);

    // LARGE GLOWING DIGITAL EYE-PLATES (Neon Cyan, Sleek & Minimalist UI, Zero Lumps/Mustaches)
    const eyeLGroup = new THREE.Group();
    eyeLGroup.position.set(-0.11, 0.04, 0.26);
    eyeLGroup.rotation.set(0, 0.12, -0.05);

    const eyePlateL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.03), eyeBlueMat);
    eyeLGroup.add(eyePlateL);
    headGroup.add(eyeLGroup);

    const eyeRGroup = new THREE.Group();
    eyeRGroup.position.set(0.11, 0.04, 0.26);
    eyeRGroup.rotation.set(0, -0.12, 0.05);

    const eyePlateR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.03), eyeBlueMat);
    eyeRGroup.add(eyePlateR);
    headGroup.add(eyeRGroup);

    // Cyber Ear Audio Headphones
    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), shirtMat);
    earL.position.set(-0.31, 0, 0);
    earL.rotation.z = Math.PI / 2;
    headGroup.add(earL);

    const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), shirtMat);
    earR.position.set(0.31, 0, 0);
    earR.rotation.z = -Math.PI / 2;
    headGroup.add(earR);

    // Backward-Facing Matte Red Cap
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7), shirtMat);
    capDome.position.set(0, 0.10, -0.02);
    capDome.scale.set(1.02, 0.92, 1.05);
    headGroup.add(capDome);

    const capCap = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 10, 24), shirtMat);
    capCap.position.set(0, 0.08, -0.02);
    capCap.rotation.x = Math.PI / 2;
    headGroup.add(capCap);

    // Backward Visor Brim
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.22), shirtMat);
    visor.position.set(0, 0.06, -0.26);
    visor.rotation.x = -0.15;
    headGroup.add(visor);

    // Front Illuminated 'CR' Geometric Emblem
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 16), new THREE.MeshBasicMaterial({ color: '#09090b' }));
    emblem.position.set(0, 0.16, 0.27);
    emblem.rotation.x = Math.PI / 2.2;
    headGroup.add(emblem);

    const letterMGroup = new THREE.Group();
    const crLogoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.05, 0.015), neonCyanMat);
    letterMGroup.add(crLogoMesh);
    letterMGroup.position.set(0, 0.16, 0.28);
    letterMGroup.rotation.x = Math.PI / 2.2;
    headGroup.add(letterMGroup);

    // Compatibility dummy groups
    const moustacheGroup = new THREE.Group();
    const hairGroup = new THREE.Group();
    const cheekL = new THREE.Group();
    const cheekR = new THREE.Group();
    const chinMesh = new THREE.Group();
    const noseMesh = new THREE.Group();
    headGroup.add(moustacheGroup, hairGroup, cheekL, cheekR, chinMesh, noseMesh);

    // PRINCESS ACCESSORIES (Crown & Hair)
    const princessCrownGroup = new THREE.Group();
    princessCrownGroup.position.set(0, 0.40, -0.04);
    
    const crownBaseMat = new THREE.MeshStandardMaterial({ color: '#ffcc00', metalness: 0.9, roughness: 0.1 });
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.10, 16), crownBaseMat);
    princessCrownGroup.add(crownBase);
    
    const spikeGeom = new THREE.ConeGeometry(0.04, 0.10, 4);
    const jewelRedMat = new THREE.MeshStandardMaterial({ color: '#ff0033', roughness: 0.2, metalness: 0.5 });
    const jewelBlueMat = new THREE.MeshStandardMaterial({ color: '#0066ff', roughness: 0.2, metalness: 0.5 });
    
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * 0.17;
      const z = Math.sin(angle) * 0.17;
      
      const spike = new THREE.Mesh(spikeGeom, crownBaseMat);
      spike.position.set(x, 0.08, z);
      princessCrownGroup.add(spike);
      
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), i % 2 === 0 ? jewelRedMat : jewelBlueMat);
      jewel.position.set(x * 1.08, 0.13, z * 1.08);
      princessCrownGroup.add(jewel);
    }
    princessCrownGroup.visible = false;
    headGroup.add(princessCrownGroup);

    const princessHairGroup = new THREE.Group();
    const peachHairMat = new THREE.MeshStandardMaterial({ color: '#ffe66d', roughness: 0.6 });
    const daisyHairMat = new THREE.MeshStandardMaterial({ color: '#cd853f', roughness: 0.6 });
    const rosalinaHairMat = new THREE.MeshStandardMaterial({ color: '#e6f2ff', roughness: 0.5 });
    
    const hairStrandGeom = new THREE.SphereGeometry(0.15, 12, 12);
    
    const bangCenter = new THREE.Mesh(hairStrandGeom, peachHairMat);
    bangCenter.position.set(0, 0.18, 0.23);
    bangCenter.scale.set(1.3, 0.8, 0.7);
    princessHairGroup.add(bangCenter);

    const bangL = new THREE.Mesh(hairStrandGeom, peachHairMat);
    bangL.position.set(-0.16, 0.16, 0.22);
    bangL.scale.set(1.0, 0.9, 0.75);
    bangL.rotation.z = -0.15;
    princessHairGroup.add(bangL);

    const bangR = new THREE.Mesh(hairStrandGeom, peachHairMat);
    bangR.position.set(0.16, 0.16, 0.22);
    bangR.scale.set(1.0, 0.9, 0.75);
    bangR.rotation.z = 0.15;
    princessHairGroup.add(bangR);

    const sideLockL = new THREE.Mesh(hairStrandGeom, peachHairMat);
    sideLockL.position.set(-0.28, -0.12, 0.08);
    sideLockL.scale.set(1.1, 1.8, 1.1);
    princessHairGroup.add(sideLockL);

    const sideLockR = new THREE.Mesh(hairStrandGeom, peachHairMat);
    sideLockR.position.set(0.28, -0.12, 0.08);
    sideLockR.scale.set(1.1, 1.8, 1.1);
    princessHairGroup.add(sideLockR);

    const backLockUpper = new THREE.Mesh(hairStrandGeom, peachHairMat);
    backLockUpper.position.set(0, -0.05, -0.22);
    backLockUpper.scale.set(1.8, 1.5, 1.4);
    princessHairGroup.add(backLockUpper);

    const backLockLower = new THREE.Mesh(hairStrandGeom, peachHairMat);
    backLockLower.position.set(0, -0.28, -0.24);
    backLockLower.scale.set(1.6, 2.3, 1.2);
    princessHairGroup.add(backLockLower);

    const flareL = new THREE.Mesh(hairStrandGeom, peachHairMat);
    flareL.position.set(-0.35, -0.25, -0.10);
    flareL.scale.set(1.2, 1.1, 1.3);
    flareL.rotation.y = Math.PI / 4;
    flareL.rotation.z = -0.3;
    princessHairGroup.add(flareL);

    const flareR = new THREE.Mesh(hairStrandGeom, peachHairMat);
    flareR.position.set(0.35, -0.25, -0.10);
    flareR.scale.set(1.2, 1.1, 1.3);
    flareR.rotation.y = -Math.PI / 4;
    flareR.rotation.z = 0.3;
    princessHairGroup.add(flareR);
    
    princessHairGroup.visible = false;
    headGroup.add(princessHairGroup);

    // PRINCESS DRESS & BODICE OVERHAUL (Distinct beautiful female proportions, elegant swishing gown with animated folds)
    const princessDressGroup = new THREE.Group();
    princessDressGroup.visible = false;
    marioGroup.add(princessDressGroup);

    const goldMat = new THREE.MeshStandardMaterial({ color: '#ffcc00', metalness: 0.9, roughness: 0.1 });
    const broochGemRedMat = new THREE.MeshStandardMaterial({ color: '#ff0033', roughness: 0.2, metalness: 0.5, emissive: '#aa0011', emissiveIntensity: 0.2 });
    const broochGemBlueMat = new THREE.MeshStandardMaterial({ color: '#00bfff', roughness: 0.2, metalness: 0.5, emissive: '#0044aa', emissiveIntensity: 0.2 });
    const broochGemGreenMat = new THREE.MeshStandardMaterial({ color: '#39ff14', roughness: 0.2, metalness: 0.5, emissive: '#00aa00', emissiveIntensity: 0.2 });

    // 1. Sleek female bodice/corset (replaces overalls bib)
    const bodiceGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 16);
    const bodiceMesh = new THREE.Mesh(bodiceGeom, overallsMat);
    bodiceMesh.position.set(0, 0.72, 0.02);
    princessDressGroup.add(bodiceMesh);

    // 2. Chest Brooch (Peach/Daisy jewelry)
    const broochBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), goldMat);
    broochBaseMesh.position.set(0, 0.82, 0.18);
    broochBaseMesh.rotation.x = Math.PI / 3;
    princessDressGroup.add(broochBaseMesh);

    const broochGemMesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), broochGemGreenMat);
    broochGemMesh.position.set(0, 0.83, 0.19);
    princessDressGroup.add(broochGemMesh);

    // 3. Two-tiered flared gown skirts
    const upperSkirtGeom = new THREE.CylinderGeometry(0.21, 0.42, 0.32, 18);
    const upperSkirt = new THREE.Mesh(upperSkirtGeom, overallsMat);
    upperSkirt.position.set(0, 0.45, 0);
    princessDressGroup.add(upperSkirt);

    const lowerSkirtGeom = new THREE.CylinderGeometry(0.42, 0.68, 0.38, 18);
    const lowerSkirt = new THREE.Mesh(lowerSkirtGeom, overallsMat);
    lowerSkirt.position.set(0, 0.16, 0);
    princessDressGroup.add(lowerSkirt);

    // 4. Accent trim at hem of dress
    const skirtTrimGeom = new THREE.CylinderGeometry(0.68, 0.71, 0.06, 18);
    const skirtTrim = new THREE.Mesh(skirtTrimGeom, shirtMat);
    skirtTrim.position.set(0, 0.02, 0);
    princessDressGroup.add(skirtTrim);

    // 5. Stylized vertical fabric pleat folds for gorgeous volume shading
    const foldGeom = new THREE.CylinderGeometry(0.015, 0.045, 0.65, 8);
    const dressFoldsGroup = new THREE.Group();
    princessDressGroup.add(dressFoldsGroup);

    const foldMeshes: THREE.Mesh[] = [];
    const numFolds = 10;
    for (let i = 0; i < numFolds; i++) {
      const angle = (i * Math.PI * 2) / numFolds;
      const foldMesh = new THREE.Mesh(foldGeom, overallsMat);
      const x = Math.cos(angle) * 0.45;
      const z = Math.sin(angle) * 0.45;
      foldMesh.position.set(x, 0.22, z);
      foldMesh.rotation.z = Math.cos(angle) * 0.35;
      foldMesh.rotation.x = -Math.sin(angle) * 0.35;
      foldMesh.rotation.y = -angle;
      dressFoldsGroup.add(foldMesh);
      foldMeshes.push(foldMesh);
    }

    // 6. Delicate peplum petals at waist
    const waistFrillGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const waistFrillsGroup = new THREE.Group();
    princessDressGroup.add(waistFrillsGroup);

    const frillMeshes: THREE.Mesh[] = [];
    const numFrills = 6;
    for (let i = 0; i < numFrills; i++) {
      const angle = (i * Math.PI * 2) / numFrills;
      const frill = new THREE.Mesh(waistFrillGeom, shirtMat);
      const r = 0.21;
      frill.position.set(Math.cos(angle) * r, 0.60, Math.sin(angle) * r);
      frill.scale.set(1.3, 0.5, 0.9);
      frill.rotation.y = -angle;
      frill.rotation.z = 0.35;
      waistFrillsGroup.add(frill);
      frillMeshes.push(frill);
    }

    // 7. Elegant puffy shoulder sleeves connected to left/right upper arms
    const puffySleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), overallsMat);
    puffySleeveL.position.set(0, -0.05, 0);
    puffySleeveL.scale.set(1.1, 0.9, 1.1);
    puffySleeveL.visible = false;
    armL.add(puffySleeveL);

    const puffySleeveR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), overallsMat);
    puffySleeveR.position.set(0, -0.05, 0);
    puffySleeveR.scale.set(1.1, 0.9, 1.1);
    puffySleeveR.visible = false;
    armR.add(puffySleeveR);

    // CYBER GORILLA OVERHAUL (Massive muscular upper body, long heavy arms, study legs, signature crest and custom yellow-on-red DK tie)
    const gorillaFurMat = new THREE.MeshStandardMaterial({ color: '#4a2e13', roughness: 0.95, metalness: 0.05 });
    const gorillaSkinMat = new THREE.MeshStandardMaterial({ color: '#cda27a', roughness: 0.55, metalness: 0.0 });
    const gorillaTieMat = new THREE.MeshStandardMaterial({ color: '#e60012', roughness: 0.4, metalness: 0.05 });
    const gorillaTieLogoMat = new THREE.MeshStandardMaterial({ color: '#ffd700', roughness: 0.3, metalness: 0.1 });
    
    const cyberGorillaGroup = new THREE.Group();
    cyberGorillaGroup.visible = false;
    marioGroup.add(cyberGorillaGroup);

    // 1. Torso & Upper Body
    const upperBody = new THREE.Group();
    upperBody.position.y = 0.8;
    cyberGorillaGroup.add(upperBody);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), gorillaFurMat);
    chest.scale.set(1.15, 0.85, 0.95);
    upperBody.add(chest);

    const chestPlate = new THREE.Mesh(new THREE.SphereGeometry(0.53, 16, 16), gorillaSkinMat);
    chestPlate.position.set(0, 0.02, 0.12);
    chestPlate.scale.set(0.85, 0.88, 0.35);
    upperBody.add(chestPlate);

    const absPlate = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), gorillaSkinMat);
    absPlate.position.set(0, -0.25, 0.10);
    absPlate.scale.set(0.75, 0.7, 0.35);
    upperBody.add(absPlate);

    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), gorillaFurMat);
    pelvis.position.set(0, -0.32, 0);
    pelvis.scale.set(1.0, 0.8, 0.9);
    upperBody.add(pelvis);

    // Back hump detail
    const backHump = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), gorillaFurMat);
    backHump.position.set(0, 0.15, -0.15);
    backHump.scale.set(0.95, 0.75, 0.9);
    upperBody.add(backHump);

    // 2. Arms (Long, thick, powerful, swinging)
    const gorillaArmL = new THREE.Group();
    gorillaArmL.position.set(-0.62, 0.22, 0);
    upperBody.add(gorillaArmL);

    const gShoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), gorillaFurMat);
    gorillaArmL.add(gShoulderL);

    const bicepL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.45, 12), gorillaFurMat);
    bicepL.position.set(0, -0.22, 0);
    bicepL.rotation.z = -0.1;
    gorillaArmL.add(bicepL);

    const gorillaForearmL = new THREE.Group();
    gorillaForearmL.position.set(0, -0.42, 0);
    gorillaArmL.add(gorillaForearmL);

    const gElbowL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), gorillaFurMat);
    gorillaForearmL.add(gElbowL);

    const gLowerArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.42, 12), gorillaFurMat);
    gLowerArmL.position.set(0, -0.21, 0);
    gorillaForearmL.add(gLowerArmL);

    const gorillaHandL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), gorillaSkinMat);
    gorillaHandL.position.set(0, -0.42, 0);
    gorillaHandL.scale.set(1.15, 0.8, 1.15);
    gorillaForearmL.add(gorillaHandL);

    for (let i = 0; i < 4; i++) {
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), gorillaSkinMat);
      knuckle.position.set(-0.09 + i * 0.06, -0.48, 0.05);
      gorillaForearmL.add(knuckle);
    }

    const gorillaArmR = new THREE.Group();
    gorillaArmR.position.set(0.62, 0.22, 0);
    upperBody.add(gorillaArmR);

    const gShoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), gorillaFurMat);
    gorillaArmR.add(gShoulderR);

    const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.45, 12), gorillaFurMat);
    bicepR.position.set(0, -0.22, 0);
    bicepR.rotation.z = 0.1;
    gorillaArmR.add(bicepR);

    const gorillaForearmR = new THREE.Group();
    gorillaForearmR.position.set(0, -0.42, 0);
    gorillaArmR.add(gorillaForearmR);

    const gElbowR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), gorillaFurMat);
    gorillaForearmR.add(gElbowR);

    const gLowerArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.42, 12), gorillaFurMat);
    gLowerArmR.position.set(0, -0.21, 0);
    gorillaForearmR.add(gLowerArmR);

    const gorillaHandR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), gorillaSkinMat);
    gorillaHandR.position.set(0, -0.42, 0);
    gorillaHandR.scale.set(1.15, 0.8, 1.15);
    gorillaForearmR.add(gorillaHandR);

    for (let i = 0; i < 4; i++) {
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), gorillaSkinMat);
      knuckle.position.set(-0.09 + i * 0.06, -0.48, 0.05);
      gorillaForearmR.add(knuckle);
    }

    // 3. Legs (Shorter, sturdier legs supporting heavy frame)
    const gorillaLegL = new THREE.Group();
    gorillaLegL.position.set(-0.25, 0.28, 0);
    cyberGorillaGroup.add(gorillaLegL);

    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.25, 12), gorillaFurMat);
    thighL.position.set(0, -0.1, 0);
    gorillaLegL.add(thighL);

    const gorillaShinL = new THREE.Group();
    gorillaShinL.position.set(0, -0.22, 0);
    gorillaLegL.add(gorillaShinL);

    const gKneeL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), gorillaFurMat);
    gorillaShinL.add(gKneeL);

    const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.22, 12), gorillaFurMat);
    calfL.position.set(0, -0.1, 0);
    gorillaShinL.add(calfL);

    const gorillaFootL = new THREE.Group();
    gorillaFootL.position.set(0, -0.21, 0.05);
    gorillaShinL.add(gorillaFootL);

    const footBaseL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.4), soleMat);
    footBaseL.position.set(0, 0.04, -0.05);
    gorillaFootL.add(footBaseL);

    const footUpperL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), gorillaFurMat);
    footUpperL.position.set(0, 0.08, -0.05);
    footUpperL.scale.set(1.0, 0.6, 1.2);
    gorillaFootL.add(footUpperL);

    for (let i = 0; i < 4; i++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), gorillaSkinMat);
      toe.position.set(-0.11 + i * 0.07, 0.05, 0.13);
      gorillaFootL.add(toe);
    }

    const gorillaLegR = new THREE.Group();
    gorillaLegR.position.set(0.25, 0.28, 0);
    cyberGorillaGroup.add(gorillaLegR);

    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.25, 12), gorillaFurMat);
    thighR.position.set(0, -0.1, 0);
    gorillaLegR.add(thighR);

    const gorillaShinR = new THREE.Group();
    gorillaShinR.position.set(0, -0.22, 0);
    gorillaLegR.add(gorillaShinR);

    const gKneeR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), gorillaFurMat);
    gorillaShinR.add(gKneeR);

    const calfR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.22, 12), gorillaFurMat);
    calfR.position.set(0, -0.1, 0);
    gorillaShinR.add(calfR);

    const gorillaFootR = new THREE.Group();
    gorillaFootR.position.set(0, -0.21, 0.05);
    gorillaShinR.add(gorillaFootR);

    const footBaseR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.4), soleMat);
    footBaseR.position.set(0, 0.04, -0.05);
    gorillaFootR.add(footBaseR);

    const footUpperR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), gorillaFurMat);
    footUpperR.position.set(0, 0.08, -0.05);
    footUpperR.scale.set(1.0, 0.6, 1.2);
    gorillaFootR.add(footUpperR);

    for (let i = 0; i < 4; i++) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), gorillaSkinMat);
      toe.position.set(-0.11 + i * 0.07, 0.05, 0.13);
      gorillaFootR.add(toe);
    }

    // 4. Authentic Gorilla Head Group
    const gorillaHeadGroup = new THREE.Group();
    gorillaHeadGroup.position.set(0, 0.55, 0.15);
    upperBody.add(gorillaHeadGroup);

    const gorillaHeadDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), gorillaFurMat);
    gorillaHeadDome.scale.set(1.1, 0.95, 1.0);
    gorillaHeadGroup.add(gorillaHeadDome);

    const crestGeom = new THREE.ConeGeometry(0.15, 0.35, 8);
    const crestMesh = new THREE.Mesh(crestGeom, gorillaFurMat);
    crestMesh.position.set(0, 0.38, -0.05);
    crestMesh.rotation.x = -0.2;
    gorillaHeadGroup.add(crestMesh);

    const crestBack = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), gorillaFurMat);
    crestBack.position.set(0, 0.3, -0.15);
    gorillaHeadGroup.add(crestBack);

    const facialMask = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), gorillaSkinMat);
    facialMask.position.set(0, -0.05, 0.14);
    facialMask.scale.set(1.0, 1.15, 0.7);
    gorillaHeadGroup.add(facialMask);

    const browL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8), gorillaFurMat);
    browL.position.set(-0.11, 0.12, 0.22);
    browL.rotation.z = 0.15;
    browL.rotation.x = Math.PI / 2;
    gorillaHeadGroup.add(browL);

    const browR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8), gorillaFurMat);
    browR.position.set(0.11, 0.12, 0.22);
    browR.rotation.z = -0.15;
    browR.rotation.x = Math.PI / 2;
    gorillaHeadGroup.add(browR);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), gorillaSkinMat);
    muzzle.position.set(0, -0.12, 0.22);
    muzzle.scale.set(1.15, 0.9, 0.8);
    gorillaHeadGroup.add(muzzle);

    const noseBridge = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), gorillaSkinMat);
    noseBridge.position.set(0, -0.01, 0.26);
    noseBridge.scale.set(1.3, 0.8, 1.0);
    gorillaHeadGroup.add(noseBridge);

    const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), mustacheMat);
    nostrilL.position.set(-0.045, -0.02, 0.32);
    gorillaHeadGroup.add(nostrilL);

    const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), mustacheMat);
    nostrilR.position.set(0.045, -0.02, 0.32);
    gorillaHeadGroup.add(nostrilR);

    const smileGeom = new THREE.TorusGeometry(0.11, 0.02, 6, 16, Math.PI);
    const smileMesh = new THREE.Mesh(smileGeom, mustacheMat);
    smileMesh.position.set(0, -0.14, 0.29);
    smileMesh.rotation.x = -0.1;
    smileMesh.rotation.z = Math.PI;
    gorillaHeadGroup.add(smileMesh);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), eyeWhiteMat);
    eyeL.position.set(-0.1, 0.05, 0.23);
    gorillaHeadGroup.add(eyeL);

    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeBlackMat);
    pupilL.position.set(-0.1, 0.05, 0.27);
    gorillaHeadGroup.add(pupilL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), eyeWhiteMat);
    eyeR.position.set(0.1, 0.05, 0.23);
    gorillaHeadGroup.add(eyeR);

    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeBlackMat);
    pupilR.position.set(0.1, 0.05, 0.27);
    gorillaHeadGroup.add(pupilR);

    const gEarL = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), gorillaFurMat);
    gEarL.position.set(-0.35, 0.0, 0);
    gEarL.rotation.y = -0.4;
    gorillaHeadGroup.add(gEarL);

    const innerEarL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), gorillaSkinMat);
    innerEarL.position.set(-0.34, 0.0, 0.02);
    gorillaHeadGroup.add(innerEarL);

    const gEarR = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), gorillaFurMat);
    gEarR.position.set(0.35, 0.0, 0);
    gEarR.rotation.y = 0.4;
    gorillaHeadGroup.add(gEarR);

    const innerEarR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), gorillaSkinMat);
    innerEarR.position.set(0.34, 0.0, 0.02);
    gorillaHeadGroup.add(innerEarR);

    // 5. Necktie with "DK" Logo
    const neckTieGroup = new THREE.Group();
    neckTieGroup.position.set(0, 0.38, 0.26);
    neckTieGroup.rotation.x = 0.12;
    upperBody.add(neckTieGroup);

    const tieKnot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.08, 8), gorillaTieMat);
    tieKnot.rotation.z = Math.PI / 2;
    neckTieGroup.add(tieKnot);

    const tieGeom = new THREE.ConeGeometry(0.08, 0.52, 4);
    const tieMesh = new THREE.Mesh(tieGeom, gorillaTieMat);
    tieMesh.position.set(0, -0.22, 0.02);
    tieMesh.rotation.y = Math.PI / 4;
    tieMesh.scale.set(1.5, 1.0, 0.5);
    neckTieGroup.add(tieMesh);

    const letterGroup = new THREE.Group();
    letterGroup.position.set(0, -0.15, 0.05);
    letterGroup.scale.set(0.7, 0.7, 0.7);
    neckTieGroup.add(letterGroup);

    const dGroup = new THREE.Group();
    dGroup.position.set(-0.06, 0.02, 0);
    letterGroup.add(dGroup);

    const dBar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.015), gorillaTieLogoMat);
    dGroup.add(dBar);

    const dCurve = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.0125, 6, 12, Math.PI), gorillaTieLogoMat);
    dCurve.position.set(0, 0, 0);
    dCurve.rotation.z = -Math.PI / 2;
    dGroup.add(dCurve);

    const kGroup = new THREE.Group();
    kGroup.position.set(0.05, 0.02, 0);
    letterGroup.add(kGroup);

    const kBar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.015), gorillaTieLogoMat);
    kGroup.add(kBar);

    const kDiagUp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.015), gorillaTieLogoMat);
    kDiagUp.position.set(0.028, 0.025, 0);
    kDiagUp.rotation.z = Math.PI / 4;
    kGroup.add(kDiagUp);

    const kDiagDown = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.015), gorillaTieLogoMat);
    kDiagDown.position.set(0.028, -0.025, 0);
    kDiagDown.rotation.z = -Math.PI / 4;
    kGroup.add(kDiagDown);

    const updateCharacterAppearance = (charId: string) => {
      // 1. Reset defaults
      capCap.visible = true;
      capDome.visible = true;
      visor.visible = true;
      emblem.visible = true;
      letterMGroup.visible = true;
      moustacheGroup.visible = false;
      hairGroup.visible = false;
      princessCrownGroup.visible = false;
      princessHairGroup.visible = false;
      princessDressGroup.visible = false;
      puffySleeveL.visible = false;
      puffySleeveR.visible = false;
      
      strapL.visible = false;
      strapR.visible = false;
      backStrapL.visible = false;
      backStrapR.visible = false;
      bibMesh.visible = true;
      pocketMesh.visible = true;
      buttonL.visible = false;
      buttonR.visible = false;
      
      bootLGroup.visible = true;
      bootRGroup.visible = true;
      torsoMesh.visible = true;

      armL.visible = true;
      armR.visible = true;
      legL.visible = true;
      legR.visible = true;
      headGroup.visible = true;
      overallsPants.visible = true;
      hipL.visible = false;
      hipR.visible = false;
      neckMesh.visible = true;
      cyberGorillaGroup.visible = false;

      // Reset legs & boots
      legL.scale.set(1.0, 1.0, 1.0);
      legR.scale.set(1.0, 1.0, 1.0);
      bootLGroup.scale.set(1.0, 1.0, 1.0);
      bootRGroup.scale.set(1.0, 1.0, 1.0);

      // 2. Set colors and custom meshes depending on character ID
      if (charId === 'cyber_runner' || charId === 'red_mario') {
        shirtMat.color.set('#e60012'); // Matte Cyber Red Jacket
        overallsMat.color.set('#0035bb'); // Matte Cobalt Blue Utility Trousers
        skinMat.color.set('#18181b'); // Sleek Matte Titanium Head Chassis
        gloveMat.color.set('#f4f4f5'); // Pure White Cyber Mittens
        bootMat.color.set('#e60012'); // Matte Red Cyber High-Tops
        eyeBlueMat.color.set('#00ffff'); // Neon Cyan Digital Eye-Plates
        eyeBlackMat.color.set('#00ffff');
        buttonMat.color.set('#00ffff');
      } else if (charId === 'blue_mario' || charId === 'cyan_runner') {
        shirtMat.color.set('#0052cc');
        overallsMat.color.set('#0a192f');
        skinMat.color.set('#0f172a');
        gloveMat.color.set('#e2e8f0');
        bootMat.color.set('#0052cc');
        eyeBlueMat.color.set('#00f0ff');
        eyeBlackMat.color.set('#00f0ff');
        buttonMat.color.set('#00f0ff');
      } else if (charId === 'green_mario' || charId === 'emerald_runner') {
        shirtMat.color.set('#10b981');
        overallsMat.color.set('#064e3b');
        skinMat.color.set('#18181b');
        gloveMat.color.set('#f4f4f5');
        bootMat.color.set('#10b981');
        eyeBlueMat.color.set('#34d399');
        eyeBlackMat.color.set('#34d399');
        buttonMat.color.set('#34d399');
      } else if (charId === 'yellow_mario' || charId === 'volt_runner') {
        shirtMat.color.set('#f59e0b');
        overallsMat.color.set('#4c1d95');
        skinMat.color.set('#18181b');
        gloveMat.color.set('#fef08a');
        bootMat.color.set('#f59e0b');
        eyeBlueMat.color.set('#fbbf24');
        eyeBlackMat.color.set('#fbbf24');
        buttonMat.color.set('#fbbf24');
      } else if (charId === 'cyber_gorilla') {
        // Hide standard Mario/Peach styling completely
        capCap.visible = false;
        capDome.visible = false;
        visor.visible = false;
        emblem.visible = false;
        letterMGroup.visible = false;
        moustacheGroup.visible = false;
        hairGroup.visible = false;
        
        strapL.visible = false;
        strapR.visible = false;
        backStrapL.visible = false;
        backStrapR.visible = false;
        bibMesh.visible = false;
        pocketMesh.visible = false;
        buttonL.visible = false;
        buttonR.visible = false;
        
        bootLGroup.visible = false;
        bootRGroup.visible = false;
        torsoMesh.visible = false;
        overallsPants.visible = false;
        hipL.visible = false;
        hipR.visible = false;
        neckMesh.visible = false;

        armL.visible = false;
        armR.visible = false;
        legL.visible = false;
        legR.visible = false;
        headGroup.visible = false;

        // Show our high-fidelity, powerful Cyber Gorilla!
        cyberGorillaGroup.visible = true;
      } else if (charId === 'princess_peach') {
        shirtMat.color.set('#ff1493');
        overallsMat.color.set('#ffb6c1');
        skinMat.color.set('#ffe4e1');
        mustacheMat.color.set('#ffdd33');
        gloveMat.color.set('#ffffff');
        bootMat.color.set('#ff69b4');
        eyeBlueMat.color.set('#00bfff');
        
        capCap.visible = false;
        capDome.visible = false;
        visor.visible = false;
        emblem.visible = false;
        letterMGroup.visible = false;
        moustacheGroup.visible = false;
        hairGroup.visible = false;
        
        // Overalls visibility reset for Princess
        strapL.visible = false;
        strapR.visible = false;
        backStrapL.visible = false;
        backStrapR.visible = false;
        bibMesh.visible = false;
        pocketMesh.visible = false;
        buttonL.visible = false;
        buttonR.visible = false;
        torsoMesh.visible = false;

        princessCrownGroup.visible = true;
        princessHairGroup.visible = true;
        princessDressGroup.visible = true;
        puffySleeveL.visible = true;
        puffySleeveR.visible = true;

        // Custom silver crown with red/blue jewels for Peach
        crownBase.material = crownBaseMat;

        // Soft feminine facial features scale down
        cheekL.scale.set(0.42, 0.42, 0.35);
        cheekR.scale.set(0.42, 0.42, 0.35);
        chinMesh.scale.set(0.5, 0.4, 0.5);
        noseMesh.scale.set(0.4, 0.4, 0.4);

        // Slender elegant legs and petite shoes
        legL.scale.set(0.7, 0.95, 0.7);
        legR.scale.set(0.7, 0.95, 0.7);
        bootLGroup.scale.set(0.75, 0.75, 0.75);
        bootRGroup.scale.set(0.75, 0.75, 0.75);
        
        // Materials for dress, folds and trims
        bodiceMesh.material = overallsMat; // light pink
        upperSkirt.material = overallsMat; // light pink
        lowerSkirt.material = overallsMat; // light pink
        skirtTrim.material = shirtMat; // hot pink
        puffySleeveL.material = overallsMat;
        puffySleeveR.material = overallsMat;
        broochGemMesh.material = broochGemBlueMat;

        foldMeshes.forEach(f => f.material = overallsMat);
        frillMeshes.forEach(fr => fr.material = shirtMat); // hot pink waist frills

        // Color hair
        const hairMeshes = [bangCenter, bangL, bangR, sideLockL, sideLockR, backLockUpper, backLockLower, flareL, flareR];
        hairMeshes.forEach(mesh => {
          mesh.material = peachHairMat;
        });
      } else if (charId === 'princess_daisy') {
        shirtMat.color.set('#ff6600');
        overallsMat.color.set('#ffcc00');
        skinMat.color.set('#ffe4e1');
        mustacheMat.color.set('#cd853f');
        gloveMat.color.set('#ffffff');
        bootMat.color.set('#ff6600');
        eyeBlueMat.color.set('#00bfff');
        
        capCap.visible = false;
        capDome.visible = false;
        visor.visible = false;
        emblem.visible = false;
        letterMGroup.visible = false;
        moustacheGroup.visible = false;
        hairGroup.visible = false;
        
        // Overalls visibility reset for Princess Daisy (authentic Daisy look!)
        strapL.visible = false;
        strapR.visible = false;
        backStrapL.visible = false;
        backStrapR.visible = false;
        bibMesh.visible = false;
        pocketMesh.visible = false;
        buttonL.visible = false;
        buttonR.visible = false;
        torsoMesh.visible = false;

        princessCrownGroup.visible = true;
        princessHairGroup.visible = true;
        princessDressGroup.visible = true;
        puffySleeveL.visible = true;
        puffySleeveR.visible = true;

        // Gold crown
        crownBase.material = crownBaseMat;

        // Soft feminine facial features scale down
        cheekL.scale.set(0.42, 0.42, 0.35);
        cheekR.scale.set(0.42, 0.42, 0.35);
        chinMesh.scale.set(0.5, 0.4, 0.5);
        noseMesh.scale.set(0.4, 0.4, 0.4);

        // Slender elegant legs and petite shoes
        legL.scale.set(0.7, 0.95, 0.7);
        legR.scale.set(0.7, 0.95, 0.7);
        bootLGroup.scale.set(0.75, 0.75, 0.75);
        bootRGroup.scale.set(0.75, 0.75, 0.75);
        
        // Materials for Daisy dress (Yellow gown, orange hem/bodice accent, white waist petals)
        bodiceMesh.material = overallsMat; // Yellow
        upperSkirt.material = overallsMat; // Yellow
        lowerSkirt.material = overallsMat; // Yellow
        skirtTrim.material = shirtMat; // Orange accent
        puffySleeveL.material = overallsMat;
        puffySleeveR.material = overallsMat;
        broochGemMesh.material = broochGemGreenMat; // Floral green jewel

        foldMeshes.forEach(f => f.material = overallsMat);
        
        // Daisy has clean white peplum petals at her waist
        const whitePetalMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
        frillMeshes.forEach(fr => fr.material = whitePetalMat);

        // Color hair ginger-brown
        const hairMeshes = [bangCenter, bangL, bangR, sideLockL, sideLockR, backLockUpper, backLockLower, flareL, flareR];
        hairMeshes.forEach(mesh => {
          mesh.material = daisyHairMat;
        });
      } else if (charId === 'rosalina') {
        shirtMat.color.set('#00acc1');
        overallsMat.color.set('#e0f7fa');
        skinMat.color.set('#ffe4e1');
        mustacheMat.color.set('#e6f2ff');
        gloveMat.color.set('#ffffff');
        bootMat.color.set('#00acc1');
        eyeBlueMat.color.set('#00e5ff');
        
        capCap.visible = false;
        capDome.visible = false;
        visor.visible = false;
        emblem.visible = false;
        letterMGroup.visible = false;
        moustacheGroup.visible = false;
        hairGroup.visible = false;
        
        // Overalls visibility reset for Rosalina
        strapL.visible = false;
        strapR.visible = false;
        backStrapL.visible = false;
        backStrapR.visible = false;
        bibMesh.visible = false;
        pocketMesh.visible = false;
        buttonL.visible = false;
        buttonR.visible = false;
        torsoMesh.visible = false;

        princessCrownGroup.visible = true;
        princessHairGroup.visible = true;
        princessDressGroup.visible = true;
        puffySleeveL.visible = true;
        puffySleeveR.visible = true;

        // Custom silver crown for Rosalina
        const silverCrownMat = new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.9, roughness: 0.1 });
        crownBase.material = silverCrownMat;

        // Soft feminine facial features scale down
        cheekL.scale.set(0.42, 0.42, 0.35);
        cheekR.scale.set(0.42, 0.42, 0.35);
        chinMesh.scale.set(0.5, 0.4, 0.5);
        noseMesh.scale.set(0.4, 0.4, 0.4);

        // Slender elegant legs and petite shoes
        legL.scale.set(0.7, 0.95, 0.7);
        legR.scale.set(0.7, 0.95, 0.7);
        bootLGroup.scale.set(0.75, 0.75, 0.75);
        bootRGroup.scale.set(0.75, 0.75, 0.75);
        
        // Materials for Rosalina's dress (Teal gown with light turquoise / white trims)
        bodiceMesh.material = shirtMat; // Teal
        upperSkirt.material = shirtMat; // Teal
        lowerSkirt.material = shirtMat; // Teal
        skirtTrim.material = overallsMat; // Pale cyan/white accent
        puffySleeveL.material = shirtMat;
        puffySleeveR.material = shirtMat;
        broochGemMesh.material = goldMat; // Golden star gem

        foldMeshes.forEach(f => f.material = shirtMat);
        frillMeshes.forEach(fr => fr.material = overallsMat); // pale accents

        // Color hair silver-blonde
        const hairMeshes = [bangCenter, bangL, bangR, sideLockL, sideLockR, backLockUpper, backLockLower, flareL, flareR];
        hairMeshes.forEach(mesh => {
          mesh.material = rosalinaHairMat;
        });
      }
    };

    marioGroup.add(headGroup);

    // Rainbow pulsing invincibility/shield overlay sphere
    const shieldSphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldSphereMat = new THREE.MeshStandardMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      roughness: 0.1,
      metalness: 0.9,
      emissive: '#00ffaa',
      emissiveIntensity: 0.5,
    });
    const shieldMesh = new THREE.Mesh(shieldSphereGeom, shieldSphereMat);
    shieldMesh.position.y = 0.75;
    marioGroup.add(shieldMesh);

    // Turn shadows on recursively for Mario
    marioGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(marioGroup);

    // Static unit geometries for 100% leak-free, high-performance scaling
    const unitBoxGeom = new THREE.BoxGeometry(1, 1, 1);
    const unitCylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 12);
    const unitSphereGeom = new THREE.SphereGeometry(1, 12, 12);
    const unitConeGeom = new THREE.ConeGeometry(1, 1, 12);

    // Global pre-allocated materials registry (0 allocations during active running)
    const sceneryMaterials = {
      metal: new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.9, roughness: 0.1 }),
      stone: new THREE.MeshStandardMaterial({ color: '#1a1412', roughness: 0.95 }),
      lava: new THREE.MeshStandardMaterial({ color: '#ff3300', emissive: '#ff2200', emissiveIntensity: 2.2, roughness: 0.2 }),
      whiteStone: new THREE.MeshStandardMaterial({ color: '#eef0f4', roughness: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.85, roughness: 0.15 }),
      bannerRed: new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.6 }),
      bannerBlue: new THREE.MeshStandardMaterial({ color: '#0044ff', roughness: 0.6 }),
      neonCyan: new THREE.MeshStandardMaterial({ color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 2.0, roughness: 0.1 }),
      neonMagenta: new THREE.MeshStandardMaterial({ color: '#ff00ff', emissive: '#ff00ff', emissiveIntensity: 2.0, roughness: 0.1 }),
      neonYellow: new THREE.MeshStandardMaterial({ color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 2.0, roughness: 0.1 }),
      neonYellowBasic: new THREE.MeshBasicMaterial({ color: '#ffd700' }),
      neonOrangeBasic: new THREE.MeshBasicMaterial({ color: '#ffaa00' }),
      neonCyanBasic: new THREE.MeshBasicMaterial({ color: '#00ffff' }),
      neonPinkBasic: new THREE.MeshBasicMaterial({ color: '#ff00ff' }),
      neonGreenBasic: new THREE.MeshBasicMaterial({ color: '#39ff14' }),
    };

    // --- CYBERMARIO HIGH-DOPAMINE POWER-UPS DEFINITIONS ---
    const laserGunGroup = new THREE.Group();
    const gunBody = new THREE.Mesh(unitBoxGeom, new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.8 }));
    gunBody.scale.set(0.18, 0.18, 0.5);
    const gunBarrel1 = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.neonMagenta);
    gunBarrel1.scale.set(0.04, 0.25, 0.04);
    gunBarrel1.rotation.x = Math.PI / 2;
    gunBarrel1.position.set(-0.06, 0, -0.3);
    const gunBarrel2 = gunBarrel1.clone();
    gunBarrel2.position.x = 0.06;
    laserGunGroup.add(gunBody, gunBarrel1, gunBarrel2);
    laserGunGroup.position.set(0.42, 0.65, 0.15);
    laserGunGroup.visible = false;
    marioGroup.add(laserGunGroup);

    const jetpackMeshGroup = new THREE.Group();
    const tank1 = new THREE.Mesh(unitCylinderGeom, new THREE.MeshStandardMaterial({ color: '#202020', metalness: 0.9, roughness: 0.1 }));
    tank1.scale.set(0.14, 0.55, 0.14);
    tank1.position.x = -0.16;
    const tank2 = tank1.clone();
    tank2.position.x = 0.16;
    const nozzle1 = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.neonCyan);
    nozzle1.scale.set(0.08, 0.15, 0.08);
    nozzle1.position.set(-0.16, -0.32, 0);
    const nozzle2 = nozzle1.clone();
    nozzle2.position.x = 0.16;
    const wingL = new THREE.Mesh(unitBoxGeom, new THREE.MeshStandardMaterial({ color: '#e60012' }));
    wingL.scale.set(0.18, 0.35, 0.05);
    wingL.position.set(-0.35, 0, -0.05);
    wingL.rotation.y = Math.PI / 8;
    const wingR = wingL.clone();
    wingR.position.x = 0.35;
    wingR.rotation.y = -Math.PI / 8;
    jetpackMeshGroup.add(tank1, tank2, nozzle1, nozzle2, wingL, wingR);
    jetpackMeshGroup.position.set(0, 0.65, -0.35);
    jetpackMeshGroup.visible = false;
    marioGroup.add(jetpackMeshGroup);

    const companionMaterials: THREE.MeshStandardMaterial[] = [];
    const registerCompanionMat = (mat: THREE.MeshStandardMaterial) => {
      companionMaterials.push(mat);
      return mat;
    };

    const princessCompanionGroup = new THREE.Group();

    // 1. PEACH GROUP DEFINITION
    const peachGroup = new THREE.Group();
    peachGroup.name = "Peach";
    peachGroup.visible = false;

    const peachSkinMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffe0bd',
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#ffe0bd',
      emissiveIntensity: 0.2
    }));

    const peachDressMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ff66b2', // beautiful bubblegum pink
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#ff3388',
      emissiveIntensity: 0.2
    }));

    const peachDressAccentMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ff3388', // hot pink
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#ff0055',
      emissiveIntensity: 0.2
    }));

    const compPeachHairMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffe033', // golden blonde
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#ffd700',
      emissiveIntensity: 0.15
    }));

    const goldCrownMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffd700', // high quality gold
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 1.0,
      emissive: '#b58a00',
      emissiveIntensity: 0.1
    }));

    const blueJewelMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 1.0,
      emissive: '#00e5ff',
      emissiveIntensity: 1.2
    }));

    const redJewelMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ff0055',
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 1.0,
      emissive: '#ff0055',
      emissiveIntensity: 1.2
    }));

    const whiteGloveMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#dddddd',
      emissiveIntensity: 0.1
    }));

    // --- DAISY MATERIAL & GROUP DEFINITIONS ---
    const daisyGroup = new THREE.Group();
    daisyGroup.name = "Daisy";
    daisyGroup.visible = false;

    const daisySkinMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffebd2',
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#ffebd2',
      emissiveIntensity: 0.15
    }));

    const daisyDressMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ffcc00', // vibrant yellow
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#e5ab00',
      emissiveIntensity: 0.15
    }));

    const daisyDressAccentMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#ff6600', // bright orange trim
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#e54c00',
      emissiveIntensity: 0.15
    }));

    const compDaisyHairMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#b35900', // warm auburn reddish-brown
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#994c00',
      emissiveIntensity: 0.1
    }));

    const greenJewelMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#00e676', // signature emerald green
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 1.0,
      emissive: '#00c853',
      emissiveIntensity: 1.0
    }));


    // --- ROSALINA MATERIAL & GROUP DEFINITIONS ---
    const rosalinaGroup = new THREE.Group();
    rosalinaGroup.name = "Rosalina";
    rosalinaGroup.visible = false;

    const rosalinaSkinMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#fff5eb', // pale skin
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#fff5eb',
      emissiveIntensity: 0.15
    }));

    const rosalinaDressMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#00e5ff', // ice-blue cyan / turquoise
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 1.0,
      emissive: '#00b0ff',
      emissiveIntensity: 0.15
    }));

    const rosalinaDressAccentMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#b2ffff', // light/silver accent trim
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
      emissive: '#80ffff',
      emissiveIntensity: 0.15
    }));

    const compRosalinaHairMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#e0f7fa', // platinum-blonde silver
      roughness: 0.5,
      metalness: 0.15,
      transparent: true,
      opacity: 1.0,
      emissive: '#b2ebf2',
      emissiveIntensity: 0.12
    }));

    const silverCrownMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#e0e0e0', // platinum/silver
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 1.0,
      emissive: '#9e9e9e',
      emissiveIntensity: 0.1
    }));

    const purpleJewelMat = registerCompanionMat(new THREE.MeshStandardMaterial({
      color: '#d500f9', // vibrant purple sapphire
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 1.0,
      emissive: '#aa00ff',
      emissiveIntensity: 1.0
    }));

    // Custom geometries for exquisite proportional detail
    const compBodiceGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.16, 16);
    const compUpperSkirtGeom = new THREE.CylinderGeometry(0.08, 0.18, 0.14, 18);
    const compLowerSkirtGeom = new THREE.CylinderGeometry(0.18, 0.32, 0.18, 18);
    const compSkirtTrimGeom = new THREE.CylinderGeometry(0.32, 0.33, 0.03, 18);
    const compFoldGeom = new THREE.CylinderGeometry(0.006, 0.015, 0.32, 8);
    const compWaistFrillGeom = new THREE.SphereGeometry(0.045, 12, 12);
    const compPuffySleeveGeom = new THREE.SphereGeometry(0.05, 12, 12);
    const compCrownSpikeGeom = new THREE.ConeGeometry(0.015, 0.04, 4);
    const compArmGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12);
    const compLegGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.10, 12);
    const numSpikes = 4;
    const earringPetals = 4;

    // Assemble Peach
    const peachGownGroup = new THREE.Group();
    peachGownGroup.name = "gown";

    // 1. ELEGANT FEMININE DRESS SILHOUETTE
    // Highly-detailed, smooth bell-shaped LatheGeometry ballgown
    const bellSkirtPoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = 0.12 + t * 0.36; // from bottom of skirt to waistline
      // Flared bell shape with beautiful curve
      const r = 0.075 + 0.26 * Math.pow(1 - t, 2.5);
      bellSkirtPoints.push(new THREE.Vector2(r, y));
    }
    const peachGownSkirtGeom = new THREE.LatheGeometry(bellSkirtPoints, 32);
    const peachLowerSkirt = new THREE.Mesh(peachGownSkirtGeom, peachDressMat);
    peachGownGroup.add(peachLowerSkirt);

    // Highly-detailed, slender contoured female bodice LatheGeometry
    const bellBodicePoints = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const y = 0.48 + t * 0.12; // from waist to chest/neck
      // Slight pinch at waist, expanding to bust
      const r = 0.072 + 0.018 * Math.sin(t * Math.PI / 2);
      bellBodicePoints.push(new THREE.Vector2(r, y));
    }
    const peachBodiceGeom = new THREE.LatheGeometry(bellBodicePoints, 32);
    const peachBodice = new THREE.Mesh(peachBodiceGeom, peachDressAccentMat);
    peachGownGroup.add(peachBodice);

    // Elegant fabric fold pleats draping naturally over the bell gown
    const peachFoldsGroup = new THREE.Group();
    peachGownGroup.add(peachFoldsGroup);
    const numPeachFolds = 10;
    for (let i = 0; i < numPeachFolds; i++) {
      const angle = (i * Math.PI * 2) / numPeachFolds;
      const foldMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.024, 0.36, 8), peachDressMat);
      // Position fold along the outer surface of the bell skirt
      const midY = 0.30;
      const tFold = (midY - 0.12) / 0.36;
      const rFold = 0.075 + 0.26 * Math.pow(1 - tFold, 2.5) + 0.005;
      const x = Math.cos(angle) * rFold;
      const z = Math.sin(angle) * rFold;
      foldMesh.position.set(x, midY, z);
      foldMesh.rotation.z = Math.cos(angle) * 0.38;
      foldMesh.rotation.x = -Math.sin(angle) * 0.38;
      foldMesh.rotation.y = -angle;
      peachFoldsGroup.add(foldMesh);
    }

    // Waistline pinch: elegant sash belt torus
    const peachSash = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 8, 24), peachDressAccentMat);
    peachSash.position.set(0, 0.48, 0);
    peachSash.rotation.x = Math.PI / 2;
    peachGownGroup.add(peachSash);

    // Peplum petals at waist
    const peachFrillsGroup = new THREE.Group();
    peachGownGroup.add(peachFrillsGroup);
    const numPeachFrills = 6;
    for (let i = 0; i < numPeachFrills; i++) {
      const angle = (i * Math.PI * 2) / numPeachFrills;
      const frill = new THREE.Mesh(compWaistFrillGeom, peachDressAccentMat);
      const r = 0.076;
      frill.position.set(Math.cos(angle) * r, 0.47, Math.sin(angle) * r);
      frill.scale.set(1.2, 0.5, 0.8);
      frill.rotation.y = -angle;
      frill.rotation.z = 0.35;
      peachFrillsGroup.add(frill);
    }

    // Blue brooch gem on chest
    const peachBroochBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 12), goldCrownMat);
    peachBroochBase.position.set(0, 0.57, 0.08);
    peachBroochBase.rotation.x = Math.PI / 3;
    peachGownGroup.add(peachBroochBase);

    const peachBroochGem = new THREE.Mesh(unitSphereGeom, blueJewelMat);
    peachBroochGem.scale.setScalar(0.013);
    peachBroochGem.position.set(0, 0.572, 0.084);
    peachGownGroup.add(peachBroochGem);

    peachGroup.add(peachGownGroup);

    // Left Arm Group (incorporating elegant puff sleeves blending into slender arm meshes)
    const peachArmL = new THREE.Group();
    peachArmL.name = "armL";
    peachArmL.position.set(-0.09, 0.55, 0);

    const peachSleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), peachDressMat);
    peachSleeveL.scale.set(1.1, 0.9, 1.1);
    peachSleeveL.position.set(0, 0.02, 0);
    peachArmL.add(peachSleeveL);

    const peachForearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.16, 12), whiteGloveMat);
    peachForearmL.position.set(0, -0.08, 0);
    peachArmL.add(peachForearmL);

    const peachHandL = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
    peachHandL.scale.setScalar(0.025);
    peachHandL.position.set(0, -0.15, 0);
    peachArmL.add(peachHandL);

    peachGroup.add(peachArmL);

    // Right Arm Group
    const peachArmR = new THREE.Group();
    peachArmR.name = "armR";
    peachArmR.position.set(0.09, 0.55, 0);

    const peachSleeveR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), peachDressMat);
    peachSleeveR.scale.set(1.1, 0.9, 1.1);
    peachSleeveR.position.set(0, 0.02, 0);
    peachArmR.add(peachSleeveR);

    const peachForearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.16, 12), whiteGloveMat);
    peachForearmR.position.set(0, -0.08, 0);
    peachArmR.add(peachForearmR);

    const peachHandR = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
    peachHandR.scale.setScalar(0.025);
    peachHandR.position.set(0, -0.15, 0);
    peachArmR.add(peachHandR);

    peachGroup.add(peachArmR);

    // Legs & Shoes under dress
    const peachLegL = new THREE.Group();
    peachLegL.name = "legL";
    peachLegL.position.set(-0.045, 0.14, 0);
    const peachLegLMesh = new THREE.Mesh(compLegGeom, peachDressMat);
    const peachShooL = new THREE.Mesh(unitSphereGeom, peachDressAccentMat);
    peachShooL.scale.set(0.025, 0.02, 0.035);
    peachShooL.position.set(0, -0.05, 0.015);
    peachLegL.add(peachLegLMesh, peachShooL);
    peachGroup.add(peachLegL);

    const peachLegR = new THREE.Group();
    peachLegR.name = "legR";
    peachLegR.position.set(0.045, 0.14, 0);
    const peachLegRMesh = new THREE.Mesh(compLegGeom, peachDressMat);
    const peachShooR = new THREE.Mesh(unitSphereGeom, peachDressAccentMat);
    peachShooR.scale.set(0.025, 0.02, 0.035);
    peachShooR.position.set(0, -0.05, 0.015);
    peachLegR.add(peachLegRMesh, peachShooR);
    peachGroup.add(peachLegR);

    // Head & Hair Group
    const peachHeadGroup = new THREE.Group();
    peachHeadGroup.position.y = 0.69;

    const peachHead = new THREE.Mesh(unitSphereGeom, peachSkinMat);
    peachHead.scale.setScalar(0.075);
    peachHeadGroup.add(peachHead);

    // Stylized layered organic blonde hair
    const peachHairGroup = new THREE.Group();

    // 1. Hair top base dome
    const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), compPeachHairMat);
    baseHair.position.set(0, 0.01, -0.01);
    peachHairGroup.add(baseHair);

    // 2. Front swept bangs wrapping face
    const compBangCenter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), compPeachHairMat);
    compBangCenter.position.set(0, 0.03, 0.065);
    compBangCenter.scale.set(1.4, 0.8, 0.8);

    const compBangL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), compPeachHairMat);
    compBangL.position.set(-0.032, 0.022, 0.06);
    compBangL.rotation.z = -0.25;
    compBangL.scale.set(1.1, 0.9, 0.9);

    const compBangR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), compPeachHairMat);
    compBangR.position.set(0.032, 0.022, 0.06);
    compBangR.rotation.z = 0.25;
    compBangR.scale.set(1.1, 0.9, 0.9);

    peachHairGroup.add(compBangCenter, compBangL, compBangR);

    // 3. Side lock curls framing face
    const sideCurlL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), compPeachHairMat);
    sideCurlL.position.set(-0.065, -0.02, 0.035);
    sideCurlL.scale.set(0.9, 2.5, 1.2);
    sideCurlL.rotation.z = 0.1;

    const sideCurlR = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), compPeachHairMat);
    sideCurlR.position.set(0.065, -0.02, 0.035);
    sideCurlR.scale.set(0.9, 2.5, 1.2);
    sideCurlR.rotation.z = -0.1;

    peachHairGroup.add(sideCurlL, sideCurlR);

    // 4. Back cascading locks flowing down back
    const backLocks = new THREE.Group();
    const numBackStrands = 5;
    for (let i = 0; i < numBackStrands; i++) {
      const strand = new THREE.Mesh(new THREE.SphereGeometry(0.045 - i * 0.005, 16, 16), compPeachHairMat);
      const yPos = -0.06 - i * 0.036;
      const zPos = -0.048 - Math.sin(i * 0.5) * 0.012;
      strand.position.set(0, yPos, zPos);
      strand.scale.set(1.0 + i * 0.1, 1.1, 0.85);
      backLocks.add(strand);
    }

    const compFlareL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), compPeachHairMat);
    compFlareL.position.set(-0.045, -0.1, -0.04);
    compFlareL.rotation.z = 0.3;
    compFlareL.scale.set(0.9, 1.8, 0.9);

    const compFlareR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), compPeachHairMat);
    compFlareR.position.set(0.045, -0.1, -0.04);
    compFlareR.rotation.z = -0.3;
    compFlareR.scale.set(0.9, 1.8, 0.9);

    backLocks.add(compFlareL, compFlareR);
    peachHairGroup.add(backLocks);
    peachHeadGroup.add(peachHairGroup);

    // Elegant earrings
    const earringL = new THREE.Mesh(unitSphereGeom, blueJewelMat);
    earringL.scale.setScalar(0.015);
    earringL.position.set(-0.085, -0.01, 0.01);
    const earringR = earringL.clone();
    earringR.position.x = 0.085;
    peachHeadGroup.add(earringL, earringR);

    // Eyes
    const peachEyeL_comp = new THREE.Mesh(unitSphereGeom, blueJewelMat);
    peachEyeL_comp.scale.set(0.008, 0.014, 0.005);
    peachEyeL_comp.position.set(-0.025, 0.01, 0.068);
    const peachEyeR_comp = peachEyeL_comp.clone();
    peachEyeR_comp.position.x = 0.025;
    peachHeadGroup.add(peachEyeL_comp, peachEyeR_comp);

    // High quality detailed golden crown (Torus base + spikes + jewels)
    const peachCrownGroup = new THREE.Group();
    peachCrownGroup.position.set(0, 0.082, 0.005);

    const peachCrownBase = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 8, 24), goldCrownMat);
    peachCrownBase.rotation.x = Math.PI / 2;
    peachCrownGroup.add(peachCrownBase);

    // Spikes with inset jewels
    const crownSpikes = 4;
    for (let i = 0; i < crownSpikes; i++) {
      const angle = (i * Math.PI * 2) / crownSpikes;
      const rx = Math.cos(angle) * 0.024;
      const rz = Math.sin(angle) * 0.024;

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.026, 4), goldCrownMat);
      spike.position.set(rx, 0.015, rz);
      spike.rotation.y = -angle;
      peachCrownGroup.add(spike);

      const jewelCol = i % 2 === 0 ? blueJewelMat : redJewelMat;
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), jewelCol);
      jewel.position.set(Math.cos(angle) * 0.028, 0.006, Math.sin(angle) * 0.028);
      peachCrownGroup.add(jewel);

      const spikeGem = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), jewelCol);
      spikeGem.position.set(rx, 0.028, rz);
      peachCrownGroup.add(spikeGem);
    }
    peachHeadGroup.add(peachCrownGroup);

    peachGroup.add(peachHeadGroup);


    // Assemble Daisy
    const daisyGownGroup = new THREE.Group();
    daisyGownGroup.name = "gown";

    const daisyBodice = new THREE.Mesh(compBodiceGeom, daisyDressAccentMat);
    daisyBodice.position.y = 0.53;
    daisyGownGroup.add(daisyBodice);

    const daisyUpperSkirt = new THREE.Mesh(compUpperSkirtGeom, daisyDressMat);
    daisyUpperSkirt.position.y = 0.40;
    daisyGownGroup.add(daisyUpperSkirt);

    const daisyLowerSkirt = new THREE.Mesh(compLowerSkirtGeom, daisyDressMat);
    daisyLowerSkirt.position.y = 0.24;
    daisyGownGroup.add(daisyLowerSkirt);

    const daisyRim = new THREE.Mesh(compSkirtTrimGeom, daisyDressAccentMat);
    daisyRim.position.y = 0.14;
    daisyGownGroup.add(daisyRim);

    // Dynamic fabric fold pleats for authentic volume shading
    const daisyFoldsGroup = new THREE.Group();
    daisyGownGroup.add(daisyFoldsGroup);
    for (let i = 0; i < numPeachFolds; i++) {
      const angle = (i * Math.PI * 2) / numPeachFolds;
      const foldMesh = new THREE.Mesh(compFoldGeom, daisyDressMat);
      const r = 0.23;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      foldMesh.position.set(x, 0.25, z);
      foldMesh.rotation.z = Math.cos(angle) * 0.25;
      foldMesh.rotation.x = -Math.sin(angle) * 0.25;
      foldMesh.rotation.y = -angle;
      daisyFoldsGroup.add(foldMesh);
    }

    // Waist peplum frills
    const daisyFrillsGroup = new THREE.Group();
    daisyGownGroup.add(daisyFrillsGroup);
    for (let i = 0; i < numPeachFrills; i++) {
      const angle = (i * Math.PI * 2) / numPeachFrills;
      const frill = new THREE.Mesh(compWaistFrillGeom, daisyDressAccentMat);
      const r = 0.08;
      frill.position.set(Math.cos(angle) * r, 0.47, Math.sin(angle) * r);
      frill.scale.set(1.3, 0.5, 0.9);
      frill.rotation.y = -angle;
      frill.rotation.z = 0.35;
      daisyFrillsGroup.add(frill);
    }

    // Emerald daisy flower brooch!
    const daisyBroochGroup = new THREE.Group();
    daisyBroochGroup.position.set(0, 0.57, 0.08);
    daisyBroochGroup.rotation.x = Math.PI / 3;
    // White petals
    const numPetals = 5;
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      const petal = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
      petal.scale.set(0.010, 0.005, 0.016);
      petal.position.set(Math.cos(angle) * 0.015, 0, Math.sin(angle) * 0.015);
      petal.rotation.y = -angle;
      daisyBroochGroup.add(petal);
    }
    const daisyBroochCenter = new THREE.Mesh(unitSphereGeom, greenJewelMat);
    daisyBroochCenter.scale.setScalar(0.011);
    daisyBroochCenter.position.set(0, 0.002, 0);
    daisyBroochGroup.add(daisyBroochCenter);
    daisyGownGroup.add(daisyBroochGroup);

    daisyGroup.add(daisyGownGroup);

    // Left Arm
    const daisyArmL = new THREE.Group();
    daisyArmL.name = "armL";
    daisyArmL.position.set(-0.09, 0.55, 0);

    const daisySleeveL = new THREE.Mesh(compPuffySleeveGeom, daisyDressMat);
    daisySleeveL.position.set(0, 0.02, 0);
    daisyArmL.add(daisySleeveL);

    // Daisy has skin colored arms with short white gloves at wrists
    const daisyForearmL = new THREE.Mesh(compArmGeom, daisySkinMat);
    daisyForearmL.position.set(0, -0.07, 0);
    daisyArmL.add(daisyForearmL);

    const daisyGloveL = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
    daisyGloveL.scale.setScalar(0.026);
    daisyGloveL.position.set(0, -0.14, 0);
    daisyArmL.add(daisyGloveL);

    daisyGroup.add(daisyArmL);

    // Right Arm
    const daisyArmR = new THREE.Group();
    daisyArmR.name = "armR";
    daisyArmR.position.set(0.09, 0.55, 0);

    const daisySleeveR = new THREE.Mesh(compPuffySleeveGeom, daisyDressMat);
    daisySleeveR.position.set(0, 0.02, 0);
    daisyArmR.add(daisySleeveR);

    const daisyForearmR = new THREE.Mesh(compArmGeom, daisySkinMat);
    daisyForearmR.position.set(0, -0.07, 0);
    daisyArmR.add(daisyForearmR);

    const daisyGloveR = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
    daisyGloveR.scale.setScalar(0.026);
    daisyGloveR.position.set(0, -0.14, 0);
    daisyArmR.add(daisyGloveR);

    daisyGroup.add(daisyArmR);

    // Legs & Shoes under dress
    const daisyLegL = new THREE.Group();
    daisyLegL.name = "legL";
    daisyLegL.position.set(-0.045, 0.14, 0);
    const daisyLegLMesh = new THREE.Mesh(compLegGeom, daisySkinMat);
    const daisyShooL = new THREE.Mesh(unitSphereGeom, daisyDressMat);
    daisyShooL.scale.set(0.025, 0.02, 0.035);
    daisyShooL.position.set(0, -0.05, 0.015);
    daisyLegL.add(daisyLegLMesh, daisyShooL);
    daisyGroup.add(daisyLegL);

    const daisyLegR = new THREE.Group();
    daisyLegR.name = "legR";
    daisyLegR.position.set(0.045, 0.14, 0);
    const daisyLegRMesh = new THREE.Mesh(compLegGeom, daisySkinMat);
    const daisyShooR = new THREE.Mesh(unitSphereGeom, daisyDressMat);
    daisyShooR.scale.set(0.025, 0.02, 0.035);
    daisyShooR.position.set(0, -0.05, 0.015);
    daisyLegR.add(daisyLegRMesh, daisyShooR);
    daisyGroup.add(daisyLegR);

    // Head & Hair Group
    const daisyHeadGroup = new THREE.Group();
    daisyHeadGroup.position.y = 0.69;

    const daisyHead = new THREE.Mesh(unitSphereGeom, daisySkinMat);
    daisyHead.scale.setScalar(0.075);
    daisyHeadGroup.add(daisyHead);

    // Hair top dome
    const daisyHairTop = new THREE.Mesh(unitSphereGeom, compDaisyHairMat);
    daisyHairTop.scale.set(0.084, 0.078, 0.084);
    daisyHairTop.position.set(0, 0.015, 0.005);
    daisyHeadGroup.add(daisyHairTop);

    // Front bangs
    const daisyBang1 = new THREE.Mesh(unitSphereGeom, compDaisyHairMat);
    daisyBang1.scale.set(0.032, 0.022, 0.02);
    daisyBang1.position.set(-0.025, 0.04, 0.062);
    const daisyBang2 = daisyBang1.clone();
    daisyBang2.position.x = 0.025;
    daisyHeadGroup.add(daisyBang1, daisyBang2);

    // Daisy signature flipped-out bob hair wings on left and right sides
    const daisyWingL = new THREE.Mesh(unitSphereGeom, compDaisyHairMat);
    daisyWingL.scale.set(0.042, 0.045, 0.032);
    daisyWingL.position.set(-0.072, -0.02, -0.01);
    daisyWingL.rotation.z = 0.35;
    const daisyWingR = daisyWingL.clone();
    daisyWingR.position.x = 0.072;
    daisyWingR.rotation.z = -0.35;
    daisyHeadGroup.add(daisyWingL, daisyWingR);

    // Back hair flips up
    const daisyHairBack = new THREE.Mesh(unitSphereGeom, compDaisyHairMat);
    daisyHairBack.scale.set(0.065, 0.055, 0.042);
    daisyHairBack.position.set(0, -0.05, -0.055);
    daisyHairBack.rotation.x = -0.18;
    daisyHeadGroup.add(daisyHairBack);

    // Emerald daisy earrings
    const daisyEarringL = new THREE.Group();
    daisyEarringL.position.set(-0.084, -0.01, 0.01);
    for (let i = 0; i < earringPetals; i++) {
      const angle = (i * Math.PI * 2) / earringPetals;
      const ep = new THREE.Mesh(unitSphereGeom, whiteGloveMat);
      ep.scale.setScalar(0.005);
      ep.position.set(Math.cos(angle) * 0.006, Math.sin(angle) * 0.006, 0);
      daisyEarringL.add(ep);
    }
    const earringCenterL = new THREE.Mesh(unitSphereGeom, greenJewelMat);
    earringCenterL.scale.setScalar(0.007);
    daisyEarringL.add(earringCenterL);
    const daisyEarringR = daisyEarringL.clone();
    daisyEarringR.position.x = 0.084;
    daisyHeadGroup.add(daisyEarringL, daisyEarringR);

    // Eyes
    const daisyEyeL = new THREE.Mesh(unitSphereGeom, blueJewelMat);
    daisyEyeL.scale.set(0.008, 0.014, 0.005);
    daisyEyeL.position.set(-0.025, 0.01, 0.068);
    const daisyEyeR = daisyEyeL.clone();
    daisyEyeR.position.x = 0.025;
    daisyHeadGroup.add(daisyEyeL, daisyEyeR);

    // Crown
    const daisyCrownGroup = new THREE.Group();
    daisyCrownGroup.position.set(0, 0.085, 0);

    const daisyCrownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.02, 12), goldCrownMat);
    daisyCrownGroup.add(daisyCrownBase);

    // Spikes with green jewel gems
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i * Math.PI * 2) / numSpikes;
      const spike = new THREE.Mesh(compCrownSpikeGeom, goldCrownMat);
      const r = 0.032;
      spike.position.set(Math.cos(angle) * r, 0.024, Math.sin(angle) * r);
      spike.rotation.y = -angle;
      const gem = new THREE.Mesh(unitSphereGeom, greenJewelMat);
      gem.scale.setScalar(0.007);
      gem.position.set(Math.cos(angle) * r, 0.045, Math.sin(angle) * r);
      daisyCrownGroup.add(spike, gem);
    }
    daisyHeadGroup.add(daisyCrownGroup);

    daisyGroup.add(daisyHeadGroup);


    // Assemble Rosalina
    const rosalinaGownGroup = new THREE.Group();
    rosalinaGownGroup.name = "gown";

    const rosalinaBodice = new THREE.Mesh(compBodiceGeom, rosalinaDressMat);
    rosalinaBodice.position.y = 0.53;
    rosalinaGownGroup.add(rosalinaBodice);

    const rosalinaUpperSkirt = new THREE.Mesh(compUpperSkirtGeom, rosalinaDressMat);
    rosalinaUpperSkirt.position.y = 0.40;
    rosalinaGownGroup.add(rosalinaUpperSkirt);

    const rosalinaLowerSkirt = new THREE.Mesh(compLowerSkirtGeom, rosalinaDressMat);
    rosalinaLowerSkirt.position.y = 0.24;
    rosalinaGownGroup.add(rosalinaLowerSkirt);

    const rosalinaRim = new THREE.Mesh(compSkirtTrimGeom, rosalinaDressAccentMat);
    rosalinaRim.position.y = 0.14;
    rosalinaGownGroup.add(rosalinaRim);

    // Dynamic fabric fold pleats
    const rosalinaFoldsGroup = new THREE.Group();
    rosalinaGownGroup.add(rosalinaFoldsGroup);
    for (let i = 0; i < numPeachFolds; i++) {
      const angle = (i * Math.PI * 2) / numPeachFolds;
      const foldMesh = new THREE.Mesh(compFoldGeom, rosalinaDressMat);
      const r = 0.23;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      foldMesh.position.set(x, 0.25, z);
      foldMesh.rotation.z = Math.cos(angle) * 0.25;
      foldMesh.rotation.x = -Math.sin(angle) * 0.25;
      foldMesh.rotation.y = -angle;
      rosalinaFoldsGroup.add(foldMesh);
    }

    // Waist peplum frills
    const rosalinaFrillsGroup = new THREE.Group();
    rosalinaGownGroup.add(rosalinaFrillsGroup);
    for (let i = 0; i < numPeachFrills; i++) {
      const angle = (i * Math.PI * 2) / numPeachFrills;
      const frill = new THREE.Mesh(compWaistFrillGeom, rosalinaDressAccentMat);
      const r = 0.08;
      frill.position.set(Math.cos(angle) * r, 0.47, Math.sin(angle) * r);
      frill.scale.set(1.3, 0.5, 0.9);
      frill.rotation.y = -angle;
      frill.rotation.z = 0.35;
      rosalinaFrillsGroup.add(frill);
    }

    // Yellow Star Brooch
    const starGroup = new THREE.Group();
    starGroup.position.set(0, 0.57, 0.08);
    starGroup.rotation.x = Math.PI / 3;
    const starPart1 = new THREE.Mesh(unitBoxGeom, goldCrownMat);
    starPart1.scale.set(0.026, 0.026, 0.008);
    starPart1.rotation.z = Math.PI / 4;
    const starPart2 = new THREE.Mesh(unitBoxGeom, goldCrownMat);
    starPart2.scale.set(0.018, 0.018, 0.008);
    starGroup.add(starPart1, starPart2);
    rosalinaGownGroup.add(starGroup);

    rosalinaGroup.add(rosalinaGownGroup);

    // Left Arm
    const rosalinaArmL = new THREE.Group();
    rosalinaArmL.name = "armL";
    rosalinaArmL.position.set(-0.09, 0.55, 0);

    const rosalinaSleeveL = new THREE.Mesh(compPuffySleeveGeom, rosalinaDressMat);
    rosalinaSleeveL.position.set(0, 0.02, 0);
    rosalinaArmL.add(rosalinaSleeveL);

    // Flared forearm sleeve
    const rosalinaForearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.14, 12), rosalinaDressAccentMat);
    rosalinaForearmL.position.set(0, -0.07, 0);
    rosalinaArmL.add(rosalinaForearmL);

    const rosalinaHandL = new THREE.Mesh(unitSphereGeom, rosalinaSkinMat);
    rosalinaHandL.scale.setScalar(0.022);
    rosalinaHandL.position.set(0, -0.14, 0);
    rosalinaArmL.add(rosalinaHandL);

    rosalinaGroup.add(rosalinaArmL);

    // Right Arm
    const rosalinaArmR = new THREE.Group();
    rosalinaArmR.name = "armR";
    rosalinaArmR.position.set(0.09, 0.55, 0);

    const rosalinaSleeveR = new THREE.Mesh(compPuffySleeveGeom, rosalinaDressMat);
    rosalinaSleeveR.position.set(0, 0.02, 0);
    rosalinaArmR.add(rosalinaSleeveR);

    // Flared forearm sleeve
    const rosalinaForearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.14, 12), rosalinaDressAccentMat);
    rosalinaForearmR.position.set(0, -0.07, 0);
    rosalinaArmR.add(rosalinaForearmR);

    const rosalinaHandR = new THREE.Mesh(unitSphereGeom, rosalinaSkinMat);
    rosalinaHandR.scale.setScalar(0.022);
    rosalinaHandR.position.set(0, -0.14, 0);
    rosalinaArmR.add(rosalinaHandR);

    rosalinaGroup.add(rosalinaArmR);

    // Legs & Shoes
    const rosalinaLegL = new THREE.Group();
    rosalinaLegL.name = "legL";
    rosalinaLegL.position.set(-0.045, 0.14, 0);
    const rosalinaLegLMesh = new THREE.Mesh(compLegGeom, rosalinaSkinMat);
    const rosalinaShooL = new THREE.Mesh(unitSphereGeom, rosalinaDressAccentMat);
    rosalinaShooL.scale.set(0.025, 0.02, 0.035);
    rosalinaShooL.position.set(0, -0.05, 0.015);
    rosalinaLegL.add(rosalinaLegLMesh, rosalinaShooL);
    rosalinaGroup.add(rosalinaLegL);

    const rosalinaLegR = new THREE.Group();
    rosalinaLegR.name = "legR";
    rosalinaLegR.position.set(0.045, 0.14, 0);
    const rosalinaLegRMesh = new THREE.Mesh(compLegGeom, rosalinaSkinMat);
    const rosalinaShooR = new THREE.Mesh(unitSphereGeom, rosalinaDressAccentMat);
    rosalinaShooR.scale.set(0.025, 0.02, 0.035);
    rosalinaShooR.position.set(0, -0.05, 0.015);
    rosalinaLegR.add(rosalinaLegRMesh, rosalinaShooR);
    rosalinaGroup.add(rosalinaLegR);

    // Head & Hair Group
    const rosalinaHeadGroup = new THREE.Group();
    rosalinaHeadGroup.position.y = 0.69;

    const rosalinaHead = new THREE.Mesh(unitSphereGeom, rosalinaSkinMat);
    rosalinaHead.scale.setScalar(0.075);
    rosalinaHeadGroup.add(rosalinaHead);

    // Hair top dome
    const rosalinaHairTop = new THREE.Mesh(unitSphereGeom, compRosalinaHairMat);
    rosalinaHairTop.scale.set(0.084, 0.078, 0.084);
    rosalinaHairTop.position.set(0, 0.015, 0.005);
    rosalinaHeadGroup.add(rosalinaHairTop);

    // Rosalina's sweeping front bang covering one eye
    const rosalinaSwoopBang = new THREE.Mesh(unitSphereGeom, compRosalinaHairMat);
    rosalinaSwoopBang.scale.set(0.04, 0.05, 0.04);
    rosalinaSwoopBang.position.set(0.025, 0.02, 0.062);
    rosalinaSwoopBang.rotation.z = 0.45;
    rosalinaHeadGroup.add(rosalinaSwoopBang);

    // Extra side swept lock
    const rosalinaSwoopExtra = new THREE.Mesh(unitSphereGeom, compRosalinaHairMat);
    rosalinaSwoopExtra.scale.set(0.035, 0.065, 0.02);
    rosalinaSwoopExtra.position.set(0.045, -0.03, 0.045);
    rosalinaHeadGroup.add(rosalinaSwoopExtra);

    // Long beautiful wavy silver hair draping down her back
    const rosalinaHairBack = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const strand = new THREE.Mesh(unitSphereGeom, compRosalinaHairMat);
      strand.scale.set(0.055 - i * 0.006, 0.09, 0.04);
      strand.position.set(0, -0.09 - i * 0.045, -0.055 + i * 0.005);
      strand.rotation.x = 0.12;
      rosalinaHairBack.add(strand);
    }
    // Flare sweeping lock on left side of her face
    const rosalinaFlockL = new THREE.Mesh(unitSphereGeom, compRosalinaHairMat);
    rosalinaFlockL.scale.set(0.03, 0.09, 0.03);
    rosalinaFlockL.position.set(-0.045, -0.07, -0.04);
    rosalinaFlockL.rotation.z = 0.15;
    rosalinaHairBack.add(rosalinaFlockL);
    rosalinaHeadGroup.add(rosalinaHairBack);

    // Purple jewel earrings
    const rosalinaEarringL = new THREE.Mesh(unitSphereGeom, purpleJewelMat);
    rosalinaEarringL.scale.setScalar(0.015);
    rosalinaEarringL.position.set(-0.084, -0.01, 0.01);
    const rosalinaEarringR = rosalinaEarringL.clone();
    rosalinaEarringR.position.x = 0.084;
    rosalinaHeadGroup.add(rosalinaEarringL, rosalinaEarringR);

    // Eyes
    const rosalinaEyeL = new THREE.Mesh(unitSphereGeom, blueJewelMat);
    rosalinaEyeL.scale.set(0.008, 0.014, 0.005);
    rosalinaEyeL.position.set(-0.025, 0.01, 0.068);
    const rosalinaEyeR = rosalinaEyeL.clone();
    rosalinaEyeR.position.x = 0.025;
    rosalinaHeadGroup.add(rosalinaEyeL, rosalinaEyeR);

    // Crown
    const rosalinaCrownGroup = new THREE.Group();
    rosalinaCrownGroup.position.set(0, 0.085, 0);

    const rosalinaCrownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.02, 12), silverCrownMat);
    rosalinaCrownGroup.add(rosalinaCrownBase);

    // Spikes with purple jewel gems
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i * Math.PI * 2) / numSpikes;
      const spike = new THREE.Mesh(compCrownSpikeGeom, silverCrownMat);
      const r = 0.032;
      spike.position.set(Math.cos(angle) * r, 0.024, Math.sin(angle) * r);
      spike.rotation.y = -angle;
      const gem = new THREE.Mesh(unitSphereGeom, purpleJewelMat);
      gem.scale.setScalar(0.007);
      gem.position.set(Math.cos(angle) * r, 0.045, Math.sin(angle) * r);
      rosalinaCrownGroup.add(spike, gem);
    }
    rosalinaHeadGroup.add(rosalinaCrownGroup);

    rosalinaGroup.add(rosalinaHeadGroup);

    // Add them all to the main companion group
    princessCompanionGroup.add(peachGroup, daisyGroup, rosalinaGroup);
    princessCompanionGroup.visible = false;
    scene.add(princessCompanionGroup);

    const createPowerUpMesh = (powerUpType: string) => {
      const g = new THREE.Group();
      const outerMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: powerUpType === 'laser' ? '#ff00ff' :
                  powerUpType === 'bounce' ? '#39ff14' :
                  powerUpType === 'jetpack' ? '#00ffff' :
                  powerUpType === 'princess' ? '#ff1493' :
                  powerUpType === 'magnet' ? '#ffcc00' : '#ffd700',
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.4,
        wireframe: true
      });
      const outerBox = new THREE.Mesh(unitSphereGeom, outerMat);
      outerBox.scale.setScalar(0.45);
      outerBox.position.y = 1.3;
      g.add(outerBox);

      let innerMesh: THREE.Object3D;
      if (powerUpType === 'laser') {
        const gunGroup = new THREE.Group();
        const body = new THREE.Mesh(unitBoxGeom, new THREE.MeshStandardMaterial({ color: '#2a2a2a' }));
        body.scale.set(0.12, 0.12, 0.35);
        const barrel = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.neonMagenta);
        barrel.scale.set(0.04, 0.2, 0.04);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.2;
        gunGroup.add(body, barrel);
        innerMesh = gunGroup;
      } else if (powerUpType === 'bounce') {
        const springGroup = new THREE.Group();
        const base = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.neonGreenBasic);
        base.scale.set(0.2, 0.05, 0.2);
        const ring1 = new THREE.Mesh(unitSphereGeom, new THREE.MeshStandardMaterial({ color: '#39ff14', emissive: '#39ff14', emissiveIntensity: 1.5 }));
        ring1.scale.set(0.16, 0.16, 0.16);
        ring1.position.y = 0.12;
        springGroup.add(base, ring1);
        innerMesh = springGroup;
      } else if (powerUpType === 'jetpack') {
        const jetGroup = new THREE.Group();
        const tankMat = new THREE.MeshStandardMaterial({ color: '#333333', metalness: 0.8, roughness: 0.2 });
        const cy1 = new THREE.Mesh(unitCylinderGeom, tankMat);
        cy1.scale.set(0.1, 0.35, 0.1);
        cy1.position.x = -0.12;
        const cy2 = cy1.clone();
        cy2.position.x = 0.12;
        const noz1 = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.neonCyan);
        noz1.scale.set(0.06, 0.1, 0.06);
        noz1.position.set(-0.12, -0.22, 0);
        const noz2 = noz1.clone();
        noz2.position.x = 0.12;
        jetGroup.add(cy1, cy2, noz1, noz2);
        innerMesh = jetGroup;
      } else if (powerUpType === 'princess') {
        const crownGroup = new THREE.Group();
        const crownBase = new THREE.Mesh(unitCylinderGeom, new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.9, roughness: 0.1 }));
        crownBase.scale.set(0.18, 0.08, 0.18);
        crownGroup.add(crownBase);
        innerMesh = crownGroup;
      } else if (powerUpType === 'magnet') {
        const magnetGroup = new THREE.Group();
        const redMat = new THREE.MeshStandardMaterial({ color: '#ff3300', roughness: 0.4 });
        const blueMat = new THREE.MeshStandardMaterial({ color: '#0088ff', roughness: 0.4 });
        const leg1 = new THREE.Mesh(unitCylinderGeom, redMat);
        leg1.scale.set(0.06, 0.25, 0.06);
        leg1.position.set(-0.12, 0, 0);
        const leg2 = new THREE.Mesh(unitCylinderGeom, blueMat);
        leg2.scale.set(0.06, 0.25, 0.06);
        leg2.position.set(0.12, 0, 0);
        magnetGroup.add(leg1, leg2);
        magnetGroup.rotation.z = Math.PI;
        innerMesh = magnetGroup;
      } else {
        const boltGroup = new THREE.Group();
        const box1 = new THREE.Mesh(unitBoxGeom, sceneryMaterials.neonYellow);
        box1.scale.set(0.12, 0.3, 0.06);
        box1.rotation.z = -Math.PI / 6;
        box1.position.set(0.06, 0.1, 0);
        const box2 = new THREE.Mesh(unitBoxGeom, sceneryMaterials.neonYellow);
        box2.scale.set(0.12, 0.3, 0.06);
        box2.rotation.z = -Math.PI / 6;
        box2.position.set(-0.06, -0.1, 0);
        boltGroup.add(box1, box2);
        innerMesh = boltGroup;
      }
      innerMesh.position.y = 1.3;
      innerMesh.name = "innerIcon";
      g.add(innerMesh);
      g.userData = { powerUpType };
      return g;
    };

    const spawnJetpackParticles = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        const pMesh = new THREE.Mesh(unitSphereGeom, sceneryMaterials.neonOrangeBasic);
        pMesh.scale.setScalar(0.06);
        const offsetX = i === 0 ? -0.15 : 0.15;
        pMesh.position.set(x + offsetX, y - 0.2, 0.3);
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -5 - Math.random() * 5,
          10 + Math.random() * 5
        );
        scene.add(pMesh);
        stateRef.current.particles.push({
          mesh: pMesh,
          velocity,
          life: 0.2 + Math.random() * 0.15,
        });
      }
    };

    const spawnNitroTrail = (x: number, y: number) => {
      const trailMat = new THREE.MeshBasicMaterial({
        color: '#ffd700',
        transparent: true,
        opacity: 0.7,
      });
      const trailMesh = new THREE.Mesh(unitBoxGeom, trailMat);
      trailMesh.scale.set(0.6, 0.05, 1.2);
      trailMesh.position.set(x, y + 0.1, 0.4);
      scene.add(trailMesh);
      stateRef.current.particles.push({
        mesh: trailMesh,
        velocity: new THREE.Vector3(0, 0, 15),
        life: 0.25,
      });
    };

    const spawnPrincessExplosion = (x: number, y: number) => {
      const colors = ['#ff00ff', '#00ffff', '#ff1493'];
      for (let i = 0; i < 18; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        const pMesh = new THREE.Mesh(unitBoxGeom, mat);
        pMesh.scale.setScalar(0.08 + Math.random() * 0.06);
        pMesh.position.set(x + (Math.random() - 0.5) * 0.6, y + 0.5 + (Math.random() - 0.5) * 0.6, -0.5);
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          4 + Math.random() * 6,
          (Math.random() - 0.5) * 8
        );
        scene.add(pMesh);
        stateRef.current.particles.push({
          mesh: pMesh,
          velocity,
          life: 0.4 + Math.random() * 0.3,
        });
      }
    };

    const spawnPrincessSmokeParticle = (x: number, y: number, color: string) => {
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
      });
      const pMesh = new THREE.Mesh(unitSphereGeom, mat);
      pMesh.scale.setScalar(0.04 + Math.random() * 0.04);
      pMesh.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y + 0.3 + (Math.random() - 0.5) * 0.4,
        -0.5 + (Math.random() - 0.5) * 0.2
      );
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        1.5 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      scene.add(pMesh);
      stateRef.current.particles.push({
        mesh: pMesh,
        velocity,
        life: 0.3 + Math.random() * 0.3,
      });
    };

    const spawnSkyCoins = () => {
      const state = stateRef.current;
      for (let i = 0; i < 12; i++) {
        const coinLane = state.playerLane;
        const zPos = -15 - i * 6.5;
        const yPos = 3.8 + Math.sin(i * 0.6) * 0.6;
        const entityDef: GameEntity & any = {
          id: `sky-coin-${Math.random()}`,
          type: 'COIN',
          lane: coinLane,
          z: zPos,
          y: yPos,
          hit: false,
          poolKey: 'COIN',
          isSkyCoin: true
        };
        const mesh = createCoinMesh();
        mesh.position.set(coinLane * state.laneWidth, yPos, zPos);
        scene.add(mesh);
        state.entities.push({ entityDef, mesh });
      }
    };

    const triggerPowerUp = (type: string) => {
      const state = stateRef.current;
      state.laserTime = 0;
      state.superBounceTime = 0;
      state.jetpackTime = 0;
      state.princessTime = 0;
      state.magnetTime = 0;
      state.nitroTime = 0;
      if (type !== 'jetpack' && state.playerY > 3.0) {
        state.playerY = 0;
        state.playerIsJumping = false;
        state.playerJumpVelocity = 0;
      }
      if (laserGunGroup) laserGunGroup.visible = false;
      if (jetpackMeshGroup) jetpackMeshGroup.visible = false;
      if (princessCompanionGroup) princessCompanionGroup.visible = false;

      if (type === 'laser') {
        state.laserTime = 10.0;
        if (laserGunGroup) laserGunGroup.visible = true;
      } else if (type === 'bounce') {
        state.superBounceTime = 10.0;
      } else if (type === 'jetpack') {
        state.jetpackTime = 10.0;
        if (jetpackMeshGroup) jetpackMeshGroup.visible = true;
        spawnSkyCoins();
      } else if (type === 'princess') {
        state.princessTime = 10.0;
        const princesses = ['Peach', 'Daisy', 'Rosalina'];
        state.princessCharId = princesses[Math.floor(Math.random() * princesses.length)];
        if (princessCompanionGroup) {
          princessCompanionGroup.visible = true;

          const peach = princessCompanionGroup.getObjectByName("Peach");
          const daisy = princessCompanionGroup.getObjectByName("Daisy");
          const rosalina = princessCompanionGroup.getObjectByName("Rosalina");
          if (peach) peach.visible = false;
          if (daisy) daisy.visible = false;
          if (rosalina) rosalina.visible = false;

          const activePrincess = princessCompanionGroup.getObjectByName(state.princessCharId);
          if (activePrincess) activePrincess.visible = true;

          // Reset all material opacities and trigger a brief neon emissive flash
          companionMaterials.forEach(m => {
            m.opacity = 1.0;
            m.emissiveIntensity = 2.0; // intense cinematic glow on spawn!
          });
        }
      } else if (type === 'magnet') {
        state.magnetTime = 10.0;
      } else if (type === 'nitro') {
        state.nitroTime = 10.0;
        state.invincibleTime = 10.0;
      }

      // Sync to React for high-dopamine modular PowerUp HUD overlay
      setActivePowerUp(type as PowerUpType);
      setPrincessCharId(type === 'princess' ? state.princessCharId : undefined);
      setActivationKey(Date.now());
    };

    stateRef.current.fireLaser = () => {
      const playerLane = stateRef.current.playerLane;
      const laneX = playerLane * stateRef.current.laneWidth;
      const beamMat = new THREE.MeshBasicMaterial({
        color: '#ff00ff',
        transparent: true,
        opacity: 0.95
      });
      const beamMesh = new THREE.Mesh(unitBoxGeom, beamMat);
      beamMesh.scale.set(0.15, 0.15, 80);
      beamMesh.position.set(laneX, stateRef.current.playerY + 0.6, -40);
      scene.add(beamMesh);
      stateRef.current.particles.push({
        mesh: beamMesh,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0.15
      });
      gameAudio.playBlockHit();

      stateRef.current.entities.forEach(({ entityDef, mesh }) => {
        if (entityDef.lane === playerLane && !entityDef.hit && !entityDef.isDying) {
          if (entityDef.z < 0 && entityDef.z > -80) {
            if (entityDef.type !== 'COIN' && entityDef.type !== 'POWERUP') {
              entityDef.hit = true;
              entityDef.isDying = true;
              entityDef.deathTime = 0.35;
              stateRef.current.score += 500;
              if (hudScoreRef.current) {
                hudScoreRef.current.textContent = stateRef.current.score.toLocaleString();
              }
              spawnScoreParticles(mesh.position.x, mesh.position.y + 0.5, entityDef.z, '#ff00ff');
              spawnScoreParticles(mesh.position.x, mesh.position.y + 0.5, entityDef.z, '#00ffff');
            }
          }
        }
      });
    };

    const buildingMaterials = Array.from({ length: 5 }, (_, i) => {
      const color = new THREE.Color().setHSL(0.72 + i * 0.05, 0.85, 0.08);
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.75,
      });
    });

    // Global pre-allocated level materials registry
    const levelMaterials = {
      1: {
        sidePlatform: sidePlatformMat,
        neonBorder: neonBorderMat,
        neonPink: neonPinkMat,
        pipe: pipeMat,
      },
      2: {
        sidePlatform: new THREE.MeshStandardMaterial({ color: '#1e0400', roughness: 0.3, metalness: 0.5 }),
        neonBorder: new THREE.MeshStandardMaterial({ color: '#ff5500', emissive: '#ff5500', emissiveIntensity: 1.5, roughness: 0.1 }),
        neonPink: new THREE.MeshStandardMaterial({ color: '#ffaa00', emissive: '#ffaa00', emissiveIntensity: 1.5, roughness: 0.1 }),
        pipe: new THREE.MeshStandardMaterial({ color: '#651a02', roughness: 0.3, metalness: 0.8, emissive: '#e63900', emissiveIntensity: 0.2 }),
      },
      3: {
        sidePlatform: new THREE.MeshStandardMaterial({ color: '#0e0c00', roughness: 0.3, metalness: 0.5 }),
        neonBorder: new THREE.MeshStandardMaterial({ color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 1.5, roughness: 0.1 }),
        neonPink: new THREE.MeshStandardMaterial({ color: '#cc0000', emissive: '#cc0000', emissiveIntensity: 1.5, roughness: 0.1 }),
        pipe: new THREE.MeshStandardMaterial({ color: '#241a00', roughness: 0.3, metalness: 0.8, emissive: '#ffd700', emissiveIntensity: 0.2 }),
      }
    };

    // 6. Endless Track Segment Pre-generation with beautiful Neon Light Pillars
    const tileLength = 20;
    const tileWidth = 8;
    const roadTiles: THREE.Group[] = [];

    for (let i = 0; i < 5; i++) {
      const tileGroup = new THREE.Group();

      const buildTileSubGroup = (levelNum: 1 | 2 | 3) => {
        const subGroup = new THREE.Group();
        const mats = levelMaterials[levelNum];

        // Brick main road
        const roadGeom = new THREE.PlaneGeometry(tileWidth, tileLength);
        const road = new THREE.Mesh(roadGeom, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        subGroup.add(road);

        // Flanking elevated barriers (receive shadow only for ultimate performance)
        const barrierGeom = new THREE.BoxGeometry(0.8, 0.4, tileLength);
        const barrierL = new THREE.Mesh(barrierGeom, mats.sidePlatform);
        barrierL.position.set(-tileWidth / 2 - 0.4, 0.2, 0);
        barrierL.receiveShadow = true;
        barrierL.castShadow = false;
        subGroup.add(barrierL);

        const barrierR = barrierL.clone();
        barrierR.position.x = tileWidth / 2 + 0.4;
        subGroup.add(barrierR);

        // Glowing Neon outline stripes
        const neonStripGeom = new THREE.BoxGeometry(0.08, 0.08, tileLength);
        const neonL = new THREE.Mesh(neonStripGeom, mats.neonBorder);
        neonL.position.set(-tileWidth / 2 + 0.02, 0.42, 0);
        subGroup.add(neonL);

        const neonR = neonL.clone();
        neonR.position.x = tileWidth / 2 - 0.02;
        subGroup.add(neonR);

        // Futuristic Neon Light Pillars with glowing physical point lights
        const pillarGeom = new THREE.CylinderGeometry(0.12, 0.16, 2.0, 8);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: levelNum === 2 ? '#220800' : levelNum === 3 ? '#1c1400' : '#221832',
          metalness: 0.8,
          roughness: 0.2,
        });

        // Left Pillar (Cyan/Orange/Yellow Bulb + Point Light)
        const pL = new THREE.Mesh(pillarGeom, pillarMat);
        pL.position.set(-tileWidth / 2 - 0.4, 1.0, -tileLength / 4);
        pL.castShadow = false;
        pL.receiveShadow = true;
        subGroup.add(pL);

        const bulbGeom = new THREE.SphereGeometry(0.24, 12, 12);
        const bulbL = new THREE.Mesh(bulbGeom, mats.neonBorder);
        bulbL.position.set(-tileWidth / 2 - 0.4, 2.1, -tileLength / 4);
        subGroup.add(bulbL);

        const lightLColor = levelNum === 1 ? '#00ffff' : levelNum === 2 ? '#ff5500' : '#ffd700';
        const lightL = new THREE.PointLight(lightLColor, 1.8, 12);
        lightL.position.set(-tileWidth / 2 - 0.4, 2.1, -tileLength / 4);
        subGroup.add(lightL);

        // Right Pillar (Pink/Yellow/Red Bulb + Point Light)
        const pR = new THREE.Mesh(pillarGeom, pillarMat);
        pR.position.set(tileWidth / 2 + 0.4, 1.0, tileLength / 4);
        pR.castShadow = false;
        pR.receiveShadow = true;
        subGroup.add(pR);

        const bulbR = new THREE.Mesh(bulbGeom, mats.neonPink);
        bulbR.position.set(tileWidth / 2 + 0.4, 2.1, tileLength / 4);
        subGroup.add(bulbR);

        const lightRColor = levelNum === 1 ? '#ff00ff' : levelNum === 2 ? '#ffaa00' : '#cc0000';
        const lightR = new THREE.PointLight(lightRColor, 1.8, 12);
        lightR.position.set(tileWidth / 2 + 0.4, 2.1, tileLength / 4);
        subGroup.add(lightR);

        return subGroup;
      };

      const g1 = buildTileSubGroup(1); g1.visible = true; tileGroup.add(g1);
      const g2 = buildTileSubGroup(2); g2.visible = false; tileGroup.add(g2);
      const g3 = buildTileSubGroup(3); g3.visible = false; tileGroup.add(g3);

      // Assign position along Z
      tileGroup.position.z = -i * tileLength;
      scene.add(tileGroup);
      stateRef.current.roadTiles.push(tileGroup);
    }

    // 7. Ambient Scenery Flanking (High-Detail Procedural Architecture & Roadside Lights)
    const sceneryItems: THREE.Group[] = [];

    const populateSceneryGroup = (g: THREE.Group, level: number, isRight: boolean, isRoadside: boolean) => {
      if (isRoadside) {
        // --- ROADSIDE DECORATIONS (Placed close to track barriers) ---
        if (level === 1) {
          // --- LEVEL 1 Theme: Cyberpunk Neon Streetlights & Highway Arches ---
          const choice = Math.random();
          if (choice < 0.38 && isRight) {
            // High-tech Neon Highway Arch spanning the entire track!
            const pillarMat = sceneryMaterials.metal;
            
            // Left Pillar (relative offset from right-side group position)
            const colL = new THREE.Mesh(unitCylinderGeom, pillarMat);
            colL.scale.set(0.15, 5.0, 0.15);
            colL.position.set(-10.4, 2.5, 0);
            g.add(colL);

            // Right Pillar
            const colR = new THREE.Mesh(unitCylinderGeom, pillarMat);
            colR.scale.set(0.15, 5.0, 0.15);
            colR.position.set(0, 2.5, 0);
            g.add(colR);

            // Crossbar spanning overhead
            const bar = new THREE.Mesh(unitBoxGeom, pillarMat);
            bar.scale.set(11.0, 0.2, 0.3);
            bar.position.set(-5.2, 5.0, 0);
            g.add(bar);

            // Glowing central signage box
            const centralSign = new THREE.Mesh(unitBoxGeom, sceneryMaterials.neonMagenta);
            centralSign.scale.set(1.6, 0.6, 0.1);
            centralSign.position.set(-5.2, 5.0, 0.16);
            g.add(centralSign);

            // Neon glowing line under the bar
            const line = new THREE.Mesh(unitBoxGeom, sceneryMaterials.neonCyan);
            line.scale.set(11.0, 0.08, 0.08);
            line.position.set(-5.2, 4.85, 0);
            g.add(line);
          } else if (choice < 0.72) {
            // Cyberpunk Streetlight with glowing bulb
            const postMat = sceneryMaterials.metal;
            const post = new THREE.Mesh(unitCylinderGeom, postMat);
            post.scale.set(0.07, 3.5, 0.07);
            post.position.set(0, 1.75, 0);
            g.add(post);

            // Overhanging bracket arm
            const arm = new THREE.Mesh(unitBoxGeom, postMat);
            arm.scale.set(0.5, 0.06, 0.06);
            arm.position.set(isRight ? -0.25 : 0.25, 3.4, 0);
            g.add(arm);

            // Colored bulb (Pink on Right, Cyan on Left)
            const bulbMat = isRight ? sceneryMaterials.neonMagenta : sceneryMaterials.neonCyan;
            const bulb = new THREE.Mesh(unitSphereGeom, bulbMat);
            bulb.scale.setScalar(0.14);
            bulb.position.set(isRight ? -0.5 : 0.5, 3.3, 0);
            g.add(bulb);

            // Real physical soft point-light projecting down onto track
            const lightColor = isRight ? '#ff00ff' : '#00ffff';
            const ptLight = new THREE.PointLight(lightColor, 1.4, 6);
            ptLight.position.set(isRight ? -0.5 : 0.5, 3.2, 0);
            g.add(ptLight);
          } else {
            // Floating Neon Advertising Hologram Board
            const stand = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.metal);
            stand.scale.set(0.04, 0.8, 0.04);
            stand.position.set(0, 0.4, 0);
            g.add(stand);

            const screen = new THREE.Mesh(unitBoxGeom, sceneryMaterials.neonCyan);
            screen.scale.set(0.8, 1.2, 0.04);
            screen.position.set(0, 2.2, 0);
            screen.rotation.y = isRight ? -0.3 : 0.3;
            g.add(screen);
          }
        } 
        else if (level === 2) {
          // --- LEVEL 2 Theme: Volcanic Magma Braziers & Molten Arches ---
          const choice = Math.random();
          if (choice < 0.38 && isRight) {
            // Molten Volcanic Stone Arch
            const stoneMat = sceneryMaterials.stone;
            const lavaMat = sceneryMaterials.lava;
            
            // Left Column
            const colL = new THREE.Mesh(unitCylinderGeom, stoneMat);
            colL.scale.set(0.28, 4.5, 0.28);
            colL.position.set(-10.4, 2.25, 0);
            g.add(colL);

            // Right Column
            const colR = new THREE.Mesh(unitCylinderGeom, stoneMat);
            colR.scale.set(0.28, 4.5, 0.28);
            colR.position.set(0, 2.25, 0);
            g.add(colR);

            // Crossbar
            const bar = new THREE.Mesh(unitBoxGeom, stoneMat);
            bar.scale.set(11.0, 0.3, 0.4);
            bar.position.set(-5.2, 4.5, 0);
            g.add(bar);

            // Glowing magma vein glowing across the top
            const magmaCore = new THREE.Mesh(unitBoxGeom, lavaMat);
            magmaCore.scale.set(10.6, 0.12, 0.44);
            magmaCore.position.set(-5.2, 4.5, 0);
            g.add(magmaCore);
          } else {
            // Lava brazier pillar torch
            const stoneMat = sceneryMaterials.stone;
            const pillar = new THREE.Mesh(unitBoxGeom, stoneMat);
            pillar.scale.set(0.22, 2.2, 0.22);
            pillar.position.set(0, 1.1, 0);
            g.add(pillar);

            // Brazier bowl
            const bowl = new THREE.Mesh(unitCylinderGeom, stoneMat);
            bowl.scale.set(0.25, 0.22, 0.25);
            bowl.position.set(0, 2.2, 0);
            g.add(bowl);

            // High intensity flickering magma fire flame cone
            const flame = new THREE.Mesh(unitConeGeom, sceneryMaterials.lava);
            flame.scale.set(0.16, 0.45, 0.16);
            flame.position.set(0, 2.45, 0);
            g.add(flame);

            // Fire light casting soft illumination
            const warmLight = new THREE.PointLight('#ff5500', 1.5, 7);
            warmLight.position.set(0, 2.5, 0);
            g.add(warmLight);
          }
        } 
        else {
          // --- LEVEL 3 Theme: Royal Citadel Crest Gates & Medieval Hanging Banners ---
          const choice = Math.random();
          if (choice < 0.38 && isRight) {
            // Royal Castle Gate Archway
            const goldMat = sceneryMaterials.gold;
            const whiteStone = sceneryMaterials.whiteStone;
            
            // Columns
            const colL = new THREE.Mesh(unitCylinderGeom, whiteStone);
            colL.scale.set(0.18, 4.5, 0.18);
            colL.position.set(-10.4, 2.25, 0);
            g.add(colL);

            const colR = new THREE.Mesh(unitCylinderGeom, whiteStone);
            colR.scale.set(0.18, 4.5, 0.18);
            colR.position.set(0, 2.25, 0);
            g.add(colR);

            // Cross beam
            const beam = new THREE.Mesh(unitBoxGeom, goldMat);
            beam.scale.set(11.0, 0.25, 0.35);
            beam.position.set(-5.2, 4.5, 0);
            g.add(beam);

            // Royal Center Shield
            const crest = new THREE.Mesh(unitSphereGeom, goldMat);
            crest.scale.set(0.4, 0.4, 0.16);
            crest.position.set(-5.2, 4.6, 0.2);
            g.add(crest);
          } else {
            // Royal Hanging Castle Banner
            const stoneMat = sceneryMaterials.whiteStone;
            const bannerMat = isRight ? sceneryMaterials.bannerRed : sceneryMaterials.bannerBlue;
            const goldMat = sceneryMaterials.gold;

            // Banner pole
            const pole = new THREE.Mesh(unitCylinderGeom, stoneMat);
            pole.scale.set(0.08, 3.8, 0.08);
            pole.position.set(0, 1.9, 0);
            g.add(pole);

            // Cross pole arm
            const arm = new THREE.Mesh(unitCylinderGeom, goldMat);
            arm.scale.set(0.03, 0.65, 0.03);
            arm.rotation.z = Math.PI / 2;
            arm.position.set(isRight ? -0.325 : 0.325, 3.4, 0);
            g.add(arm);

            // Fabric Banner
            const banner = new THREE.Mesh(unitBoxGeom, bannerMat);
            banner.scale.set(0.45, 1.4, 0.04);
            banner.position.set(isRight ? -0.325 : 0.325, 2.6, 0.03);
            g.add(banner);

            // Golden tassel border
            const trim = new THREE.Mesh(unitBoxGeom, goldMat);
            trim.scale.set(0.48, 0.08, 0.06);
            trim.position.set(isRight ? -0.325 : 0.325, 1.86, 0.03);
            g.add(trim);
          }
        }
      } 
      else {
        // --- HIGH-DETAIL SCENERY BACKGROUND BUILDINGS (Placed further back) ---
        if (level === 1) {
          // --- LEVEL 1: Cyberpunk Neon Skyscrapers (Multi-tiered, antennas, grids of glowing windows) ---
          const h = 18 + Math.random() * 20;
          const w = 4.0 + Math.random() * 4.5;
          const d = w;

          // Base structure - select from pre-compiled materials
          const bodyMat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
          const body = new THREE.Mesh(unitBoxGeom, bodyMat);
          body.scale.set(w, h, d);
          body.position.y = h / 2;
          g.add(body);

          // SOLID FOUNDATION extending down from y = 0 to y = -15
          const foundation = new THREE.Mesh(unitBoxGeom, bodyMat);
          foundation.scale.set(w, 15, d);
          foundation.position.y = -7.5;
          g.add(foundation);

          // Top Extruded Tier 2
          const h2 = 3 + Math.random() * 6;
          const w2 = w * 0.72;
          const tier2 = new THREE.Mesh(unitBoxGeom, bodyMat);
          tier2.scale.set(w2, h2, w2);
          tier2.position.set(0, h + h2 / 2, 0);
          g.add(tier2);

          // Mechanical antenna tower spire
          const antH = 4 + Math.random() * 6;
          const ant = new THREE.Mesh(unitCylinderGeom, sceneryMaterials.metal);
          ant.scale.set(0.1, antH, 0.1);
          ant.position.set(0, h + h2 + antH / 2, 0);
          g.add(ant);

          // Glowing tip beacon light
          const tipColorMat = Math.random() > 0.5 ? sceneryMaterials.neonCyan : sceneryMaterials.neonMagenta;
          const tip = new THREE.Mesh(unitSphereGeom, tipColorMat);
          tip.scale.setScalar(0.22);
          tip.position.set(0, h + h2 + antH, 0);
          g.add(tip);

          // Optimized glowing vertical lines running down the corners (Zero-lag Neon Accents!)
          const stripeMat = Math.random() > 0.5 ? sceneryMaterials.neonCyan : sceneryMaterials.neonMagenta;
          const stripeL = new THREE.Mesh(unitBoxGeom, stripeMat);
          stripeL.scale.set(0.12, h * 0.8, 0.12);
          stripeL.position.set(-w / 2 * 0.98, h / 2, d / 2 + 0.05);
          g.add(stripeL);

          const stripeR = new THREE.Mesh(unitBoxGeom, stripeMat);
          stripeR.scale.set(0.12, h * 0.8, 0.12);
          stripeR.position.set(w / 2 * 0.98, h / 2, d / 2 + 0.05);
          g.add(stripeR);

          if (Math.random() > 0.45) {
            const band = new THREE.Mesh(unitBoxGeom, stripeMat);
            band.scale.set(w * 1.04, 0.3, d * 1.04);
            band.position.set(0, h * 0.75, 0);
            g.add(band);
          }
        } 
        else if (level === 2) {
          // --- LEVEL 2: Volcanic Basalt Columns & Obsidian Spires (Organic stacked hexagons) ---
          const colsCount = 3 + Math.floor(Math.random() * 2);
          const centerH = 12 + Math.random() * 12;
          const stoneMat = sceneryMaterials.stone;
          const lavaMat = sceneryMaterials.lava;

          for (let i = 0; i < colsCount; i++) {
            const pH = centerH * (0.6 + Math.random() * 0.55);
            const pR = 1.2 + Math.random() * 1.5;

            // Hexagonal cylinders mimicking classic volcanic basalt structures
            const col = new THREE.Mesh(unitCylinderGeom, stoneMat);
            col.scale.set(pR, pH, pR);
            
            const offsetX = (i - (colsCount - 1) / 2) * (pR * 1.4);
            const offsetZ = (Math.random() - 0.5) * (pR * 1.1);
            col.position.set(offsetX, pH / 2, offsetZ);

            // Leaning basalt columns
            col.rotation.x = (Math.random() - 0.5) * 0.1;
            col.rotation.z = (Math.random() - 0.5) * 0.1;
            g.add(col);

            // Foundation column extending from 0 down to -15
            const baseCol = new THREE.Mesh(unitCylinderGeom, stoneMat);
            baseCol.scale.set(pR, 15, pR);
            baseCol.position.set(offsetX, -7.5, offsetZ);
            baseCol.rotation.x = col.rotation.x;
            baseCol.rotation.z = col.rotation.z;
            g.add(baseCol);

            // Lava flow cracks scrolling on basalt columns
            const veinH = 2 + Math.random() * 3;
            const vein = new THREE.Mesh(unitBoxGeom, lavaMat);
            vein.scale.set(0.08, veinH, pR * 1.82);
            vein.position.set(offsetX + (Math.random() - 0.5) * 0.1, Math.random() * (pH - 4) + 2, offsetZ);
            vein.rotation.y = Math.random() * Math.PI;
            g.add(vein);

            // High-fidelity glowing volcanic crystal at peak
            if (i === 0 || Math.random() > 0.72) {
              const gem = new THREE.Mesh(unitSphereGeom, lavaMat);
              gem.scale.set(pR * 0.45, pR * 0.63, pR * 0.45);
              gem.position.set(offsetX, pH + pR * 0.35, offsetZ);
              g.add(gem);

              // Red-orange physical ambient point light on crystal peaks
              const gemLight = new THREE.PointLight('#ff3300', 1.8, 12);
              gemLight.position.set(offsetX, pH + pR * 0.5, offsetZ);
              g.add(gemLight);
            }
          }
        } 
        else {
          // --- LEVEL 3: Golden Castle Citadels (Durable fortress towers with royal spires) ---
          const h = 16 + Math.random() * 10;
          const r = 2.4 + Math.random() * 1.6;

          const wallMat = sceneryMaterials.whiteStone;
          const goldMat = sceneryMaterials.gold;
          const roofMat = sceneryMaterials.bannerBlue;

          // Grand tower keep
          const keep = new THREE.Mesh(unitCylinderGeom, wallMat);
          keep.scale.set(r, h, r);
          keep.position.y = h / 2;
          g.add(keep);

          // Tower keep foundation extending down from y = 0 to y = -15
          const foundation = new THREE.Mesh(unitCylinderGeom, wallMat);
          foundation.scale.set(r, 15, r);
          foundation.position.y = -7.5;
          g.add(foundation);

          // Tower battlements (teeth)
          const battlements = 5;
          for (let b = 0; b < battlements; b++) {
            const angle = (b / battlements) * Math.PI * 2;
            const tx = Math.cos(angle) * (r - 0.15);
            const tz = Math.sin(angle) * (r - 0.15);

            const tooth = new THREE.Mesh(unitBoxGeom, wallMat);
            tooth.scale.set(0.5, 0.6, 0.4);
            tooth.position.set(tx, h + 0.3, tz);
            tooth.rotation.y = -angle;
            g.add(tooth);
          }

          // Gold crowning horizontal band
          const trim = new THREE.Mesh(unitCylinderGeom, goldMat);
          trim.scale.set(r + 0.08, 0.2, r + 0.08);
          trim.position.y = h - 0.4;
          g.add(trim);

          // Secondary conical castle roof turret
          const roofR = r * 0.85;
          const roofH = h * 0.4;
          const roof = new THREE.Mesh(unitConeGeom, roofMat);
          roof.scale.set(roofR, roofH, roofR);
          roof.position.y = h + roofH / 2;
          g.add(roof);

          // Gold pinnacle sphere
          const peak = new THREE.Mesh(unitSphereGeom, goldMat);
          peak.scale.setScalar(0.3);
          peak.position.y = h + roofH + 0.15;
          g.add(peak);

          // Standard waving castle banner
          const flagpole = new THREE.Mesh(unitCylinderGeom, goldMat);
          flagpole.scale.set(0.04, 1.8, 0.04);
          flagpole.position.set(0, h + roofH + 1.0, 0);
          g.add(flagpole);

          const flag = new THREE.Mesh(unitBoxGeom, sceneryMaterials.bannerRed);
          flag.scale.set(0.8, 0.4, 0.03);
          flag.position.set(0.4, h + roofH + 1.6, 0);
          g.add(flag);
        }
      }

      // Enable casting and receiving shadow mapping for visual realism (roadside only, skyscrapers disabled for zero shadow lag!)
      g.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = isRoadside;
          child.receiveShadow = isRoadside;
        }
      });
    };

    // Pre-generate background scenery items and staggered roadside decorations for ALL levels upfront!
    for (let z = -120; z < 20; z += 18) {
      // Background Skyscrapers
      const bL = new THREE.Group();
      bL.userData = { isRight: false, isRoadside: false };
      bL.position.set(-16 - Math.random() * 12, 0, z);
      const bL1 = new THREE.Group(); populateSceneryGroup(bL1, 1, false, false); bL1.visible = true; bL.add(bL1);
      const bL2 = new THREE.Group(); populateSceneryGroup(bL2, 2, false, false); bL2.visible = false; bL.add(bL2);
      const bL3 = new THREE.Group(); populateSceneryGroup(bL3, 3, false, false); bL3.visible = false; bL.add(bL3);
      scene.add(bL);
      sceneryItems.push(bL);

      const bR = new THREE.Group();
      bR.userData = { isRight: true, isRoadside: false };
      bR.position.set(16 + Math.random() * 12, 0, z);
      const bR1 = new THREE.Group(); populateSceneryGroup(bR1, 1, true, false); bR1.visible = true; bR.add(bR1);
      const bR2 = new THREE.Group(); populateSceneryGroup(bR2, 2, true, false); bR2.visible = false; bR.add(bR2);
      const bR3 = new THREE.Group(); populateSceneryGroup(bR3, 3, true, false); bR3.visible = false; bR.add(bR3);
      scene.add(bR);
      sceneryItems.push(bR);

      // Roadside decorations (Staggered along Z for natural cadence)
      const rL = new THREE.Group();
      rL.userData = { isRight: false, isRoadside: true };
      rL.position.set(-5.2, 0, z + 9);
      const rL1 = new THREE.Group(); populateSceneryGroup(rL1, 1, false, true); rL1.visible = true; rL.add(rL1);
      const rL2 = new THREE.Group(); populateSceneryGroup(rL2, 2, false, true); rL2.visible = false; rL.add(rL2);
      const rL3 = new THREE.Group(); populateSceneryGroup(rL3, 3, false, true); rL3.visible = false; rL.add(rL3);
      scene.add(rL);
      sceneryItems.push(rL);

      const rR = new THREE.Group();
      rR.userData = { isRight: true, isRoadside: true };
      rR.position.set(5.2, 0, z + 9);
      const rR1 = new THREE.Group(); populateSceneryGroup(rR1, 1, true, true); rR1.visible = true; rR.add(rR1);
      const rR2 = new THREE.Group(); populateSceneryGroup(rR2, 2, true, true); rR2.visible = false; rR.add(rR2);
      const rR3 = new THREE.Group(); populateSceneryGroup(rR3, 3, true, true); rR3.visible = false; rR.add(rR3);
      scene.add(rR);
      sceneryItems.push(rR);
    }
    stateRef.current.sceneryItems = sceneryItems;

    // Distant Peach's Castle centerpiece silhouette
    const castleGroup = new THREE.Group();
    castleGroup.position.set(0, -15, -130); // Grounded on the flat lower world floor!

    const castleBaseMat = new THREE.MeshStandardMaterial({ color: '#120422', roughness: 0.85 });
    const castleRoofMat = new THREE.MeshStandardMaterial({ color: '#ff1493', emissive: '#ff1493', emissiveIntensity: 1.0, roughness: 0.3 });

    // Castle foundation extending from y = -15 to y = 4 (height 19)
    const foundationCast = new THREE.Mesh(new THREE.BoxGeometry(16, 19, 10.5), castleBaseMat);
    foundationCast.position.y = 9.5;
    castleGroup.add(foundationCast);

    const baseCast = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 10), castleBaseMat);
    baseCast.position.y = 5 + 19;
    castleGroup.add(baseCast);

    const towerCast = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 16, 8), castleBaseMat);
    towerCast.position.set(0, 14 + 19, 0);
    castleGroup.add(towerCast);

    const roofCast = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 8), castleRoofMat);
    roofCast.position.set(0, 26 + 19, 0);
    castleGroup.add(roofCast);

    const sideT1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 6), castleBaseMat);
    sideT1.position.set(-6, 12 + 19, 2);
    castleGroup.add(sideT1);

    const sideR1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 6), castleRoofMat);
    sideR1.position.set(-6, 20.5 + 19, 2);
    castleGroup.add(sideR1);

    const sideT2 = sideT1.clone();
    sideT2.position.set(6, 12 + 19, 2);
    castleGroup.add(sideT2);

    const sideR2 = sideR1.clone();
    sideR2.position.set(6, 20.5 + 19, 2);
    castleGroup.add(sideR2);

    scene.add(castleGroup);

    // Procedural Glowing Cyber-City Skyline Texture
    const skylineCanvas = document.createElement('canvas');
    skylineCanvas.width = 128;
    skylineCanvas.height = 256;
    const skyCtx = skylineCanvas.getContext('2d')!;
    skyCtx.fillStyle = '#06030c';
    skyCtx.fillRect(0, 0, 128, 256);
    // Draw neon windows
    for (let y = 16; y < 240; y += 24) {
      for (let x = 8; x < 120; x += 16) {
        if (Math.random() > 0.3) {
          skyCtx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
          skyCtx.fillRect(x, y, 10, 12);
        }
      }
    }
    skyCtx.strokeStyle = '#ff00ff';
    skyCtx.lineWidth = 4;
    skyCtx.strokeRect(2, 2, 124, 252);

    const skylineTexture = new THREE.CanvasTexture(skylineCanvas);
    skylineTexture.wrapS = THREE.RepeatWrapping;
    skylineTexture.wrapT = THREE.RepeatWrapping;

    const skylineMat = new THREE.MeshStandardMaterial({
      color: '#0d071a',
      map: skylineTexture,
      emissive: '#ffffff',
      emissiveMap: skylineTexture,
      emissiveIntensity: 0.95,
      roughness: 0.45,
      metalness: 0.75
    });

    const skylineItems: THREE.Group[] = [];
    for (let i = 0; i < 8; i++) {
      const group = new THREE.Group();
      const bCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < bCount; j++) {
        const sw = 5 + Math.random() * 8;
        const sh = 35 + Math.random() * 45;
        const sd = 5 + Math.random() * 8;
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), skylineMat);
        bMesh.position.set(
          (j - (bCount - 1) / 2) * (sw * 0.9),
          sh / 2,
          (Math.random() - 0.5) * 10
        );
        group.add(bMesh);
      }
      const isRight = i % 2 === 0;
      const sx = isRight ? (32 + Math.random() * 20) : (-32 - Math.random() * 20);
      const sz = -150 + i * 20;
      group.position.set(sx, -15, sz);
      scene.add(group);
      skylineItems.push(group);
    }

    // Procedural Digital Cloud Texture
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d')!;
    cloudCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    cloudCtx.fillRect(0, 0, 512, 512);
    
    const grad = cloudCtx.createRadialGradient(256, 256, 0, 256, 256, 200);
    grad.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
    grad.addColorStop(0.5, 'rgba(255, 0, 255, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cloudCtx.fillStyle = grad;
    cloudCtx.beginPath();
    cloudCtx.arc(256, 256, 256, 0, Math.PI * 2);
    cloudCtx.fill();

    cloudCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    cloudCtx.lineWidth = 2;
    for (let y = 32; y < 512; y += 64) {
      cloudCtx.beginPath();
      cloudCtx.moveTo(0, y);
      cloudCtx.lineTo(512, y);
      cloudCtx.stroke();
    }
    for (let x = 32; x < 512; x += 64) {
      cloudCtx.beginPath();
      cloudCtx.moveTo(x, 0);
      cloudCtx.lineTo(x, 512);
      cloudCtx.stroke();
    }
    
    const digitalCloudTex = new THREE.CanvasTexture(cloudCanvas);
    digitalCloudTex.wrapS = THREE.RepeatWrapping;
    digitalCloudTex.wrapT = THREE.RepeatWrapping;
    digitalCloudTex.repeat.set(2, 2);

    const cloudPlaneGeom = new THREE.PlaneGeometry(120, 120);
    const cloudPlaneMat = new THREE.MeshBasicMaterial({
      map: digitalCloudTex,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const cloudPlanes: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const cp = new THREE.Mesh(cloudPlaneGeom, cloudPlaneMat);
      cp.rotation.x = Math.PI / 2;
      cp.position.set(
        (Math.random() - 0.5) * 40,
        24 + i * 3,
        -110 + i * 35
      );
      scene.add(cp);
      cloudPlanes.push(cp);
    }
    stateRef.current.clouds = cloudPlanes; // Legacy binding for safety

    // Cyberspace dust particle points system
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = -50 + Math.random() * 100;
      positions[i * 3 + 1] = -10 + Math.random() * 40;
      positions[i * 3 + 2] = -120 + Math.random() * 140;
      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 0.8,
        z: 1.0 + Math.random() * 2.0
      });
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.38,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ambientDust = new THREE.Points(particleGeom, particleMat);
    scene.add(ambientDust);

    // 8. Procedural obstacles/entities spawning with complete Object Pooling
    const pools: Record<string, THREE.Group[]> = {
      'COIN': [],
      'QUESTION_BLOCK': [],
      'BULLET_BILL': [],
      'PIPE': [],
      'FLOATING_PIPE': [],
      'GOOMBA': [],
      'SPIKED_SHELL': [],
      'PITFALL_1_STATIC': [],
      'PITFALL_1_MOVING': [],
      'PITFALL_2_STATIC': [],
      'GAS_CANISTER': [],
      'POWERUP_laser': [],
      'POWERUP_bounce': [],
      'POWERUP_jetpack': [],
      'POWERUP_princess': [],
      'POWERUP_magnet': [],
      'POWERUP_nitro': [],
    };

    // --- Dynamic Sky Obstacles System ---

    const createBombMesh = () => {
      const group = new THREE.Group();
      
      const bombSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 16),
        new THREE.MeshStandardMaterial({
          color: '#15151a',
          roughness: 0.15,
          metalness: 0.9,
          emissive: '#330000',
          emissiveIntensity: 0.6
        })
      );
      bombSphere.position.y = 0.7;
      group.add(bombSphere);

      const fuse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
        new THREE.MeshStandardMaterial({ color: '#cccccc', roughness: 0.8 })
      );
      fuse.position.set(0, 1.35, 0);
      fuse.rotation.z = 0.2;
      group.add(fuse);

      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ff4500' })
      );
      spark.position.set(0.07, 1.5, 0);
      group.add(spark);

      return group;
    };

    const createLightningMesh = () => {
      const group = new THREE.Group();
      
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 30, 6),
        new THREE.MeshStandardMaterial({
          color: '#00ffff',
          emissive: '#00ffff',
          emissiveIntensity: 4.0,
          transparent: true,
          opacity: 0.85
        })
      );
      beam.position.y = 15;
      group.add(beam);

      return group;
    };

    const createArrowClusterMesh = () => {
      const group = new THREE.Group();
      
      for (let i = 0; i < 3; i++) {
        const arrow = new THREE.Group();
        
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6),
          new THREE.MeshStandardMaterial({ color: '#ffaa00', roughness: 0.4 })
        );
        shaft.position.y = 0.7;
        arrow.add(shaft);

        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.35, 6),
          new THREE.MeshStandardMaterial({ color: '#ff0044', emissive: '#ff0022', emissiveIntensity: 1.2 })
        );
        tip.position.y = 1.4 + 0.175;
        arrow.add(tip);

        const fletch = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.25, 0.1),
          new THREE.MeshStandardMaterial({ color: '#ffffff' })
        );
        fletch.position.set(0, 0.15, 0);
        arrow.add(fletch);

        const ox = (i - 1) * 0.45;
        const oz = (i - 1) * 0.35;
        arrow.position.set(ox, 0, oz);
        arrow.rotation.x = Math.PI * 0.65; // Tilt down-forward
        
        group.add(arrow);
      }

      return group;
    };

    const createShockwaveMesh = () => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshBasicMaterial({
          color: '#ff2200',
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      return mesh;
    };

    const createCoinMesh = () => {
      const g = new THREE.Group();
      const coinMesh = new THREE.Mesh(coinGeom, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinMesh.position.y = 0.65;
      g.add(coinMesh);
      return g;
    };

    const createQuestionBlockMesh = () => {
      const g = new THREE.Group();
      const blockMesh = new THREE.Mesh(blockGeom, qBlockMat);
      blockMesh.position.y = 1.3;
      g.add(blockMesh);
      return g;
    };

    const createBulletBillMesh = () => {
      const g = new THREE.Group();
      const billMat = new THREE.MeshStandardMaterial({ color: '#121216', roughness: 0.15, metalness: 0.9 });
      
      const billBody = new THREE.Mesh(unitCylinderGeom, billMat);
      billBody.scale.set(0.6, 1.1, 0.6); // Cylindrical proportions
      billBody.rotation.x = Math.PI / 2;
      billBody.position.y = 1.0;
      g.add(billBody);

      const billNose = new THREE.Mesh(unitSphereGeom, billMat);
      billNose.scale.set(0.3, 0.3, 0.3);
      billNose.position.set(0, 1.0, 0.55);
      billNose.rotation.x = Math.PI / 2;
      g.add(billNose);

      // Angry glowing eyes
      const eyeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ff0033', emissiveIntensity: 2.2 });
      const eyeL = new THREE.Mesh(unitBoxGeom, eyeMat);
      eyeL.scale.set(0.1, 0.04, 0.04);
      eyeL.position.set(-0.18, 1.12, 0.38);
      eyeL.rotation.set(-0.2, 0.25, -0.15);
      g.add(eyeL);

      const eyeR = eyeL.clone();
      eyeR.position.x = 0.18;
      eyeR.rotation.y = -0.25;
      eyeR.rotation.z = 0.15;
      g.add(eyeR);

      // Dynamic jet flame at the rear
      const flame = new THREE.Mesh(unitConeGeom, sceneryMaterials.lava);
      flame.scale.set(0.18, 0.5, 0.18);
      flame.position.set(0, 1.0, -0.8);
      flame.rotation.x = -Math.PI / 2;
      g.add(flame);

      return g;
    };

    const createPipeMesh = () => {
      const g = new THREE.Group();
      const color = '#39ff14'; // Hot neon green
      const pipeHeight = 1.5;
      const customPipeMat = new THREE.MeshStandardMaterial({
        color, roughness: 0.3, metalness: 0.8, emissive: color, emissiveIntensity: 0.4
      });

      const body = new THREE.Mesh(unitCylinderGeom, customPipeMat);
      body.scale.set(0.55 * 2, pipeHeight, 0.55 * 2);
      body.position.y = pipeHeight / 2;
      g.add(body);

      const rim = new THREE.Mesh(unitCylinderGeom, customPipeMat);
      rim.scale.set(0.65 * 2, 0.4, 0.65 * 2);
      rim.position.y = pipeHeight - 0.1;
      g.add(rim);

      const rimGlowMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: color, emissiveIntensity: 2.0 });
      const topRing = new THREE.Mesh(unitCylinderGeom, rimGlowMat);
      topRing.scale.set(0.66 * 2, 0.05, 0.66 * 2);
      topRing.position.y = pipeHeight + 0.1;
      g.add(topRing);

      return g;
    };

    const createFloatingPipeMesh = () => {
      const g = new THREE.Group();
      const color = '#ff00ff'; // Neon pink gate
      const crossbar = new THREE.Mesh(crossbarGeom, new THREE.MeshStandardMaterial({ color: '#12121a', roughness: 0.2, metalness: 0.8 }));
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 3.2, 0);
      g.add(crossbar);

      const screenMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.0 });
      const screen = new THREE.Mesh(unitBoxGeom, screenMat);
      screen.scale.set(1.6, 0.55, 0.1);
      screen.position.set(0, 3.2, 0.1);
      g.add(screen);

      const sL = new THREE.Mesh(supportGeom, new THREE.MeshStandardMaterial({ color: '#0a0a0f', roughness: 0.3, metalness: 0.8 }));
      sL.position.set(-2.5, 1.5, 0);
      g.add(sL);

      const sR = sL.clone();
      sR.position.x = 2.5;
      g.add(sR);

      const collarMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5 });
      const collarL = new THREE.Mesh(unitCylinderGeom, collarMat);
      collarL.scale.set(0.38 * 2, 0.1, 0.38 * 2);
      collarL.position.set(-2.5, 1.8, 0);
      g.add(collarL);

      const collarR = collarL.clone();
      collarR.position.x = 2.5;
      g.add(collarR);

      return g;
    };

    const createGoombaMesh = () => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(stemGeom, goombaMat);
      stem.position.y = 0.2;
      g.add(stem);

      const cap = new THREE.Mesh(capGeom, goombaCapMat);
      cap.position.y = 0.35;
      g.add(cap);

      const eL = new THREE.Mesh(eyeGeom, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      eL.position.set(-0.15, 0.42, 0.42);
      eL.rotation.y = 0.1;
      eL.rotation.z = -0.15;
      g.add(eL);

      const eR = eL.clone();
      eR.position.x = 0.15;
      eR.rotation.z = 0.15;
      g.add(eR);

      const neonPupilsMat = new THREE.MeshStandardMaterial({ color: '#ff0055', emissive: '#ff0000', emissiveIntensity: 2.2 });
      const pL = new THREE.Mesh(pupilGeom, neonPupilsMat);
      pL.position.set(-0.15, 0.42, 0.46);
      g.add(pL);

      const pR = pL.clone();
      pR.position.x = 0.15;
      g.add(pR);

      return g;
    };

    const createSpikedShellMesh = () => {
      const g = new THREE.Group();
      const color = '#ff0055';
      const shellMat = new THREE.MeshStandardMaterial({
        color, roughness: 0.25, metalness: 0.75, emissive: color, emissiveIntensity: 0.6
      });
      const shell = new THREE.Mesh(unitSphereGeom, shellMat);
      shell.position.y = 0.45;
      shell.scale.set(1.2 * 0.45, 0.8 * 0.45, 0.45);
      g.add(shell);

      const ringMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: color, emissiveIntensity: 1.8 });
      const ring = new THREE.Mesh(unitCylinderGeom, ringMat);
      ring.scale.set(0.5 * 2, 0.12, 0.5 * 2);
      ring.position.y = 0.45;
      ring.rotation.x = Math.PI / 2;
      g.add(ring);

      const spikeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15 });
      const mainSpike = new THREE.Mesh(unitConeGeom, spikeMat);
      mainSpike.scale.set(0.08, 0.25, 0.08);
      mainSpike.position.set(0, 0.9, 0);
      g.add(mainSpike);

      const spikeL = mainSpike.clone();
      spikeL.position.set(-0.2, 0.8, -0.1);
      spikeL.rotation.z = 0.4;
      g.add(spikeL);

      const spikeR = mainSpike.clone();
      spikeR.position.set(0.2, 0.8, 0.1);
      spikeR.rotation.z = -0.4;
      g.add(spikeR);

      return g;
    };

    const createGasCanisterMesh = () => {
      const g = new THREE.Group();
      
      // Main canister body (cylinder)
      // Orange toxic theme
      const canisterColor = '#ff6600'; 
      const canisterMat = new THREE.MeshStandardMaterial({
        color: canisterColor,
        roughness: 0.15,
        metalness: 0.7,
        emissive: '#4d1a00',
        emissiveIntensity: 0.5
      });
      
      const body = new THREE.Mesh(unitCylinderGeom, canisterMat);
      body.scale.set(0.4, 0.8, 0.4); // slightly thick cylinder
      body.position.y = 0.4;
      g.add(body);
      
      // Top cap / Nozzle (black/metallic cylinder/sphere)
      const capMat = new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.2,
        metalness: 0.9
      });
      const cap = new THREE.Mesh(unitCylinderGeom, capMat);
      cap.scale.set(0.3, 0.1, 0.3);
      cap.position.y = 0.85;
      g.add(cap);
      
      const nozzle = new THREE.Mesh(unitCylinderGeom, capMat);
      nozzle.scale.set(0.12, 0.15, 0.12);
      nozzle.position.y = 0.95;
      g.add(nozzle);
      
      // Neon toxic green warning stripes/bands representing hazard
      const glowMat = new THREE.MeshStandardMaterial({
        color: '#39ff14', // Toxic neon green
        emissive: '#39ff14',
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });
      const bandTop = new THREE.Mesh(unitCylinderGeom, glowMat);
      bandTop.scale.set(0.41, 0.08, 0.41);
      bandTop.position.y = 0.6;
      g.add(bandTop);

      const bandBottom = new THREE.Mesh(unitCylinderGeom, glowMat);
      bandBottom.scale.set(0.41, 0.08, 0.41);
      bandBottom.position.y = 0.2;
      g.add(bandBottom);
      
      return g;
    };

    const createPitfallMesh = (isMoving: boolean, width: number) => {
      const g = new THREE.Group();
      const w = width === 2 ? stateRef.current.laneWidth * 1.85 : stateRef.current.laneWidth * 0.95;
      const d = 2.4;

      const voidGeom = new THREE.PlaneGeometry(w, d);
      const voidMat = new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.DoubleSide });
      const voidFloor = new THREE.Mesh(voidGeom, voidMat);
      voidFloor.rotation.x = -Math.PI / 2;
      voidFloor.position.y = 0.015;
      g.add(voidFloor);

      const rimMat = new THREE.MeshStandardMaterial({
        color: '#ff2200',
        emissive: '#ff2200',
        emissiveIntensity: 2.2,
        roughness: 0.1,
      });

      const rimLeft = new THREE.Mesh(unitBoxGeom, rimMat);
      rimLeft.scale.set(0.12, 0.04, d);
      rimLeft.position.set(-w / 2, 0.02, 0);
      g.add(rimLeft);

      const rimRight = new THREE.Mesh(unitBoxGeom, rimMat);
      rimRight.scale.set(0.12, 0.04, d);
      rimRight.position.set(w / 2, 0.02, 0);
      g.add(rimRight);

      const rimFront = new THREE.Mesh(unitBoxGeom, rimMat);
      rimFront.scale.set(w, 0.04, 0.12);
      rimFront.position.set(0, 0.02, -d / 2);
      g.add(rimFront);

      const rimBack = new THREE.Mesh(unitBoxGeom, rimMat);
      rimBack.scale.set(w, 0.04, 0.12);
      rimBack.position.set(0, 0.02, d / 2);
      g.add(rimBack);

      const shaftGeom = new THREE.BoxGeometry(w - 0.08, 3.5, d - 0.08);
      const shaftMat = new THREE.MeshBasicMaterial({ color: '#030107', side: THREE.BackSide });
      const shaft = new THREE.Mesh(shaftGeom, shaftMat);
      shaft.position.y = -1.75;
      g.add(shaft);

      const bottomGlowGeom = new THREE.PlaneGeometry(w - 0.08, d - 0.08);
      const bottomGlowMat = new THREE.MeshBasicMaterial({ color: '#dd3300' });
      const bottomGlow = new THREE.Mesh(bottomGlowGeom, bottomGlowMat);
      bottomGlow.rotation.x = -Math.PI / 2;
      bottomGlow.position.set(0, -3.48, 0);
      g.add(bottomGlow);

      if (isMoving) {
        const indicatorMat = new THREE.MeshStandardMaterial({
          color: '#00ffff',
          emissive: '#00ffff',
          emissiveIntensity: 1.8,
        });
        const arrowL = new THREE.Mesh(unitConeGeom, indicatorMat);
        arrowL.scale.set(0.15, 0.35, 0.15);
        arrowL.rotation.z = Math.PI / 2;
        arrowL.position.set(-w / 4, 0.1, 0);
        g.add(arrowL);

        const arrowR = new THREE.Mesh(unitConeGeom, indicatorMat);
        arrowR.scale.set(0.15, 0.35, 0.15);
        arrowR.rotation.z = -Math.PI / 2;
        arrowR.position.set(w / 4, 0.1, 0);
        g.add(arrowR);
      }

      return g;
    };

    // Pre-populate pools
    for (let i = 0; i < 15; i++) pools['COIN'].push(createCoinMesh());
    for (let i = 0; i < 6; i++) pools['QUESTION_BLOCK'].push(createQuestionBlockMesh());
    for (let i = 0; i < 4; i++) pools['BULLET_BILL'].push(createBulletBillMesh());
    for (let i = 0; i < 5; i++) pools['PIPE'].push(createPipeMesh());
    for (let i = 0; i < 4; i++) pools['FLOATING_PIPE'].push(createFloatingPipeMesh());
    for (let i = 0; i < 6; i++) pools['GOOMBA'].push(createGoombaMesh());
    for (let i = 0; i < 6; i++) pools['SPIKED_SHELL'].push(createSpikedShellMesh());
    for (let i = 0; i < 4; i++) pools['PITFALL_1_STATIC'].push(createPitfallMesh(false, 1));
    for (let i = 0; i < 4; i++) pools['PITFALL_1_MOVING'].push(createPitfallMesh(true, 1));
    for (let i = 0; i < 4; i++) pools['PITFALL_2_STATIC'].push(createPitfallMesh(false, 2));
    for (let i = 0; i < 6; i++) pools['GAS_CANISTER'].push(createGasCanisterMesh());
    for (let i = 0; i < 3; i++) pools['POWERUP_laser'].push(createPowerUpMesh('laser'));
    for (let i = 0; i < 3; i++) pools['POWERUP_bounce'].push(createPowerUpMesh('bounce'));
    for (let i = 0; i < 3; i++) pools['POWERUP_jetpack'].push(createPowerUpMesh('jetpack'));
    for (let i = 0; i < 3; i++) pools['POWERUP_princess'].push(createPowerUpMesh('princess'));
    for (let i = 0; i < 3; i++) pools['POWERUP_magnet'].push(createPowerUpMesh('magnet'));
    for (let i = 0; i < 3; i++) pools['POWERUP_nitro'].push(createPowerUpMesh('nitro'));

    // Save pools to state Ref
    stateRef.current.pools = pools;

    // --- GPU ASSET PRE-COMPILATION & MATERIAL WARM-UP ---
    // Temporarily make all level sub-groups visible so renderer.compile compiles ALL shader combinations!
    stateRef.current.sceneryItems.forEach((item) => {
      if (item.children[0]) item.children[0].visible = true;
      if (item.children[1]) item.children[1].visible = true;
      if (item.children[2]) item.children[2].visible = true;
    });
    stateRef.current.roadTiles.forEach((tile) => {
      if (tile.children[0]) tile.children[0].visible = true;
      if (tile.children[1]) tile.children[1].visible = true;
      if (tile.children[2]) tile.children[2].visible = true;
    });

    const compileGroup = new THREE.Group();
    scene.add(compileGroup);
    Object.values(pools).forEach((poolArray) => {
      poolArray.forEach((mesh) => {
        compileGroup.add(mesh);
      });
    });

    renderer.compile(scene, camera);

    // Clean up compile group
    scene.remove(compileGroup);

    // Restore correct initial visibility for game start (Level 1 visible, Level 2 & 3 hidden)
    stateRef.current.sceneryItems.forEach((item) => {
      if (item.children[0]) item.children[0].visible = true;
      if (item.children[1]) item.children[1].visible = false;
      if (item.children[2]) item.children[2].visible = false;
    });
    stateRef.current.roadTiles.forEach((tile) => {
      if (tile.children[0]) tile.children[0].visible = true;
      if (tile.children[1]) tile.children[1].visible = false;
      if (tile.children[2]) tile.children[2].visible = false;
    });

    // Set GPU warm-up loading finished
    setIsWarmedUp(true);

    const spawnEntity = (type: ObstacleType | 'COIN', lane: Lane, z: number) => {
      if (type === 'PITFALL') {
        const isMoving = Math.random() > 0.45;
        const width = (!isMoving && Math.random() > 0.6) ? 2 : 1;
        
        let poolKey = 'PITFALL_1_STATIC';
        if (isMoving && width === 1) poolKey = 'PITFALL_1_MOVING';
        else if (!isMoving && width === 2) poolKey = 'PITFALL_2_STATIC';
        
        const pool = stateRef.current.pools[poolKey];
        let mesh = pool && pool.pop();
        if (!mesh) {
          mesh = createPitfallMesh(isMoving, width);
        }

        mesh.position.set(lane * stateRef.current.laneWidth, 0, z);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.visible = true;

        const entityDef: GameEntity & any = {
          id: Math.random().toString(),
          type: 'PITFALL',
          lane,
          z,
          y: -0.1,
          hit: false,
          isMoving,
          width,
          speed: isMoving ? (2.0 + Math.random() * 2.0) : 0,
          slideSpeed: isMoving ? (2.0 + Math.random() * 2.0) * Math.pow(1.12, stateRef.current.activeLevel - 1) : 0,
          currentX: lane * stateRef.current.laneWidth,
          poolKey,
        };

        scene.add(mesh);
        stateRef.current.entities.push({ entityDef, mesh });
        return;
      }

      let poolKey: string = type;
      let powerUpType = 'laser';
      if (type === 'BLOCK') {
        const isBulletBill = Math.random() > 0.45;
        poolKey = isBulletBill ? 'BULLET_BILL' : 'QUESTION_BLOCK';
      } else if (type === 'GOOMBA') {
        const isShell = Math.random() > 0.5;
        poolKey = isShell ? 'SPIKED_SHELL' : 'GOOMBA';
      } else if (type === 'POWERUP') {
        const powerUpTypes = ['laser', 'bounce', 'jetpack', 'princess', 'magnet', 'nitro'];
        powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        poolKey = 'POWERUP_' + powerUpType;
      }

      const pool = stateRef.current.pools[poolKey];
      let mesh = pool && pool.pop();

      if (!mesh) {
        if (poolKey === 'COIN') mesh = createCoinMesh();
        else if (poolKey.startsWith('POWERUP_')) mesh = createPowerUpMesh(powerUpType);
        else if (poolKey === 'QUESTION_BLOCK') mesh = createQuestionBlockMesh();
        else if (poolKey === 'BULLET_BILL') mesh = createBulletBillMesh();
        else if (poolKey === 'PIPE') mesh = createPipeMesh();
        else if (poolKey === 'FLOATING_PIPE') mesh = createFloatingPipeMesh();
        else if (poolKey === 'GOOMBA') mesh = createGoombaMesh();
        else if (poolKey === 'GAS_CANISTER') mesh = createGasCanisterMesh();
        else mesh = createSpikedShellMesh();
      }

      mesh.position.set(lane * stateRef.current.laneWidth, 0, z);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      mesh.visible = true;

      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const entityDef: GameEntity & any = {
        id: Math.random().toString(),
        type: (poolKey === 'BULLET_BILL' || poolKey === 'QUESTION_BLOCK') ? 'BLOCK' : 
              (poolKey === 'SPIKED_SHELL' ? 'GOOMBA' : 
               poolKey.startsWith('POWERUP_') ? 'POWERUP' : type),
        lane,
        z,
        y: (poolKey === 'QUESTION_BLOCK' || poolKey === 'BULLET_BILL') ? 1.3 : 
           poolKey === 'COIN' ? 0.65 : 
           poolKey.startsWith('POWERUP_') ? 1.3 : 0,
        hit: false,
        poolKey,
        powerUpType,
      };

      if (poolKey === 'BULLET_BILL') {
        entityDef.y = 1.0;
        entityDef.speed = 18.0;
      }

      scene.add(mesh);
      stateRef.current.entities.push({ entityDef, mesh });
    };

    // Burst particles for golden reward feedback (leak-free)
    const spawnScoreParticles = (x: number, y: number, z: number, colorStr: string) => {
      let pColorMat = sceneryMaterials.neonYellowBasic;
      if (colorStr === '#ffd700') pColorMat = sceneryMaterials.neonYellowBasic;
      else if (colorStr === '#ff6600' || colorStr === '#ffaa00') pColorMat = sceneryMaterials.neonOrangeBasic;
      else if (colorStr === '#39ff14') pColorMat = sceneryMaterials.neonGreenBasic;
      else if (colorStr === '#00ffff') pColorMat = sceneryMaterials.neonCyanBasic;
      else if (colorStr === '#ff00ff') pColorMat = sceneryMaterials.neonPinkBasic;
      
      for (let i = 0; i < 8; i++) {
        const pMesh = new THREE.Mesh(unitSphereGeom, pColorMat);
        pMesh.scale.setScalar(0.08);
        pMesh.position.set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.5) * 0.4, z);

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          8 + Math.random() * 12,
          (Math.random() - 0.5) * 14
        );

        scene.add(pMesh);
        stateRef.current.particles.push({
          mesh: pMesh,
          velocity,
          life: 0.35 + Math.random() * 0.3,
        });
      }
    };

    // Clean, responsive camera resizing
    const handleResize = () => {
      const w = canvas.clientWidth || containerRef.current?.clientWidth || 800;
      const h = canvas.clientHeight || containerRef.current?.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // Dynamic container resize observer to prevent 0x0 canvas or frozen rendering on slow mounts
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Call initially to guarantee immediate non-zero canvas rendering
    handleResize();

    // Initial starting entities
    spawnEntity('COIN', 0, -18);
    spawnEntity('COIN', 0, -22);
    spawnEntity('COIN', 0, -26);

    let lastTime = performance.now();
    let frameId: number;
    let lastStatsSyncTime = 0;
    let lastRenderedCharacter = '';

    // Define color presets for smooth procedural transition between worlds
    const level1Top = new THREE.Color('#04010d');
    const level1Mid = new THREE.Color('#100523');
    const level1Bottom = new THREE.Color('#cc124d');

    const level2Top = new THREE.Color('#100200');
    const level2Mid = new THREE.Color('#2c0500');
    const level2Bottom = new THREE.Color('#e63900');

    const level3Top = new THREE.Color('#080700');
    const level3Mid = new THREE.Color('#171200');
    const level3Bottom = new THREE.Color('#bf8f00');

    // Dynamic transitioning states
    const activeTop = level1Top.clone();
    const activeMid = level1Mid.clone();
    const activeBottom = level1Bottom.clone();

    const activeFogColor = new THREE.Color('#1a0a2a');
    let activeFogDensity = 0.015;

    const activeAmbientColor = new THREE.Color('#ffffff');
    let activeAmbientIntensity = 0.65;

    const activeDirColor = new THREE.Color('#ffffff');
    let activeDirIntensity = 2.0;

    const activeRimColor = new THREE.Color('#bf00ff');
    let activeRimIntensity = 1.5;

    // Helper to handle obstacle crash
    const handleObstacleCrash = (entityDef: GameEntity & { isDying?: boolean; deathTime?: number }, mesh: THREE.Group) => {
      const state = stateRef.current;
      if (state.invincibleTime > 0) return; // immunity frames active

      if (state.shieldActive) {
        // Shield absorbs the crash, fading the obstacle away gracefully
        state.shieldActive = false;
        if (hudShieldRef.current) hudShieldRef.current.style.display = 'none';
        state.invincibleTime = 1.5; // brief flash immunity
        gameAudio.playBlockHit();
        state.cameraShake = 0.5;

        entityDef.hit = true;
        entityDef.isDying = true;
        entityDef.deathTime = 0.35;
        // Clone materials for fade out animation
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = child.material.clone();
          }
        });
        return;
      }

      // Damage player
      state.lives -= 1;

      // Update HUD lives hearts directly in DOM
      if (hudLivesRef.current) {
        const hearts = hudLivesRef.current.children;
        for (let idx = 0; idx < 3; idx++) {
          const heart = hearts[idx] as HTMLElement;
          if (heart) {
            if (idx < state.lives) {
              heart.className = 'text-lg transition-transform scale-100 text-red-500 text-neon-pink';
            } else {
              heart.className = 'text-lg transition-transform scale-75 text-neutral-700';
            }
          }
        }
      }

      onStatsChangeRef.current({ lives: state.lives });
      gameAudio.playHit();
      state.cameraShake = 0.7; // impact rumble

      if (state.lives <= 0) {
        state.status = 'GAMEOVER';
        onStatsChangeRef.current({ status: 'GAMEOVER' });
        gameAudio.playGameOver();

        // PERSIST RUN COINS AND UPDATE HIGH SCORE
        const earned = state.coins;
        const nextTotal = storage.addCoins(earned);
        storage.setHighScore(state.score);

        // MONETIZATION: Policy-compliant frequency-capped Interstitial (1 per 2 cycles with 120s cooldown)
        storage.incrementGameOverCount();
        setTimeout(() => {
          gameAdManager.handleGameOver();
        }, 850);
        
        setTimeout(() => {
          setTotalCoins(nextTotal);
          const isTrial = storage.isTemporaryTrial();
          if (isTrial) {
            storage.setSelectedCharacter('red_mario');
            storage.setTemporaryTrial(false);
            setSelectedCharacter('red_mario');
            setIsTemporaryTrial(false);
          }
        }, 0);
      } else {
        state.invincibleTime = 2.0; // flash immunity duration
      }
    };

    let frameCount = 0;
    const disposalQueue: THREE.Object3D[] = [];
    let prevActiveType: string | null = null;

    // --- GAME ENGINE ANIMATION LOOP (60 FPS OPTIMIZED) ---
    const gameLoop = (timestamp: number) => {
      frameId = requestAnimationFrame(gameLoop);
      frameCount++;

      // 1. Strict Guard Clauses on Every Ref and Vital 3D Object
      if (!canvasRef.current || !containerRef.current || !stateRef.current) {
        return;
      }
      if (!scene || !camera || !renderer || !marioGroup) {
        return;
      }

      try {
        const nowTime = typeof timestamp === 'number' && !isNaN(timestamp) ? timestamp : performance.now();
        let rawDelta = (nowTime - lastTime) / 1000;
        if (isNaN(rawDelta) || rawDelta <= 0 || rawDelta > 0.1) {
          rawDelta = 0.0166; // Fallback to constant safe 16.6ms to avoid freeze/spikes
        }
        const delta = rawDelta;
        lastTime = nowTime;

        const state = stateRef.current;

      // Update character appearance if selection changed
      const activeChar = state.selectedCharacter || 'red_mario';
      if (activeChar !== lastRenderedCharacter) {
        lastRenderedCharacter = activeChar;
        updateCharacterAppearance(activeChar);
      }

      if (state.status === 'IDLE') {
        // Render the scene during IDLE (main menu) so that the character model, road, and ambient background are fully visible
        // while skipping intensive physics, scoring, or obstacle generation updates.
        renderer.render(scene, camera);
        return;
      }

      if (state.status === 'PAUSED') {
        renderer.render(scene, camera);
        return;
      }

      // Decay camera vibration
      if (state.cameraShake > 0) {
        state.cameraShake -= delta * 3;
        if (state.cameraShake < 0) state.cameraShake = 0;
      }

      if (state.status === 'RUNNING') {
        // Calculate dynamic sub-level based on distance traveled (sub-level changes every 300 meters, max 10)
        const calculatedLevel = Math.min(10, Math.floor(state.distance / 300) + 1);
        if (calculatedLevel !== state.activeLevel) {
          state.activeLevel = calculatedLevel;
          state.currentSpawnLevel = calculatedLevel;
          scene.background = activeFogColor; // Dynamic background Color reference
          gameAudio.playBlockHit(); // Level up chime
          triggerLevelUpBanner(calculatedLevel);
        }

        // --- Procedural Multi-World System dynamic environment transitions ---
        // Grab current active map theme configuration
        const mapTheme = MAP_THEMES[state.activeMap || 1] || MAP_THEMES[1];
        
        let tTop = new THREE.Color(mapTheme.topColor);
        let tMid = new THREE.Color(mapTheme.midColor);
        let tBottom = new THREE.Color(mapTheme.bottomColor);
        let tFogColor = new THREE.Color(mapTheme.fogColor);
        let tFogDensity = mapTheme.fogDensity;
        let tAmbientColor = new THREE.Color(mapTheme.ambientColor);
        let tAmbientIntensity = mapTheme.ambientIntensity;
        let tDirColor = new THREE.Color(mapTheme.dirColor);
        let tDirIntensity = mapTheme.dirIntensity;
        let tRimColor = new THREE.Color(mapTheme.rimColor);
        let tRimIntensity = mapTheme.rimIntensity;

        // Custom material theme target colors (materials will lerp towards these)
        let tNeonBorder = new THREE.Color(mapTheme.neonBorder);
        let tNeonPink = new THREE.Color(mapTheme.neonPink);
        let tPipe = new THREE.Color(mapTheme.pipeColor);
        let tPipeEm = new THREE.Color(mapTheme.pipeEmissive);
        let tSidePlatform = new THREE.Color(mapTheme.sidePlatform);

        // Smoothly interpolate active colors towards level target colors over 180 frames (approx. 3 seconds)
        const lerpSpeed = delta * 0.35;
        
        const oldTopHex = activeTop.getHexString();
        const oldMidHex = activeMid.getHexString();
        const oldBottomHex = activeBottom.getHexString();

        activeTop.lerp(tTop, lerpSpeed);
        activeMid.lerp(tMid, lerpSpeed);
        activeBottom.lerp(tBottom, lerpSpeed);

        activeFogColor.lerp(tFogColor, lerpSpeed);
        activeFogDensity += (tFogDensity - activeFogDensity) * lerpSpeed;

        activeAmbientColor.lerp(tAmbientColor, lerpSpeed);
        activeAmbientIntensity += (tAmbientIntensity - activeAmbientIntensity) * lerpSpeed;

        activeDirColor.lerp(tDirColor, lerpSpeed);
        activeDirIntensity += (tDirIntensity - activeDirIntensity) * lerpSpeed;

        activeRimColor.lerp(tRimColor, lerpSpeed);
        activeRimIntensity += (tRimIntensity - activeRimIntensity) * lerpSpeed;

        // Update the material colors dynamically in real-time
        if (typeof neonBorderMat !== 'undefined') {
          neonBorderMat.color.lerp(tNeonBorder, lerpSpeed);
          neonBorderMat.emissive.lerp(tNeonBorder, lerpSpeed);
        }
        if (typeof neonPinkMat !== 'undefined') {
          neonPinkMat.color.lerp(tNeonPink, lerpSpeed);
          neonPinkMat.emissive.lerp(tNeonPink, lerpSpeed);
        }
        if (typeof pipeMat !== 'undefined') {
          pipeMat.color.lerp(tPipe, lerpSpeed);
          pipeMat.emissive.lerp(tPipeEm, lerpSpeed);
        }
        if (typeof sidePlatformMat !== 'undefined') {
          sidePlatformMat.color.lerp(tSidePlatform, lerpSpeed);
        }

        // Apply smooth lerping to Scene with Blinding Fog Event Support
        let currentFogDensity = activeFogDensity;
        let fogIntensity = 0.0;

        if (state.fogBlockActive) {
          state.fogBlockTime -= delta;
          const elapsed = state.fogBlockDuration - state.fogBlockTime;
          if (elapsed < 0.25) {
            fogIntensity = elapsed / 0.25; // 0.25s Fade-in
          } else if (state.fogBlockTime < 0.4) {
            fogIntensity = Math.max(0, state.fogBlockTime / 0.4); // 0.4s Dissolve / Fade-out
          } else {
            fogIntensity = 1.0;
          }

          // Suddenly cover screen by shifting scene.fog.density dynamically up to 0.15
          currentFogDensity = THREE.MathUtils.lerp(activeFogDensity, 0.15, fogIntensity);

          if (state.fogBlockTime <= 0) {
            state.fogBlockActive = false;
          }
        }

        // Zero-allocation, pre-compiled quad opacity update (completely lag-free!)
        if (typeof fogQuadMat !== 'undefined') {
          fogQuadMat.opacity = fogIntensity * 0.94;
        }

        if (scene.fog && scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(activeFogColor);
          scene.fog.density = currentFogDensity;
        }
        ambientLight.color.copy(activeAmbientColor);
        ambientLight.intensity = activeAmbientIntensity;

        dirLight.color.copy(activeDirColor);
        dirLight.intensity = activeDirIntensity;

        rimLight.color.copy(activeRimColor);
        rimLight.intensity = activeRimIntensity;

        // Render updated Sky Gradient Canvas
        if (activeTop.getHexString() !== oldTopHex || activeMid.getHexString() !== oldMidHex || activeBottom.getHexString() !== oldBottomHex) {
          const hexTop = '#' + activeTop.getHexString();
          const hexMid = '#' + activeMid.getHexString();
          const hexBottom = '#' + activeBottom.getHexString();

          const bgGradNew = bgCtx.createLinearGradient(0, 0, 0, 512);
          bgGradNew.addColorStop(0, hexTop);
          bgGradNew.addColorStop(0.4, hexMid);
          bgGradNew.addColorStop(1, hexBottom);
          bgCtx.fillStyle = bgGradNew;
          bgCtx.fillRect(0, 0, 256, 512);
          bgTexture.needsUpdate = true;
        }

        // 1. Exponential speed acceleration based on distance traveled and map index
        const baseSpeed = 15.0 + (state.activeMap - 1) * 1.5;
        state.speed = Math.min(baseSpeed * Math.pow(1.055, calculatedLevel - 1), 40.0);

        // 2. Dynamic camera FOV widening slightly as speed increases
        const baseFov = 55;
        camera.fov = baseFov + (state.speed - baseSpeed) * 0.75;
        camera.updateProjectionMatrix();

        // Advance distance run and update DOM HUD directly
        state.distance += state.speed * delta;
        if (state.distance >= 3000) {
          state.distance = 3000;
          if (hudDistanceRef.current) {
            hudDistanceRef.current.textContent = `3000m`;
          }
          // Update bar progress and indicator to 100%
          const progressPct = 100;
          const fillEl = document.getElementById('hud-progress-fill');
          const marioEl = document.getElementById('hud-progress-mario');
          const sublevelEl = document.getElementById('hud-sublevel-val');
          if (fillEl) fillEl.style.width = `${progressPct}%`;
          if (marioEl) marioEl.style.left = `${progressPct}%`;
          if (sublevelEl) sublevelEl.textContent = '10';

          state.status = 'PAUSED';
          stateRef.current.status = 'PAUSED';
          
          // Trigger victory event
          gameAudio.stopBGM();
          gameAudio.playBlockHit();
          
          // Mark map completed & unlock next
          setMapCompleted(true);
          onStatsChangeRef.current({ status: 'PAUSED' });

          // PERSIST RUN COINS AND UPDATE HIGH SCORE
          const earned = state.coins;
          const nextTotal = storage.addCoins(earned);
          storage.setHighScore(state.score);
          
          setTimeout(() => {
            setTotalCoins(nextTotal);
            const isTrial = storage.isTemporaryTrial();
            if (isTrial) {
              storage.setSelectedCharacter('red_mario');
              storage.setTemporaryTrial(false);
              setSelectedCharacter('red_mario');
              setIsTemporaryTrial(false);
            }
          }, 0);
          
          const nextMap = state.activeMap + 1;
          if (nextMap <= 10) {
            const newUnlocked = storage.unlockMap(nextMap);
            setUnlockedMaps(newUnlocked);
          }
          return;
        }

        if (hudDistanceRef.current) {
          hudDistanceRef.current.textContent = `${Math.floor(state.distance)}m`;
        }

        // Update horizontal progress bar & moving indicator in real-time
        const progressPct = Math.min(100, (state.distance / 3000) * 100);
        const fillEl = document.getElementById('hud-progress-fill');
        const marioEl = document.getElementById('hud-progress-mario');
        const sublevelEl = document.getElementById('hud-sublevel-val');
        if (fillEl) fillEl.style.width = `${progressPct}%`;
        if (marioEl) marioEl.style.left = `${progressPct}%`;
        if (sublevelEl) sublevelEl.textContent = state.activeLevel.toString();

        // Add passive score ticks based on distance run
        if (nowTime - state.lastDistanceScoreTime > 300) {
          state.score += Math.floor(state.speed * 0.15);
          if (hudScoreRef.current) {
            hudScoreRef.current.textContent = state.score.toLocaleString();
          }
          state.lastDistanceScoreTime = nowTime;
        }

        // Update Invincibility frame timer
        if (state.invincibleTime > 0) {
          state.invincibleTime -= delta;
          marioGroup.visible = Math.floor(nowTime / 100) % 2 === 0;
        } else {
          marioGroup.visible = true;
        }

        // Decrement shield timer if active
        if (state.shieldActive && state.shieldTime > 0) {
          state.shieldTime -= delta;
          if (hudShieldTimeRef.current) {
            hudShieldTimeRef.current.innerText = Math.ceil(state.shieldTime).toString();
          }
          if (state.shieldTime <= 0) {
            state.shieldActive = false;
            if (hudShieldRef.current) {
              hudShieldRef.current.style.display = 'none';
            }
          }
        }

        // Pulse shield sphere visual if active
        if (shieldSphereMat) {
          if (state.shieldActive) {
            shieldSphereMat.opacity = 0.45 + Math.sin(nowTime * 0.015) * 0.15;
            if (shieldMesh) {
              shieldMesh.rotation.y += delta * 1.5;
              shieldMesh.rotation.z += delta * 0.8;
            }
          } else {
            shieldSphereMat.opacity = 0.0;
          }
        }

        // --- HIGH-DOPAMINE POWER-UPS DECREMENTS & EFFECTS ---
        let anyPowerUpActive = false;
        let activePowerUpType = '';
        let activePowerUpRemaining = 0;

        if (state.laserTime > 0) {
          state.laserTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'laser';
          activePowerUpRemaining = state.laserTime;
        } else if (state.superBounceTime > 0) {
          state.superBounceTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'bounce';
          activePowerUpRemaining = state.superBounceTime;
        } else if (state.jetpackTime > 0) {
          state.jetpackTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'jetpack';
          activePowerUpRemaining = state.jetpackTime;
        } else if (state.princessTime > 0) {
          state.princessTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'princess';
          activePowerUpRemaining = state.princessTime;
        } else if (state.magnetTime > 0) {
          state.magnetTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'magnet';
          activePowerUpRemaining = state.magnetTime;
        } else if (state.nitroTime > 0) {
          state.nitroTime -= delta;
          anyPowerUpActive = true;
          activePowerUpType = 'nitro';
          activePowerUpRemaining = state.nitroTime;
        }

        // Update React state for PowerUpHUD on transition
        let currentActiveType: string | null = null;
        if (state.laserTime > 0) {
          currentActiveType = 'laser';
        } else if (state.superBounceTime > 0) {
          currentActiveType = 'bounce';
        } else if (state.jetpackTime > 0) {
          currentActiveType = 'jetpack';
        } else if (state.princessTime > 0) {
          currentActiveType = 'princess';
        } else if (state.magnetTime > 0) {
          currentActiveType = 'magnet';
        } else if (state.nitroTime > 0) {
          currentActiveType = 'nitro';
        }

        if (currentActiveType !== prevActiveType) {
          prevActiveType = currentActiveType;
          setActivePowerUp(currentActiveType as PowerUpType);
        }

        // Hide model groups when expired
        if (state.laserTime <= 0 && laserGunGroup && laserGunGroup.visible) {
          laserGunGroup.visible = false;
        }
        if (state.jetpackTime <= 0 && jetpackMeshGroup && jetpackMeshGroup.visible) {
          jetpackMeshGroup.visible = false;
          if (state.playerY > 3.0) {
            state.playerY = 0;
            state.playerIsJumping = false;
            state.playerJumpVelocity = 0;
          }
        }
        if (state.princessTime <= 0 && princessCompanionGroup && princessCompanionGroup.visible) {
          princessCompanionGroup.visible = false;
          spawnPrincessExplosion(princessCompanionGroup.position.x, princessCompanionGroup.position.y);
        }

        // Animate jetpack hovering & streams
        if (state.jetpackTime > 0 && jetpackMeshGroup) {
          state.playerY = 3.8; // Force fly altitude!
          if (Math.random() > 0.4) {
            spawnJetpackParticles(marioGroup.position.x, marioGroup.position.y + 0.6);
          }
        }

        // Animate Princess Companion Lockstep position
        if (state.princessTime > 0 && princessCompanionGroup) {
          const companionXOffset = state.playerCurrentX > 0 ? -1.15 : 1.15;
          princessCompanionGroup.position.x = state.playerCurrentX + companionXOffset;
          princessCompanionGroup.position.z = -0.55;
          princessCompanionGroup.rotation.z = Math.sin(nowTime * 0.015) * 0.02;
          princessCompanionGroup.rotation.y = Math.sin(nowTime * 0.01) * 0.04; // 180 degree rotation (from Math.PI base to 0) to face forward down the track

          // Grounded running limbs animation matching Mario's speed
          const runCycle = nowTime * 0.012 * (state.speed / 16);
          const activePrincess = princessCompanionGroup.getObjectByName(state.princessCharId) as THREE.Group;
          if (activePrincess) {
            const armL = activePrincess.getObjectByName("armL");
            const armR = activePrincess.getObjectByName("armR");
            const legL = activePrincess.getObjectByName("legL");
            const legR = activePrincess.getObjectByName("legR");
            const gown = activePrincess.getObjectByName("gown");

            if (armL) armL.rotation.x = Math.sin(runCycle) * 0.55;
            if (armR) armR.rotation.x = -Math.sin(runCycle) * 0.55;
            if (legL) {
              legL.position.z = Math.cos(runCycle) * 0.14;
              legL.position.y = 0.12 + Math.max(0, Math.sin(runCycle) * 0.08);
            }
            if (legR) {
              legR.position.z = Math.cos(runCycle + Math.PI) * 0.14;
              legR.position.y = 0.12 + Math.max(0, Math.sin(runCycle + Math.PI) * 0.08);
            }
            if (gown) {
              gown.rotation.z = Math.sin(runCycle) * 0.06;
              gown.rotation.x = Math.cos(runCycle * 2) * 0.03;
            }
          }

          // Spawning & Dissolution/Evaporation effects
          const basePrincessScale = 1.85; // Tall, beautiful adult female proportions relative to Mario
          const elapsed = 10.0 - state.princessTime;
          let currentScale = basePrincessScale;

          if (elapsed < 0.3) {
            // Elastic scaling up on spawn
            const scaleFactor = Math.sin((elapsed / 0.3) * Math.PI / 2);
            currentScale = basePrincessScale * scaleFactor;
            princessCompanionGroup.scale.setScalar(currentScale);

            // Neon emissive intensity spike/flash
            const flashIntensity = (1.0 - (elapsed / 0.3)) * 3.0;
            companionMaterials.forEach(m => {
              m.emissiveIntensity = 0.2 + flashIntensity;
            });
          } else if (state.princessTime < 0.8) {
            // Smooth evaporative dissolve over the final 0.8 seconds
            const dissolveFactor = state.princessTime / 0.8; // goes from 1.0 down to 0.0
            currentScale = basePrincessScale * dissolveFactor;
            princessCompanionGroup.scale.setScalar(currentScale);

            // Turn down materials opacity
            companionMaterials.forEach(m => {
              m.opacity = dissolveFactor;
            });

            // Expand arm limbs outward as she evaporates
            if (activePrincess) {
              const armL = activePrincess.getObjectByName("armL");
              const armR = activePrincess.getObjectByName("armR");
              if (armL) armL.position.x = -0.16 - (1.0 - dissolveFactor) * 0.3;
              if (armR) armR.position.x = 0.16 + (1.0 - dissolveFactor) * 0.3;
            }

            // Spawn lovely dissipating smoke sparkles
            if (Math.random() < 0.35) {
              const col = state.princessCharId === 'Peach' ? '#ff1493' :
                          state.princessCharId === 'Daisy' ? '#ff8800' : '#00ced1';
              spawnPrincessSmokeParticle(princessCompanionGroup.position.x, princessCompanionGroup.position.y, col);
            }
          } else {
            // Normal fully visible state
            princessCompanionGroup.scale.setScalar(basePrincessScale);
            companionMaterials.forEach(m => {
              m.opacity = 1.0;
              m.emissiveIntensity = 0.2;
            });

            // Restore standard positions
            if (activePrincess) {
              const armL = activePrincess.getObjectByName("armL");
              const armR = activePrincess.getObjectByName("armR");
              if (armL) armL.position.x = -0.16;
              if (armR) armR.position.x = 0.16;
            }
          }

          // Grounded vertical alignment to prevent floating or clipping
          // (Local gown bottom of all princess meshes is at y = 0.14)
          princessCompanionGroup.position.y = state.playerY - 0.14 * currentScale + Math.sin(nowTime * 0.012) * 0.05;
        }

        // Magnet attraction lerp logic
        if (state.magnetTime > 0 || state.jetpackTime > 0) {
          state.entities.forEach(({ entityDef, mesh }) => {
            if (entityDef.type === 'COIN' && !entityDef.hit && !entityDef.isDying) {
              const dx = mesh.position.x - marioGroup.position.x;
              const dy = mesh.position.y - marioGroup.position.y;
              const dz = entityDef.z - 0.1;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 15.0) {
                const lerpFactor = delta * 12.0;
                mesh.position.x += (marioGroup.position.x - mesh.position.x) * lerpFactor;
                mesh.position.y += (marioGroup.position.y + 0.65 - mesh.position.y) * lerpFactor;
                entityDef.z += (0.1 - entityDef.z) * lerpFactor;
              }
            }
          });
        }

        // Cyber Nitro speed trail & hyper velocity
        if (state.nitroTime > 0) {
          state.speed = 35.0; // Max nitro speed
          if (Math.random() > 0.4) {
            spawnNitroTrail(marioGroup.position.x, marioGroup.position.y);
          }
        }

        // Detailed run animation cycle (limb swings, body bobs)
        const runCycle = nowTime * 0.012 * (state.speed / 16);
        if (!state.playerIsJumping && !state.playerIsSliding) {
          marioGroup.scale.set(1, 1, 1);
          if (cyberGorillaGroup.visible) {
            // Massive, heavy run cycle for Cyber Gorilla
            const gRunCycle = nowTime * 0.010 * (state.speed / 16);
            
            // Heavier, wider arm swings (powerful knuckles-forward posture)
            gorillaArmL.rotation.x = 0.4 + Math.sin(gRunCycle) * 0.8;
            gorillaArmL.rotation.y = 0.1 + Math.cos(gRunCycle) * 0.2;
            gorillaArmL.rotation.z = -0.15;
            
            gorillaArmR.rotation.x = 0.4 - Math.sin(gRunCycle) * 0.8;
            gorillaArmR.rotation.y = -0.1 + Math.cos(gRunCycle) * 0.2;
            gorillaArmR.rotation.z = 0.15;

            // Elbow bobs
            gorillaForearmL.rotation.x = -0.6 - Math.sin(gRunCycle) * 0.4;
            gorillaForearmR.rotation.x = -0.6 - Math.sin(gRunCycle + Math.PI) * 0.4;

            // Heavy, sturdy leg stride logic (Math.sin/Math.cos to match massive weight)
            gorillaLegL.position.y = 0.28 + Math.max(0, Math.sin(gRunCycle) * 0.2);
            gorillaLegL.position.z = Math.cos(gRunCycle) * 0.24;
            
            gorillaLegR.position.y = 0.28 + Math.max(0, Math.sin(gRunCycle + Math.PI) * 0.2);
            gorillaLegR.position.z = Math.cos(gRunCycle + Math.PI) * 0.24;

            // Shin trailing flexion
            gorillaShinL.rotation.x = -Math.max(0, Math.sin(gRunCycle - Math.PI / 2) * 0.6);
            gorillaShinR.rotation.x = -Math.max(0, Math.sin(gRunCycle + Math.PI - Math.PI / 2) * 0.6);

            // Necktie flutters in the wind
            neckTieGroup.rotation.z = Math.sin(gRunCycle * 2) * 0.1;
            neckTieGroup.rotation.x = 0.12 + Math.cos(gRunCycle) * 0.15 + (state.speed * 0.01);

            // Head bobs forward and back heavily
            gorillaHeadGroup.position.y = 0.55 + Math.sin(gRunCycle * 2) * 0.05;
            gorillaHeadGroup.position.z = 0.15 + Math.cos(gRunCycle) * 0.04;
            
            // Shoulder/torso chest pounding / breathing sway
            upperBody.rotation.z = Math.sin(gRunCycle) * 0.1;
            upperBody.rotation.y = Math.cos(gRunCycle) * 0.08;
          } else if (princessDressGroup.visible) {
            princessDressGroup.scale.set(1, 1, 1);
            // Dynamic fluid gown sway
            princessDressGroup.rotation.z = Math.sin(runCycle) * 0.15;
            princessDressGroup.rotation.x = 0.05 + Math.cos(runCycle * 2) * 0.06;
            
            // Subtly wave the folds for cloth simulation effect
            foldMeshes.forEach((fold, idx) => {
              const baseAngle = (idx * Math.PI * 2) / foldMeshes.length;
              const wave = Math.sin(runCycle * 1.5 - baseAngle) * 0.08;
              fold.scale.set(1 + wave * 0.2, 1, 1 + wave * 0.2);
              fold.position.x = Math.cos(baseAngle) * (0.45 + wave * 0.12);
              fold.position.z = Math.sin(baseAngle) * (0.45 + wave * 0.12);
            });

            // Adjust boot positioning to gracefully step from under the dress rather than clip
            bootLGroup.position.x = -0.12 + Math.sin(runCycle) * 0.04;
            bootRGroup.position.x = 0.12 + Math.sin(runCycle + Math.PI) * 0.04;
            bootLGroup.position.y = 0.05 + Math.max(0, Math.sin(runCycle) * 0.22);
            bootLGroup.position.z = Math.cos(runCycle) * 0.22;

            bootRGroup.position.y = 0.05 + Math.max(0, Math.sin(runCycle + Math.PI) * 0.22);
            bootRGroup.position.z = Math.cos(runCycle + Math.PI) * 0.22;

            // Articulated ankle rotations for realistic stride under the gown
            bootLGroup.rotation.x = Math.sin(runCycle) * 0.35;
            bootLGroup.rotation.y = -Math.cos(runCycle) * 0.12;
            bootLGroup.rotation.z = Math.sin(runCycle) * 0.08;

            bootRGroup.rotation.x = Math.sin(runCycle + Math.PI) * 0.35;
            bootRGroup.rotation.y = -Math.cos(runCycle + Math.PI) * 0.12;
            bootRGroup.rotation.z = Math.sin(runCycle + Math.PI) * 0.08;

            // Reduce leg swing z-depth slightly to stay fully concealed by the elegant gown bell
            legL.position.y = 0.25 + Math.max(0, Math.sin(runCycle) * 0.1);
            legL.position.z = Math.cos(runCycle) * 0.08;

            legR.position.y = 0.25 + Math.max(0, Math.sin(runCycle + Math.PI) * 0.1);
            legR.position.z = Math.cos(runCycle + Math.PI) * 0.08;
          } else {
            // Swing boot groups
            bootLGroup.position.x = -0.18;
            bootLGroup.position.y = 0.05 + Math.max(0, Math.sin(runCycle) * 0.22);
            bootLGroup.position.z = Math.cos(runCycle) * 0.28;

            bootRGroup.position.x = 0.18;
            bootRGroup.position.y = 0.05 + Math.max(0, Math.sin(runCycle + Math.PI) * 0.22);
            bootRGroup.position.z = Math.cos(runCycle + Math.PI) * 0.28;

            // Articulated ankle rotations for classic realistic stride
            bootLGroup.rotation.x = Math.sin(runCycle) * 0.35;
            bootLGroup.rotation.y = -Math.cos(runCycle) * 0.12;
            bootLGroup.rotation.z = Math.sin(runCycle) * 0.08;

            bootRGroup.rotation.x = Math.sin(runCycle + Math.PI) * 0.35;
            bootRGroup.rotation.y = -Math.cos(runCycle + Math.PI) * 0.12;
            bootRGroup.rotation.z = Math.sin(runCycle + Math.PI) * 0.08;

            // Swing legs
            legL.position.y = 0.25 + Math.max(0, Math.sin(runCycle) * 0.1);
            legL.position.z = Math.cos(runCycle) * 0.14;

            legR.position.y = 0.25 + Math.max(0, Math.sin(runCycle + Math.PI) * 0.1);
            legR.position.z = Math.cos(runCycle + Math.PI) * 0.14;
          }

          if (!cyberGorillaGroup.visible) {
            // Rigged Knee (Shin) flex animations - natural trailing bend when legs swing back
            shinL.rotation.x = -Math.max(0, Math.sin(runCycle - Math.PI / 2) * 0.7);
            shinR.rotation.x = -Math.max(0, Math.sin(runCycle + Math.PI - Math.PI / 2) * 0.7);

            // Move sleeves (Sprinting posture with natural arm pump swinging inward)
            armL.rotation.x = Math.sin(runCycle) * 0.65;
            armL.rotation.y = 0.25 + Math.cos(runCycle) * 0.15; // Rotates slightly inward toward center chest
            armL.rotation.z = -0.15;

            armR.rotation.x = -Math.sin(runCycle) * 0.65;
            armR.rotation.y = -0.25 + Math.cos(runCycle) * 0.15; // Rotates slightly inward toward center chest
            armR.rotation.z = 0.15;

            // Rigged Elbow (Forearm) pumps - flexing more at peak swing
            forearmL.rotation.x = -0.5 - Math.sin(runCycle) * 0.35;
            forearmR.rotation.x = -0.5 - Math.sin(runCycle + Math.PI) * 0.35;

            // Gently bob head
            headGroup.position.y = 1.35 + Math.sin(runCycle * 2) * 0.04;
          }
        }

        // Jump Physics
        if (state.playerIsJumping) {
          state.playerY += state.playerJumpVelocity * delta;
          state.playerJumpVelocity -= 35 * delta; // Simulated Gravity

          // Pose limbs for dynamic airborne look - tucking knees up realistically
          const jumpHeightFactor = Math.sin(Math.min(1.0, state.playerY / 2.4) * Math.PI);
          const kneeTuck = jumpHeightFactor * 0.15; // bend up to 0.15 units
          
          if (cyberGorillaGroup.visible) {
            // Gorilla heavy jump posture
            gorillaLegL.position.set(-0.25, 0.28 + kneeTuck * 0.8, -0.05);
            gorillaLegR.position.set(0.25, 0.24 + kneeTuck * 0.8, -0.05);

            gorillaArmL.rotation.set(-Math.PI / 3, 0.2, -0.2);
            gorillaArmR.rotation.set(-Math.PI / 3, -0.2, 0.2);
            gorillaForearmL.rotation.set(-0.4, 0, 0);
            gorillaForearmR.rotation.set(-0.4, 0, 0);

            gorillaHeadGroup.position.set(0, 0.58, 0.12);
            neckTieGroup.rotation.x = -0.15; // blows upwards
          } else if (princessDressGroup.visible) {
            // Dress flare due to air resistance during jump
            const verticalVel = state.playerJumpVelocity;
            const windResistanceFactor = Math.min(0.2, Math.max(-0.15, verticalVel * 0.012));
            princessDressGroup.scale.set(1 + windResistanceFactor * 0.8, 1 - windResistanceFactor * 0.5, 1 + windResistanceFactor * 0.8);
            princessDressGroup.rotation.x = -windResistanceFactor * 0.4;
            
            // Subtle sway of folds back
            foldMeshes.forEach((fold, idx) => {
              const baseAngle = (idx * Math.PI * 2) / foldMeshes.length;
              fold.position.z = Math.sin(baseAngle) * 0.45 - 0.05; // blown back slightly
            });
            
            // Adjust jump pose for graceful legs under gown
            bootLGroup.position.set(-0.12, 0.15 + kneeTuck, -0.05);
            bootRGroup.position.set(0.12, 0.10 + kneeTuck, -0.12);
            legL.position.set(-0.12, 0.30 + kneeTuck, -0.05);
            legR.position.set(0.12, 0.25 + kneeTuck, -0.05);

            // Airborne ankle toe-point angles under gown
            bootLGroup.rotation.set(0.3, 0, 0);
            bootRGroup.rotation.set(0.2, 0, 0);
          } else {
            princessDressGroup.scale.set(1, 1, 1);
            bootLGroup.position.set(-0.18, 0.15 + kneeTuck, -0.1);
            bootRGroup.position.set(0.18, 0.1 + kneeTuck, -0.2);
            legL.position.set(-0.18, 0.3 + kneeTuck, -0.1);
            legR.position.set(0.18, 0.25 + kneeTuck, -0.1);

            // Airborne ankle toe-point angles
            bootLGroup.rotation.set(0.3, 0, 0);
            bootRGroup.rotation.set(0.2, 0, 0);
          }

          if (!cyberGorillaGroup.visible) {
            // Rigged knees tuck backwards for classic jumping posture
            shinL.rotation.x = -0.8;
            shinR.rotation.x = -0.6;

            // Raised jumping arms with elbows angled slightly forward
            armL.rotation.set(-Math.PI / 2.2, 0.2, -0.15);
            armR.rotation.set(-Math.PI / 2.2, -0.2, 0.15);
            forearmL.rotation.set(-0.4, 0, 0);
            forearmR.rotation.set(-0.4, 0, 0);

            headGroup.position.y = 1.38;
          }

          if (state.playerY <= 0) {
            state.playerY = 0;
            state.playerIsJumping = false;
            state.playerJumpVelocity = 0;
            state.cameraShake = 0.25;
            gameAudio.playSlide(); // dust poof landing sound
          }
        }

        // Slide Physics
        if (state.playerIsSliding) {
          state.playerSlideTime -= delta;

          if (cyberGorillaGroup.visible) {
            // Slide posture for gorilla: duck down low, tuck arms
            marioGroup.scale.set(1.15, 0.55, 1.25);
            gorillaLegL.position.set(-0.25, 0.12, -0.2);
            gorillaLegR.position.set(0.25, 0.12, -0.2);
            
            gorillaArmL.rotation.set(Math.PI / 3.5, 0.3, -0.2);
            gorillaArmR.rotation.set(Math.PI / 3.5, -0.3, 0.2);
            gorillaForearmL.rotation.set(-0.8, 0, 0);
            gorillaForearmR.rotation.set(-0.8, 0, 0);
            
            gorillaHeadGroup.position.set(0, 0.42, 0.2);
            neckTieGroup.rotation.x = 0.45; // dragged back
          } else if (princessDressGroup.visible) {
            // Elegant slide posture for dress (tuck dress flat and long)
            marioGroup.scale.set(1.1, 0.5, 1.35);
            princessDressGroup.scale.set(1.15, 0.8, 1.25);
            princessDressGroup.rotation.x = -0.15;
            bootLGroup.position.set(-0.12, 0.05, -0.3);
            bootRGroup.position.set(0.12, 0.05, -0.3);

            // Ankle sliding flexion under gown
            bootLGroup.rotation.set(-0.2, 0, 0);
            bootRGroup.rotation.set(-0.2, 0, 0);
          } else {
            marioGroup.scale.set(1.1, 0.45, 1.35);
            princessDressGroup.scale.set(1, 1, 1);
            bootLGroup.position.set(-0.18, 0.05, -0.3);
            bootRGroup.position.set(0.18, 0.05, -0.3);

            // Ankle sliding flexion
            bootLGroup.rotation.set(-0.2, 0, 0);
            bootRGroup.rotation.set(-0.2, 0, 0);
          }
          marioGroup.position.y = -0.1;

          if (!cyberGorillaGroup.visible) {
            // Tuck arms flat to ground
            armL.rotation.set(Math.PI / 2.8, 0.2, -0.15);
            armR.rotation.set(Math.PI / 2.8, -0.2, 0.15);

            // Fully collapse joints during sliding
            shinL.rotation.x = -1.2;
            shinR.rotation.x = -1.2;
            forearmL.rotation.set(-1.0, 0, 0);
            forearmR.rotation.set(-1.0, 0, 0);
          }

          if (state.playerSlideTime <= 0) {
            state.playerIsSliding = false;
            marioGroup.scale.set(1, 1, 1);
            princessDressGroup.scale.set(1, 1, 1);
            marioGroup.position.y = 0;
          }
        }

        // Smoothly interpolate X coordinate during lane switching (15x fast lerp)
        state.playerTargetX = state.playerLane * state.laneWidth;
        const laneDeltaX = state.playerTargetX - state.playerCurrentX;
        state.playerCurrentX += laneDeltaX * delta * 15;

        // Apply visual coordinates to group with realistic run bobs and slide shifts
        marioGroup.position.x = state.playerCurrentX;
        const bobOffset = (!state.playerIsJumping && !state.playerIsSliding) ? Math.sin(runCycle * 2) * 0.06 : 0;
        marioGroup.position.y = state.playerY + (state.playerIsSliding ? -0.1 : bobOffset);

        // Dynamic banking leans based on lane transition velocities
        marioGroup.rotation.z = -laneDeltaX * 0.18; // Roll tilt
        marioGroup.rotation.y = Math.PI - laneDeltaX * 0.24;  // Yaw turn (180 degree rotation to face forward down the track)

        // Rotational somersault during jump heights
        if (state.playerIsJumping) {
          if (cyberGorillaGroup.visible) {
            marioGroup.rotation.x = -0.22; // heavy forward lean, no spin
          } else {
            const jumpProgress = Math.min(1.0, state.playerY / 2.4);
            marioGroup.rotation.x = -Math.sin(jumpProgress * Math.PI) * Math.PI * 2;
          }
        } else {
          marioGroup.rotation.x = 0;
        }

        // Infinite road segments wrapping logic
        state.roadTiles.forEach((tile) => {
          tile.position.z += state.speed * delta;
          if (tile.position.z > 15) {
            tile.position.z -= 5 * tileLength;
            // Update road tile materials/sub-groups to match active map when wrapping!
            const mapConfig = MAP_THEMES[state.activeMap || 1];
            const activeVariant = mapConfig ? mapConfig.variant : 0;
            if (tile.children[0]) tile.children[0].visible = activeVariant === 0;
            if (tile.children[1]) tile.children[1].visible = activeVariant === 1;
            if (tile.children[2]) tile.children[2].visible = activeVariant === 2;
          }
        });

        // Animate digital clouds (texture offset shift and breathing scale)
        if (typeof digitalCloudTex !== 'undefined') {
          digitalCloudTex.offset.x += delta * 0.012;
          digitalCloudTex.offset.y += delta * 0.004;
        }
        
        if (typeof cloudPlanes !== 'undefined') {
          cloudPlanes.forEach((cp, idx) => {
            cp.position.z += state.speed * delta * 0.14;
            const pulse = Math.sin(nowTime * 0.0012 + idx) * 0.05 + 1.0;
            cp.scale.set(pulse, pulse, 1);
            
            if (cp.position.z > 20) {
              cp.position.z = -120 - Math.random() * 25;
              cp.position.x = (Math.random() - 0.5) * 45;
            }
          });
        }

        // Drifting background cyberspace dust particles
        if (typeof particleGeom !== 'undefined' && typeof particleMat !== 'undefined') {
          const posAttr = particleGeom.getAttribute('position') as THREE.BufferAttribute;
          if (posAttr) {
            const posArray = posAttr.array as Float32Array;
            const colorConfig = MAP_THEMES[state.activeMap || 1];
            if (colorConfig) {
              particleMat.color.set(colorConfig.neonBorder);
            }
            for (let i = 0; i < particleCount; i++) {
              const idx = i * 3;
              posArray[idx] += velocities[i].x * delta;
              posArray[idx + 1] += velocities[i].y * delta;
              posArray[idx + 2] += (velocities[i].z + state.speed * 0.43) * delta;
              
              if (posArray[idx + 2] > 15) {
                posArray[idx] = -50 + Math.random() * 100;
                posArray[idx + 1] = -10 + Math.random() * 40;
                posArray[idx + 2] = -120 - Math.random() * 10;
              }
            }
            posAttr.needsUpdate = true;
          }
        }

        // Parallax scroll of distant cyberpunk skyscrapers
        if (typeof skylineItems !== 'undefined') {
          skylineItems.forEach((group) => {
            group.position.z += state.speed * delta * 0.12;
            if (group.position.z > 20) {
              group.position.z = -140 - Math.random() * 20;
              const isRight = group.position.x > 0;
              group.position.x = isRight ? (35 + Math.random() * 25) : (-35 - Math.random() * 25);
            }
          });
        }

        // Flanking scenery scrolling (with dynamic world-level recycling & memory cleanup)
        state.sceneryItems.forEach((item) => {
          item.position.z += state.speed * delta;
          if (item.position.z > 20) {
            item.position.z -= 140;

            const isRight = item.userData.isRight;
            const isRoadside = item.userData.isRoadside;

            // Reposition X coordinate based on decoration type
            if (isRoadside) {
              item.position.x = isRight ? 5.2 : -5.2;
            } else {
              item.position.x = isRight ? (16 + Math.random() * 12) : (-16 - Math.random() * 12);
            }

            // Zero-Lag Asset Reuse: Simply toggle visibility of the pre-built sub-groups!
            const mapConfig = MAP_THEMES[state.activeMap || 1];
            const activeVariant = mapConfig ? mapConfig.variant : 0;
            if (item.children[0]) item.children[0].visible = activeVariant === 0;
            if (item.children[1]) item.children[1].visible = activeVariant === 1;
            if (item.children[2]) item.children[2].visible = activeVariant === 2;
          }
        });

        // 3. Adaptive Spawning Rate: interval decreases dynamically as speed rises
        const currentSpawnInterval = Math.max(550, 2400 - (state.speed - baseSpeed) * 90);
        if (nowTime - state.lastSpawnTime > currentSpawnInterval) {
          const randLane = (Math.floor(Math.random() * 3) - 1) as Lane;
          const choices: (ObstacleType | 'COIN')[] = ['COIN', 'COIN', 'PIPE', 'GOOMBA', 'BLOCK', 'FLOATING_PIPE', 'PITFALL', 'GAS_CANISTER', 'POWERUP'];
          const type = choices[Math.floor(Math.random() * choices.length)];

          spawnEntity(type, randLane, -75);

          // Add a trail of coins in a free adjacent lane for extra fun
          if (type !== 'COIN' && Math.random() > 0.4) {
            const coinLane = (randLane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0) as Lane;
            spawnEntity('COIN', coinLane, -70);
            spawnEntity('COIN', coinLane, -73);
            spawnEntity('COIN', coinLane, -76);
          }

          state.lastSpawnTime = nowTime;
        }

        // --- 1-Frame Screen Flash Cleanup ---
        if (state.skyFlashFrames > 0) {
          state.skyFlashFrames--;
          if (state.skyFlashFrames === 0) {
            setSkyFlashActive(false);
          }
        }

        // --- Centralized "Dopamine & Terror" Sky Obstacle Spawning Manager ---
        const nowMs = Date.now();
        if (state.status === 'RUNNING') {
          // If no event is active and cooldown has passed, trigger one random surprise event
          if (!state.skyObstacleActiveEvent && nowMs > state.nextSkyEventTimestamp) {
            const choices = ['BOMB', 'LIGHTNING', 'ARROW'] as const;
            const chosenEvent = choices[Math.floor(Math.random() * choices.length)];
            
            state.skyObstacleActiveEvent = chosenEvent;
            setSkyObstacleActiveEvent(chosenEvent);
            
            state.skyEventPhase = 'WARNING';
            state.skyEventLane = (Math.floor(Math.random() * 3) - 1) as Lane; // Target lane

            if (chosenEvent === 'BOMB') {
              state.skyEventTimer = 0.4; // 0.4s warning duration
              setSkyWarningType('BOMB');
              gameAudio.playWhistle();
            } else if (chosenEvent === 'ARROW') {
              state.skyEventTimer = 0.4; // 0.4s warning duration
              setSkyWarningType('ARROW');
              gameAudio.playSwish();
            } else if (chosenEvent === 'LIGHTNING') {
              // Lightning has instant warning indicator + flash
              setSkyFlashActive(true);
              state.skyFlashFrames = 1; // triggers 1 frame of flash
              gameAudio.playThunder();

              // Spawn the lightning mesh immediately with warningTime = 0.5
              const targetX = state.skyEventLane * state.laneWidth;
              const startZ = -70 - Math.random() * 10;
              const mesh = createLightningMesh();
              mesh.scale.set(0.1, 1, 0.1);
              mesh.position.set(targetX, 0, startZ);
              scene.add(mesh);

              state.skyObstacles.push({
                id: `sky-lightning-${Math.random()}`,
                type: 'LIGHTNING',
                mesh,
                lane: state.skyEventLane,
                x: targetX,
                y: 0,
                z: startZ,
                warningTime: 0.5,
                hasStruck: false,
                fallSpeed: 0,
                mockEntityDef: { hit: false, type: 'LIGHTNING' }
              });

              state.skyEventPhase = 'SPAWNED';
            }
          }

          // Process the warning timer for falling obstacles
          if (state.skyObstacleActiveEvent && state.skyEventPhase === 'WARNING') {
            state.skyEventTimer -= delta;
            if (state.skyEventTimer <= 0) {
              const targetZ = -70 - Math.random() * 10;
              
              if (state.skyObstacleActiveEvent === 'BOMB') {
                // Spawn main bomb
                const mainX = state.skyEventLane * state.laneWidth;
                const bombMesh1 = createBombMesh();
                bombMesh1.position.set(mainX, 15, targetZ);
                scene.add(bombMesh1);
                state.skyObstacles.push({
                  id: `sky-bomb-1-${Math.random()}`,
                  type: 'BOMB',
                  mesh: bombMesh1,
                  lane: state.skyEventLane,
                  x: mainX,
                  y: 15,
                  z: targetZ,
                  swayTime: Math.random() * Math.PI,
                  hasStruck: false,
                  fallSpeed: 8.5,
                  mockEntityDef: { hit: false, type: 'BOMB' }
                });

                // Spawn second backup bomb in a different lane to create tension
                if (Math.random() > 0.3) {
                  const altLane = (((state.skyEventLane + 1) + 1) % 3 - 1) as Lane;
                  const altX = altLane * state.laneWidth;
                  const altZ = targetZ - 10 - Math.random() * 8;
                  const bombMesh2 = createBombMesh();
                  bombMesh2.position.set(altX, 15, altZ);
                  scene.add(bombMesh2);
                  state.skyObstacles.push({
                    id: `sky-bomb-2-${Math.random()}`,
                    type: 'BOMB',
                    mesh: bombMesh2,
                    lane: altLane,
                    x: altX,
                    y: 15,
                    z: altZ,
                    swayTime: Math.random() * Math.PI,
                    hasStruck: false,
                    fallSpeed: 8.5,
                    mockEntityDef: { hit: false, type: 'BOMB' }
                  });
                }

                setSkyWarningType(null);
                state.skyEventPhase = 'SPAWNED';
              } else if (state.skyObstacleActiveEvent === 'ARROW') {
                // Spawn arrow cluster
                const mainX = state.skyEventLane * state.laneWidth;
                const arrowMesh1 = createArrowClusterMesh();
                arrowMesh1.position.set(mainX, 15, targetZ);
                scene.add(arrowMesh1);
                state.skyObstacles.push({
                  id: `sky-arrow-1-${Math.random()}`,
                  type: 'ARROW',
                  mesh: arrowMesh1,
                  lane: state.skyEventLane,
                  x: mainX,
                  y: 15,
                  z: targetZ,
                  hasStruck: false,
                  fallSpeed: 17.5,
                  mockEntityDef: { hit: false, type: 'ARROW' }
                });

                // Spawn secondary arrow cluster
                if (Math.random() > 0.4) {
                  const altLane = (((state.skyEventLane + 2) + 1) % 3 - 1) as Lane;
                  const altX = altLane * state.laneWidth;
                  const altZ = targetZ - 12 - Math.random() * 5;
                  const arrowMesh2 = createArrowClusterMesh();
                  arrowMesh2.position.set(altX, 15, altZ);
                  scene.add(arrowMesh2);
                  state.skyObstacles.push({
                    id: `sky-arrow-2-${Math.random()}`,
                    type: 'ARROW',
                    mesh: arrowMesh2,
                    lane: altLane,
                    x: altX,
                    y: 15,
                    z: altZ,
                    hasStruck: false,
                    fallSpeed: 17.5,
                    mockEntityDef: { hit: false, type: 'ARROW' }
                  });
                }

                setSkyWarningType(null);
                state.skyEventPhase = 'SPAWNED';
              }
            }
          }

          // Check if current sky event has finished completely
          if (state.skyObstacleActiveEvent && state.skyEventPhase === 'SPAWNED') {
            const activeSkyObjects = state.skyObstacles.filter(
              (obs) => obs.type === 'BOMB' || obs.type === 'LIGHTNING' || obs.type === 'ARROW'
            );
            if (activeSkyObjects.length === 0) {
              // Reset event state and schedule the next sudden sky event
              state.skyObstacleActiveEvent = null;
              setSkyObstacleActiveEvent(null);
              state.skyEventPhase = null;

              const minCooldownSeconds = 15;
              const maxCooldownSeconds = 30;
              const nextTime = Date.now() + (Math.random() * (maxCooldownSeconds - minCooldownSeconds) + minCooldownSeconds) * 1000;
              state.nextSkyEventTimestamp = nextTime;
              setNextSkyEventTimestamp(nextTime);
            }
          }
        }

        // Update all active sky obstacles and process collisions
        const remainingSkyObstacles: typeof state.skyObstacles = [];

        state.skyObstacles.forEach((obs) => {
          let keep = true;

          // Move forward along Z-axis relative to road scrolling speed
          obs.z += state.speed * delta;
          obs.mesh.position.z = obs.z;

          // Garbage Collection: remove if behind camera
          if (obs.z > 6.0) { // mario is at z=0, camera at z=6.5. 6.0 is well behind player
            scene.remove(obs.mesh);
            return; // don't keep
          }

          if (obs.type === 'BOMB') {
            // Animate fall down on Y-axis
            obs.y -= obs.fallSpeed! * delta;
            obs.mesh.position.y = obs.y;

            // Sway left/right across lanes during descent
            obs.swayTime! += delta * 3.5;
            obs.mesh.position.x = obs.x + Math.sin(obs.swayTime!) * 1.1;

            // Check if hit the floor (Y <= 0) or if it's already dying (e.g., absorbed by shield)
            if (obs.y <= 0 || obs.mockEntityDef.isDying) {
              const wasAbsorbed = obs.mockEntityDef.isDying;
              
              if (!wasAbsorbed) {
                // Trigger instant death/heart loss check
                const playerDx = Math.abs(obs.mesh.position.x - state.playerCurrentX);
                const isPlayerInCollisionZone = playerDx < 1.15 && state.playerY < 1.0;

                if (isPlayerInCollisionZone && !obs.mockEntityDef.hit) {
                  handleObstacleCrash(obs.mockEntityDef, obs.mesh as THREE.Group);
                }
              }

              // Visual Red Translucent Shockwave Sphere Explosion
              const shockwave = createShockwaveMesh();
              shockwave.position.set(obs.mesh.position.x, 0.05, obs.z);
              scene.add(shockwave);

              // Spawn dynamic colorful collision particles too
              spawnScoreParticles(obs.mesh.position.x, 0.5, obs.z, '#ff3300');
              spawnScoreParticles(obs.mesh.position.x, 0.5, obs.z, '#ffaa00');

              // Add shockwave to active array to animate its scaling and opacity fade
              remainingSkyObstacles.push({
                id: `shockwave-${Math.random()}`,
                type: 'SHOCKWAVE',
                mesh: shockwave,
                lane: obs.lane,
                x: obs.mesh.position.x,
                y: 0.05,
                z: obs.z,
                warningTime: 0.35 // acts as lifetimer for shockwave fadeout (0.35s)
              });

              // Play explosive blast sound
              gameAudio.playBlockHit();
              state.cameraShake = Math.max(state.cameraShake, 0.6); // rumble effect

              scene.remove(obs.mesh);
              keep = false;
            }
          } else if (obs.type === 'LIGHTNING') {
            if (obs.mockEntityDef.isDying) {
              scene.remove(obs.mesh);
              keep = false;
            } else if (obs.warningTime! > 0) {
              obs.warningTime! -= delta;
              
              // Flash rapidly to warn player
              const flashSpeed = 35.0; // Hz
              const isBeamVisible = Math.floor(nowTime * flashSpeed) % 2 === 0;
              obs.mesh.visible = isBeamVisible;

              // Force thin scale
              obs.mesh.scale.set(0.12, 1, 0.12);

              // Make emissive intense yellow/cyan during warning
              const child = obs.mesh.children[0] as THREE.Mesh;
              if (child && child.material instanceof THREE.Material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                mat.emissiveIntensity = 1.5;
                mat.color.set('#ff00bb'); // purple hazard warning line
                mat.emissive.set('#ff00bb');
              }
            } else {
              // Stride/Strike phase
              if (!obs.strikeDuration) {
                obs.strikeDuration = 0.25; // strikes last for 0.25s
                gameAudio.playHit(); // play lightning thunder zap!
                state.cameraShake = Math.max(state.cameraShake, 0.75);
              }

              obs.strikeDuration -= delta;
              obs.mesh.visible = true;
              
              // Scale thick & powerful
              obs.mesh.scale.set(1.6, 1, 1.6);

              const child = obs.mesh.children[0] as THREE.Mesh;
              if (child && child.material instanceof THREE.Material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                mat.emissiveIntensity = 8.0;
                mat.color.set('#00ffff'); // glowing cyan bolt
                mat.emissive.set('#00ffff');
              }

              // Check collision: if player is in lane and Z matches
              const playerDx = Math.abs(obs.x - state.playerCurrentX);
              const zDist = Math.abs(obs.z - 0.1);
              const isPlayerInCollisionZone = playerDx < 1.1 && zDist < 1.2;

              if (isPlayerInCollisionZone && !obs.hasStruck && !obs.mockEntityDef.hit) {
                obs.hasStruck = true;
                handleObstacleCrash(obs.mockEntityDef, obs.mesh as THREE.Group);
              }

              if (obs.strikeDuration <= 0) {
                scene.remove(obs.mesh);
                keep = false;
              }
            }
          } else if (obs.type === 'ARROW') {
            if (obs.mockEntityDef.isDying) {
              scene.remove(obs.mesh);
              keep = false;
            } else {
              // High-velocity descent
              obs.y -= obs.fallSpeed! * delta;
              obs.mesh.position.y = obs.y;

              // Check collision with player
              const playerDx = Math.abs(obs.x - state.playerCurrentX);
              const zDist = Math.abs(obs.z - 0.1);
              const yDist = Math.abs(obs.y - state.playerY);
              const isPlayerInCollisionZone = playerDx < 1.1 && zDist < 1.1 && yDist < 1.6;

              if (isPlayerInCollisionZone && !obs.mockEntityDef.hit) {
                handleObstacleCrash(obs.mockEntityDef, obs.mesh as THREE.Group);
                
                // Particle explosion on arrow strike
                spawnScoreParticles(obs.x, obs.y, obs.z, '#ff0033');
                scene.remove(obs.mesh);
                keep = false;
              }

              // Hit ground
              if (obs.y <= 0 && keep) {
                // Spawn dust particles on ground impact
                spawnScoreParticles(obs.x, 0.1, obs.z, '#ffdd00');
                scene.remove(obs.mesh);
                keep = false;
              }
            }
          } else if (obs.type === 'SHOCKWAVE') {
            // Animate shockwave expanding and fading
            obs.warningTime! -= delta; // warningTime acts as remaining life
            const progress = (0.35 - obs.warningTime!) / 0.35; // 0 to 1
            const scaleVal = 1.0 + progress * 5.5; // expand up to 6.5x
            obs.mesh.scale.set(scaleVal, scaleVal, scaleVal);

            if (obs.mesh instanceof THREE.Mesh && obs.mesh.material instanceof THREE.Material) {
              obs.mesh.material.transparent = true;
              obs.mesh.material.opacity = Math.max(0, 0.7 * (1 - progress));
            }

            if (obs.warningTime! <= 0) {
              scene.remove(obs.mesh);
              keep = false;
            }
          }

          if (keep) {
            remainingSkyObstacles.push(obs);
          }
        });

        // Swap the array
        state.skyObstacles.length = 0;
        state.skyObstacles.push(...remainingSkyObstacles);

        // --- Surprise Cyber Dragon Boss-Hazard Spawning & Update System ---
        if (state.status === 'RUNNING') {
          // 1. Spawning check: If no dragon is active and cooldown has elapsed, initiate a lateral dragon ambush
          if (!state.dragonActive && nowMs > state.nextDragonTimestamp) {
            state.dragonActive = true;
            state.dragonSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
            state.dragonType = Math.random() > 0.5 ? 'LOW' : 'HIGH';
            state.dragonWarningTimer = 1.0; // 1-second warn period
            state.dragonX = state.dragonSide === 'LEFT' ? -15 : 15;
            state.dragonSpeed = 24.0; // Fast speed across lanes
            
            // Trigger 1-second warnings
            setDragonWarningSide(state.dragonSide);
            setDragonWarningType(state.dragonType);
            
            // Heavy camera rumble starting at warning
            state.cameraShake = 1.2;
            
            // Play roaring sound cue
            gameAudio.playDragonRoar();
          }

          // 2. Process Dragon State
          if (state.dragonActive) {
            if (state.dragonWarningTimer > 0) {
              // 1-second Cinematic Warning Shock: decay timer
              state.dragonWarningTimer -= delta;
              
              if (state.dragonWarningTimer <= 0) {
                state.dragonWarningTimer = 0;
                setDragonWarningSide(null);
                setDragonWarningType(null);

                // --- Refactored Green Cartoon Dragon (Matching image_eb9aa0.png) ---
                // Vibrant Matte Materials
                const bodyMat = new THREE.MeshStandardMaterial({
                  color: 0x22c55e, // Rich bright green
                  roughness: 0.5,
                  metalness: 0.1
                });
                const underbellyMat = new THREE.MeshStandardMaterial({
                  color: 0x84cc16, // Lighter lime-green
                  roughness: 0.5,
                  metalness: 0.1
                });
                const accentMat = new THREE.MeshStandardMaterial({
                  color: 0xfacc15, // Bright neon yellow
                  emissive: 0xfacc15,
                  emissiveIntensity: 0.8,
                  roughness: 0.5
                });
                const limbMat = new THREE.MeshStandardMaterial({
                  color: 0xf97316, // Solid safety orange
                  roughness: 0.5,
                  metalness: 0.1
                });
                const eyeWhiteMat = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  roughness: 0.4
                });
                const eyePupilMat = new THREE.MeshStandardMaterial({
                  color: 0x000000,
                  roughness: 0.3
                });

                const group = new THREE.Group();

                // 1. HEAD & SNOUT ASSEMBLY
                const headGroup = new THREE.Group();

                // Main Cranium
                const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), bodyMat);
                cranium.position.set(0, 0.2, 0);
                headGroup.add(cranium);

                // Upper Jaw & Snout (elongated snout with distinct upward curved tip)
                const snoutLength = 0.9;
                const upperSnout = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, snoutLength), bodyMat);
                upperSnout.position.set(0, 0.15, -snoutLength / 2 - 0.2);
                headGroup.add(upperSnout);

                // Upward-curving snout tip
                const snoutTip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.3), bodyMat);
                snoutTip.position.set(0, 0.35, -snoutLength - 0.25);
                snoutTip.rotation.x = -0.2; // angled upwards slightly
                headGroup.add(snoutTip);

                // Underbelly/Jaw Accent (Lighter lime-green shade) for lower jaw
                const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, snoutLength - 0.1), underbellyMat);
                lowerJaw.position.set(0, -0.22, -snoutLength / 2 - 0.15);
                lowerJaw.rotation.x = 0.3; // opened jaw angle
                headGroup.add(lowerJaw);

                // Mouth interior (red)
                const mouthInterior = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, snoutLength - 0.1), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }));
                mouthInterior.position.set(0, -0.05, -snoutLength / 2 - 0.15);
                headGroup.add(mouthInterior);

                // 2. GOOFY CARTOON EYES (Two prominent closely-set white spheres with small black pupils on head ridge)
                const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), eyeWhiteMat);
                eyeL.position.set(0.18, 0.65, -0.1);
                const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyePupilMat);
                pupilL.position.set(0.18, 0.72, -0.32); // prominent looking forward and slightly inward
                
                const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), eyeWhiteMat);
                eyeR.position.set(-0.18, 0.65, -0.1);
                const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyePupilMat);
                pupilR.position.set(-0.18, 0.72, -0.32);

                headGroup.add(eyeL, pupilL, eyeR, pupilR);

                // Cute snout nostrils
                const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyePupilMat);
                nostrilL.position.set(0.15, 0.38, -snoutLength - 0.3);
                const nostrilR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyePupilMat);
                nostrilR.position.set(-0.15, 0.38, -snoutLength - 0.3);
                headGroup.add(nostrilL, nostrilR);

                group.add(headGroup);

                // 3. SERPENTINE BODY SEGMENTS WITH BACK SPIKES, WINGS & LIMBS
                const segments: THREE.Group[] = [];
                const segmentCount = 9;

                for (let i = 0; i < segmentCount; i++) {
                  const segGroup = new THREE.Group();

                  // Progression radius
                  const t = i / segmentCount;
                  const radius = 0.72 * (1 - t * 0.5);

                  // Main Segment green sphere
                  const segSph = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), bodyMat);
                  segGroup.add(segSph);

                  // Underbelly plate (lighter lime-green flat sphere)
                  const bellySph = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.9, 12, 12), underbellyMat);
                  bellySph.scale.set(1.02, 0.5, 1.02);
                  bellySph.position.set(0, -radius * 0.45, 0);
                  segGroup.add(bellySph);

                  // Sharp green back spike (cone geometry) pointing up
                  const spikeHeight = 0.35 * (1 - t * 0.4);
                  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.15 * (1 - t * 0.4), spikeHeight, 8), underbellyMat); // use lighter lime-green for visual contrast of spikes
                  spike.position.set(0, radius + spikeHeight / 2 - 0.05, 0);
                  spike.rotation.x = 0.1;
                  segGroup.add(spike);

                  // Wings (on the back, bright yellow emissive colors) - placed on segment 2 & 3
                  if (i === 1 || i === 2) {
                    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.8), accentMat);
                    wingL.position.set(radius + 0.15, radius * 0.4, -0.1);
                    wingL.rotation.z = -0.6;
                    wingL.rotation.y = 0.3;

                    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.8), accentMat);
                    wingR.position.set(-radius - 0.15, radius * 0.4, -0.1);
                    wingR.rotation.z = 0.6;
                    wingR.rotation.y = -0.3;

                    segGroup.add(wingL, wingR);
                  }

                  // Short cartoonish orange legs/limbs (below torso level) - placed on segment 1 & 4
                  if (i === 0 || i === 3) {
                    // Leg Left
                    const legL = new THREE.Group();
                    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8), limbMat);
                    thighL.rotation.z = -0.4;
                    thighL.position.set(radius * 0.7, -radius * 0.6, 0);
                    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.35), limbMat);
                    footL.position.set(radius * 0.85, -radius * 0.8, -0.05);
                    legL.add(thighL, footL);

                    // Leg Right
                    const legR = new THREE.Group();
                    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8), limbMat);
                    thighR.rotation.z = 0.4;
                    thighR.position.set(-radius * 0.7, -radius * 0.6, 0);
                    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.35), limbMat);
                    footR.position.set(-radius * 0.85, -radius * 0.8, -0.05);
                    legR.add(thighR, footR);

                    segGroup.add(legL, legR);
                  }

                  // Position segment consecutively behind head
                  segGroup.position.set(0, 0, (i + 1) * 0.95);
                  group.add(segGroup);
                  segments.push(segGroup);
                }

                // 4. VOLUMETRIC CARTOON FIRE BREATH (Expanding clusters of sharp red and orange shapes stretching horizontally)
                let fireMesh: THREE.Group | null = null;
                if (state.dragonType === 'HIGH') {
                  fireMesh = new THREE.Group();
                  
                  // Multiple layered red, orange, and yellow spheres and cones stretching forward
                  const fireColors = [0xef4444, 0xf97316, 0xfacc15];
                  const flameCount = 12;

                  for (let f = 0; f < flameCount; f++) {
                    const ratio = f / flameCount;
                    // expanding shape sizes
                    const size = 0.28 + ratio * 0.95;
                    const colorHex = fireColors[f % fireColors.length];
                    const fireMat = new THREE.MeshStandardMaterial({
                      color: colorHex,
                      emissive: colorHex,
                      emissiveIntensity: 3.0,
                      transparent: true,
                      opacity: 0.85 - ratio * 0.3,
                      roughness: 0.2
                    });

                    // mix of sphere and cone geometries
                    const geom = f % 2 === 0 
                      ? new THREE.SphereGeometry(size, 8, 8) 
                      : new THREE.ConeGeometry(size * 0.8, size * 1.8, 8);
                    
                    const flame = new THREE.Mesh(geom, fireMat);
                    
                    // Spread outward and forward (which is along the -Z head direction)
                    // The dragon snout is pointing forward towards -Z, so the fire blast expands along -Z
                    const forwardDist = -1.2 - ratio * 3.5;
                    const spreadX = (Math.random() - 0.5) * ratio * 2.2;
                    const spreadY = -0.2 + (Math.random() - 0.5) * ratio * 1.5;

                    flame.position.set(spreadX, spreadY, forwardDist);
                    
                    if (f % 2 !== 0) {
                      flame.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                    }
                    
                    // store custom ratio/speed for pulsing/wiggling fire breath in gameLoop
                    flame.userData = {
                      initialScale: 1.0,
                      speed: 6.0 + Math.random() * 8.0,
                      phase: Math.random() * Math.PI * 2
                    };

                    fireMesh.add(flame);
                  }

                  // Position fire blast group directly at the open mouth
                  fireMesh.position.set(0, -0.1, -1.0);
                  headGroup.add(fireMesh);
                }

                // Initial position
                const dragonY = state.dragonType === 'LOW' ? 0.5 : 3.5;
                group.position.set(state.dragonX, dragonY, -4.5);
                
                // Rotational orientation based on lateral travel direction
                if (state.dragonSide === 'LEFT') {
                  group.rotation.y = -Math.PI / 2; // points to +X
                } else {
                  group.rotation.y = Math.PI / 2;  // points to -X
                }

                scene.add(group);
                state.dragonMesh = group;
                state.dragonBodySegments = segments;
                state.dragonFireMesh = fireMesh;
              }
            } else {
              // Active Dash translation across X-axis
              const moveDir = state.dragonSide === 'LEFT' ? 1 : -1;
              state.dragonX += moveDir * state.dragonSpeed * delta;

              const dragonY = state.dragonType === 'LOW' ? 0.5 : 3.5;
              if (state.dragonMesh) {
                state.dragonMesh.position.set(state.dragonX, dragonY, -4.5);

                // Slithering snake animation over time (wiggly sin wave)
                const wiggleTime = nowTime * 0.009;
                state.dragonBodySegments.forEach((seg, i) => {
                  const phase = i * 0.45;
                  seg.position.x = Math.sin(wiggleTime + phase) * 0.45;
                  seg.position.y = Math.cos(wiggleTime * 0.75 + phase) * 0.28;
                });

                // Pulsing cartoon fire breath scaling animation!
                if (state.dragonFireMesh) {
                  state.dragonFireMesh.children.forEach((flame: any) => {
                    const data = flame.userData;
                    if (data && data.speed) {
                      const scalePulse = 1.0 + Math.sin(nowTime * 0.015 + data.phase) * 0.22;
                      flame.scale.set(scalePulse, scalePulse, scalePulse);
                    }
                  });
                }

                // Spark a light trail or warm ambient glowing color on the road grid underneath!
                if (frameCount % 4 === 0) {
                  spawnScoreParticles(state.dragonX, state.dragonType === 'LOW' ? 0.2 : 0.8, -4.5, '#ff3c00');
                  spawnScoreParticles(state.dragonX + (Math.random() - 0.5) * 2.0, state.dragonType === 'LOW' ? 0.2 : 2.5, -4.5, '#ffa200');
                }
              }

              // Collision Box Tracking with Player
              const playerX = state.playerCurrentX;
              const playerY = state.playerY;
              const xDist = Math.abs(state.dragonX - playerX);
              
              // Collision width threshold (1.4)
              if (xDist < 1.4) {
                let didHit = false;
                if (state.dragonType === 'LOW') {
                  // Low blockade: player must jump high to survive
                  if (playerY < 1.15) {
                    didHit = true;
                  }
                } else {
                  // High strike: player must slide/crouch under fire sheet
                  if (!state.playerIsSliding) {
                    didHit = true;
                  }
                }

                if (didHit) {
                  // Damage the player immediately reusing the robust core engine
                  const mockEntity = {
                    hit: false,
                    type: 'CYBER_DRAGON',
                    poolKey: '',
                    z: -4.5,
                    x: state.dragonX
                  } as any;
                  handleObstacleCrash(mockEntity, state.dragonMesh as THREE.Group);
                }
              }

              // Cleanup after crossing opposite boundary
              const isOffscreen = state.dragonSide === 'LEFT' ? (state.dragonX > 16) : (state.dragonX < -16);
              if (isOffscreen) {
                if (state.dragonMesh) {
                  state.dragonMesh.parent?.remove(state.dragonMesh);
                  state.dragonMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                      if (child.geometry) child.geometry.dispose();
                      if (child.material) {
                        if (Array.isArray(child.material)) {
                          child.material.forEach((m) => m.dispose());
                        } else {
                          child.material.dispose();
                        }
                      }
                    }
                  });
                  state.dragonMesh = null;
                }
                state.dragonActive = false;
                state.dragonBodySegments = [];
                state.dragonFireMesh = null;
                state.dragonSegmentPositions = [];

                // Reset unpredictable cooldown of 40 to 60 seconds
                const minDragonCooldown = 40;
                const maxDragonCooldown = 60;
                const nextDragonTime = Date.now() + (Math.random() * (maxDragonCooldown - minDragonCooldown) + minDragonCooldown) * 1000;
                state.nextDragonTimestamp = nextDragonTime;
              }
            }
          }
        }

        // Active entities processing (Movement, Collisions, Dying animations)
        const updatedEntities: typeof state.entities = [];

        state.entities.forEach(({ entityDef, mesh }) => {
          // If entity is dying, animate scale and fade out smoothly
          if (entityDef.isDying) {
            entityDef.deathTime = (entityDef.deathTime || 0) - delta;

            // Spin, ascend, and shrink rapidly to 0
            mesh.rotation.y += delta * 15;
            mesh.position.y += delta * 6;
            mesh.scale.multiplyScalar(0.85);

            if (entityDef.deathTime! <= 0 || mesh.scale.x < 0.01) {
              scene.remove(mesh);
              // Recycle back to Object Pool
              if (entityDef.poolKey) {
                stateRef.current.pools[entityDef.poolKey].push(mesh);
              }
            } else {
              updatedEntities.push({ entityDef, mesh });
            }
            return;
          }

          // Slide Pitfalls horizontal sine wave movement
          if (entityDef.type === 'PITFALL') {
            if (entityDef.isMoving) {
              const time = nowTime * 0.001;
              const slideSpd = entityDef.slideSpeed || 3.0;
              const slideX = Math.sin(time * slideSpd) * state.laneWidth * 1.1;
              mesh.position.x = slideX;
              entityDef.currentX = slideX;
            } else {
              mesh.position.x = entityDef.lane * state.laneWidth;
              entityDef.currentX = entityDef.lane * state.laneWidth;
            }
          }

          // Slide Gas Canister horizontal ping-pong movement
          if (entityDef.type === 'GAS_CANISTER') {
            const time = nowTime * 0.001; // elapsed time in seconds
            // High speed sliding back and forth (speed factor 5.5 to make it dynamic and challenging)
            const canisterSpeed = 5.5;
            // Swing from -laneWidth to +laneWidth
            const slideX = Math.sin(time * canisterSpeed) * state.laneWidth;
            mesh.position.x = slideX;
            entityDef.currentX = slideX;
          }

          // Bullet Bill & normal moving hazards/coins scrolling
          const movementSpeed = state.speed + (entityDef.speed || 0);
          entityDef.z += movementSpeed * delta;
          mesh.position.z = entityDef.z;

          // Wobble/march Goombas or rotate spiked shells
          if (entityDef.type === 'GOOMBA') {
            if (entityDef.poolKey === 'SPIKED_SHELL') {
              // Spiked shell spins rapidly
              mesh.rotation.y += delta * 12;
            } else {
              // Normal Goomba waddles
              mesh.rotation.z = Math.sin(nowTime * 0.01) * 0.2;
            }
            entityDef.lane += Math.sin(nowTime * 0.003) * delta * 0.45 as any;
            mesh.position.x = entityDef.lane * state.laneWidth;
          }

          // Spin active coins hovering gracefully with sine-wave variance
          if (entityDef.type === 'COIN') {
            mesh.rotation.y += delta * 4;
            mesh.position.y = entityDef.y + Math.sin(nowTime * 0.005 + entityDef.z * 0.15) * 0.15;
          }

          // Floating hover effect on Power-up icons
          if (entityDef.type === 'POWERUP') {
            mesh.rotation.y += delta * 2.2;
            mesh.position.y = Math.sin(nowTime * 0.005 + entityDef.z * 0.2) * 0.12;
            const innerIcon = mesh.getObjectByName("innerIcon");
            if (innerIcon) {
              innerIcon.rotation.y += delta * 3.5;
              innerIcon.rotation.x = Math.sin(nowTime * 0.003) * 0.25;
            }
          }

          // Floating hover effect on Question blocks
          if (entityDef.type === 'BLOCK') {
            if (entityDef.speed) {
              // Bullet Bill floats and oscillates subtly
              mesh.position.y = entityDef.y + Math.sin(nowTime * 0.01) * 0.05;
            } else {
              mesh.position.y = entityDef.y + Math.sin(nowTime * 0.005) * 0.15;
              mesh.rotation.y += delta * 1.5;
            }
          }

          // Highly precise box-sphere collision checks
          const dz = Math.abs(entityDef.z - 0.1);
          let collided = false;
          if (entityDef.type === 'PITFALL') {
            const pitX = entityDef.currentX !== undefined ? entityDef.currentX : (entityDef.lane * state.laneWidth);
            const dx = Math.abs(pitX - state.playerCurrentX);
            const hitWidth = entityDef.width === 2 ? state.laneWidth * 1.4 : 0.85;
            collided = dz < 1.1 && dx < hitWidth;
          } else if (entityDef.type === 'GAS_CANISTER') {
            const canX = entityDef.currentX !== undefined ? entityDef.currentX : (entityDef.lane * state.laneWidth);
            const dx = Math.abs(canX - state.playerCurrentX);
            collided = dz < 0.8 && dx < 0.75;
          } else {
            const dx = Math.abs((entityDef.lane * state.laneWidth) - state.playerCurrentX);
            collided = dz < 0.8 && dx < 0.75;
          }

          if (collided && !entityDef.hit) {
            // High-dopamine Nitro Smashing! Run right through obstacles with glowing golden explosions!
            if (state.nitroTime > 0 && entityDef.type !== 'COIN' && entityDef.type !== 'POWERUP') {
              entityDef.hit = true;
              entityDef.isDying = true;
              entityDef.deathTime = 0.35;
              state.score += 300;
              if (hudScoreRef.current) {
                hudScoreRef.current.textContent = state.score.toLocaleString();
              }
              gameAudio.playBlockHit();
              spawnScoreParticles(mesh.position.x, mesh.position.y + 0.5, entityDef.z, '#ffd700');
              
              mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.material = child.material.clone();
                }
              });
              
              updatedEntities.push({ entityDef, mesh });
              return;
            }

            if (entityDef.type === 'PITFALL') {
              if (state.playerY < 0.35) {
                entityDef.hit = true;
                handleObstacleCrash(entityDef, mesh);
                // Safely snap player back on road to prevent endless falling
                state.playerY = 0;
                state.playerIsJumping = false;
                state.playerJumpVelocity = 0;
              }
            }
            else if (entityDef.type === 'COIN') {
              entityDef.hit = true;
              state.coins += 1;
              state.score += state.nitroTime > 0 ? 150 : 50;

              // Write directly to DOM HUD elements for 0ms lag updates
              if (hudCoinsRef.current) {
                hudCoinsRef.current.textContent = state.coins.toString().padStart(3, '0');
              }
              if (hudScoreRef.current) {
                hudScoreRef.current.textContent = state.score.toLocaleString();
              }

              gameAudio.playCoin();
              spawnScoreParticles(mesh.position.x, 0.65, entityDef.z, '#ffd700');

              // Kickoff soft coin scale/fade death animation
              entityDef.isDying = true;
              entityDef.deathTime = 0.35;
            } 
            else if (entityDef.type === 'POWERUP') {
              entityDef.hit = true;
              const pType = entityDef.powerUpType || 'laser';
              triggerPowerUp(pType);

              gameAudio.playCoin();
              spawnScoreParticles(mesh.position.x, 1.3, entityDef.z, 
                pType === 'laser' ? '#ff00ff' :
                pType === 'bounce' ? '#39ff14' :
                pType === 'jetpack' ? '#00ffff' :
                pType === 'princess' ? '#ff1493' :
                pType === 'magnet' ? '#ffcc00' : '#ffd700'
              );

              entityDef.isDying = true;
              entityDef.deathTime = 0.35;
            }
            else if (entityDef.type === 'BLOCK') {
              entityDef.hit = true;

              if (entityDef.speed) {
                // Rushing Bullet Bill flying hazard
                if (state.playerIsSliding) {
                  // Slid safely underneath!
                  entityDef.hit = false;
                } else {
                  // Crashed!
                  handleObstacleCrash(entityDef, mesh);
                }
              } else {
                // Question Block
                state.score += 200;

                if (hudScoreRef.current) {
                  hudScoreRef.current.textContent = state.score.toLocaleString();
                }

                // Randomly trigger one of our 6 power-ups!
                const powerUpTypes = ['laser', 'bounce', 'jetpack', 'princess', 'magnet', 'nitro'];
                const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                triggerPowerUp(randomPowerUp);

                gameAudio.playBlockHit();
                spawnScoreParticles(mesh.position.x, 1.3, entityDef.z, '#ff9900');

                // Smashed block death fade animation
                entityDef.isDying = true;
                entityDef.deathTime = 0.35;
              }
            } 
            else if (entityDef.type === 'FLOATING_PIPE') {
              if (!state.playerIsSliding) {
                handleObstacleCrash(entityDef, mesh);
              }
            } 
            else if (entityDef.type === 'GAS_CANISTER') {
              // Can be jumped over if Mario is above 0.8 height!
              if (state.playerY < 0.8) {
                entityDef.hit = true;
                
                // TRIGGER DETONATION EVENT:
                // 1. Instantly trigger a quick particle flash at the point of impact.
                spawnScoreParticles(mesh.position.x, 0.4, entityDef.z, '#ff6600'); // Orange hazard particles
                spawnScoreParticles(mesh.position.x, 0.4, entityDef.z, '#39ff14'); // Toxic green hazard particles
                
                // 2. Play sound warning/detonation
                gameAudio.playBlockHit();
                
                // 3. Shake camera slightly for visceral impact
                state.cameraShake = 0.5;

                // 4. Activate the dense blinding environmental screen fog overlay for 1.5 seconds (within 1-2 seconds constraint)
                state.fogBlockActive = true;
                state.fogBlockDuration = 1.5; // Exactly 1.5 seconds blinding fog penalty
                state.fogBlockTime = state.fogBlockDuration;

                // 5. Kickoff canister death/detonation animation (scale down and disappear)
                entityDef.isDying = true;
                entityDef.deathTime = 0.35;
              }
            }
            else {
              const thresholdY = entityDef.type === 'PIPE' ? 1.2 : 0.5;
              if (state.playerY < thresholdY) {
                handleObstacleCrash(entityDef, mesh);
              }
            }
          }

          // Off-camera cleanup: Return back to pool or safely dispose geometries & materials
          if (entityDef.z > 10) {
            scene.remove(mesh);
            if (entityDef.poolKey) {
              stateRef.current.pools[entityDef.poolKey].push(mesh);
            } else {
              // Staggered cleanup: queue non-pooled custom meshes for throttled disposal
              disposalQueue.push(mesh);
            }
          } else {
            updatedEntities.push({ entityDef, mesh });
          }
        });

        state.entities = updatedEntities;

        // Execute throttled disposal of non-pooled assets once every 30 frames
        if (frameCount % 30 === 0 && disposalQueue.length > 0) {
          const itemsToCleanup = disposalQueue.splice(0, 5);
          itemsToCleanup.forEach((m) => {
            m.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                  } else {
                    child.material.dispose();
                  }
                }
              }
            });
          });
        }
      }

      // 10. Update floating burst particles with ZERO allocations
      const remainingParticles: typeof state.particles = [];
      state.particles.forEach((p) => {
        p.life -= delta;
        p.velocity.y -= 18 * delta; // Gravity pull
        p.mesh.position.addScaledVector(p.velocity, delta);

        if (p.life <= 0) {
          scene.remove(p.mesh);
        } else {
          remainingParticles.push(p);
        }
      });
      state.particles = remainingParticles;

      // 10b. Throttled high-level state synchronization (React render decoupling)
      if (state.status === 'RUNNING') {
        const now = performance.now();
        if (now - lastStatsSyncTime > 1000) {
          onStatsChangeRef.current({
            coins: state.coins,
            score: state.score,
            distance: state.distance,
            lives: state.lives,
            activeLevel: state.activeLevel,
          });
          lastStatsSyncTime = now;
        }
      }

      // 11. Over-the-shoulder dynamic camera tracking
      let dragonShakeX = 0;
      let dragonShakeY = 0;
      if (state.dragonActive && state.dragonWarningTimer > 0) {
        // High frequency heavy localized warning camera shake
        dragonShakeX = (Math.random() - 0.5) * 0.75;
        dragonShakeY = (Math.random() - 0.5) * 0.75;
      }

      const shakeX = (Math.random() - 0.5) * state.cameraShake;
      const shakeY = (Math.random() - 0.5) * state.cameraShake;

      camera.position.x = state.playerCurrentX * 0.45 + shakeX + dragonShakeX;
      camera.position.y = 3.8 + shakeY + dragonShakeY;
      camera.lookAt(state.playerCurrentX * 0.35, 1.2, -10);

      renderer.render(scene, camera);
      } catch (error) {
        console.error("Game loop error caught and isolated safely:", error);
      }
    };

    frameId = requestAnimationFrame(gameLoop);

    // Clean up WebGL resources and prevent memory leaks
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
      scene.clear();
      renderer.dispose();

      // Dispose shared geometries
      coinGeom.dispose();
      blockGeom.dispose();
      pipeRimGeom.dispose();
      pipeBodyGeom.dispose();
      crossbarGeom.dispose();
      supportGeom.dispose();
      stemGeom.dispose();
      capGeom.dispose();
      eyeGeom.dispose();
      pupilGeom.dispose();

      // Dispose materials
      roadMat.dispose();
      sidePlatformMat.dispose();
      neonBorderMat.dispose();
      neonPinkMat.dispose();
      pipeMat.dispose();
      coinMat.dispose();
      qBlockMat.dispose();
      goombaMat.dispose();
      goombaCapMat.dispose();

      // Dispose textures
      brickTex.dispose();
      pipeTex.dispose();
      qBlockTex.dispose();
      coinTex.dispose();
      emblemTex.dispose();
      fogTexture.dispose();
      fogQuadGeom.dispose();
      fogQuadMat.dispose();
    };
  }, []);

  // Handle manual game restart
  const handleRestart = () => {
    const state = stateRef.current;

    // Clean up active sky obstacles
    if (state.skyObstacles) {
      state.skyObstacles.forEach((obs) => {
        obs.mesh.parent?.remove(obs.mesh);
      });
      state.skyObstacles = [];
    }
    state.skyObstacleActiveEvent = null;
    state.lastSkySpawnTime = 0;

    // Reset sky states
    const minCooldownSeconds = 15;
    const maxCooldownSeconds = 30;
    const nextTime = Date.now() + (Math.random() * (maxCooldownSeconds - minCooldownSeconds) + minCooldownSeconds) * 1000;
    state.nextSkyEventTimestamp = nextTime;
    setNextSkyEventTimestamp(nextTime);
    setSkyObstacleActiveEvent(null);
    setSkyWarningType(null);
    setSkyFlashActive(false);

    // Clean up active cyber dragon
    if (state.dragonMesh) {
      state.dragonMesh.parent?.remove(state.dragonMesh);
      state.dragonMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      state.dragonMesh = null;
    }
    state.dragonActive = false;
    state.dragonBodySegments = [];
    state.dragonFireMesh = null;
    state.dragonSegmentPositions = [];
    state.dragonWarningTimer = 0;
    const minDragonCooldown = 40;
    const maxDragonCooldown = 60;
    const nextDragonTime = Date.now() + (Math.random() * (maxDragonCooldown - minDragonCooldown) + minDragonCooldown) * 1000;
    state.nextDragonTimestamp = nextDragonTime;
    setDragonWarningSide(null);
    setDragonWarningType(null);

    // Remove old obstacles safely and recycle back to object pools
    state.entities.forEach(({ entityDef, mesh }) => {
      mesh.parent?.remove(mesh);
      if (entityDef.poolKey && state.pools[entityDef.poolKey]) {
        state.pools[entityDef.poolKey].push(mesh);
      }
    });
    state.entities = [];

    // Reset scenery positions and set their level 1 sub-group to visible
    state.sceneryItems.forEach((item, index) => {
      const stepIndex = Math.floor(index / 4);
      const isRoadside = item.userData.isRoadside;
      const z = -120 + stepIndex * 18 + (isRoadside ? 9 : 0);
      item.position.z = z;
      
      const isRight = item.userData.isRight;
      if (isRoadside) {
        item.position.x = isRight ? 5.2 : -5.2;
      } else {
        item.position.x = isRight ? (16 + Math.random() * 12) : (-16 - Math.random() * 12);
      }
      
      if (item.children[0]) item.children[0].visible = true;
      if (item.children[1]) item.children[1].visible = false;
      if (item.children[2]) item.children[2].visible = false;
    });

    // Reset scores
    state.score = 0;
    state.coins = 0;
    state.distance = 0;
    state.lives = 3;
    state.speed = 15.0 + ((state.activeMap || 1) - 1) * 1.5;
    state.invincibleTime = 0;
    state.shieldActive = false;
    state.playerLane = 0;
    state.playerCurrentX = 0;
    state.playerY = 0;
    state.playerIsJumping = false;
    state.playerIsSliding = false;
    state.activeLevel = 1;
    state.currentSpawnLevel = 1;

    // Reset HUD text directly in DOM to keep the UI perfectly synced
    if (hudScoreRef.current) hudScoreRef.current.textContent = '0';
    if (hudCoinsRef.current) hudCoinsRef.current.textContent = '000';
    if (hudDistanceRef.current) hudDistanceRef.current.textContent = '0m';
    if (hudLivesRef.current) {
      const hearts = hudLivesRef.current.children;
      for (let idx = 0; idx < 3; idx++) {
        const heart = hearts[idx] as HTMLElement;
        if (heart) {
          heart.className = 'text-lg transition-transform scale-100 text-red-500 text-neon-pink';
        }
      }
    }
    if (hudShieldRef.current) {
      hudShieldRef.current.style.display = 'none';
    }

    onGameReset();
    gameAudio.playBGM();
  };

  return (
    <div
      ref={containerRef}
      id="three-game-container"
      className={`w-full max-w-5xl aspect-[16/9] min-h-[300px] bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl relative select-none ${
        isFullScreen ? 'rounded-none border-none' : ''
      }`}
      onPointerDown={handleTouchStart}
      onPointerMove={handleTouchMove}
      onPointerUp={handleTouchEnd}
      onPointerCancel={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} id="three-game-canvas" className="w-full h-full block" />

      {/* DYNAMIC SKY OBSTACLE WARNING OVERLAYS */}
      {skyWarningType && (
        <div
          id="sky-warning-overlay"
          className={`absolute inset-0 pointer-events-none z-25 flex flex-col justify-between items-center p-6 border-[12px] animate-pulse ${
            skyWarningType === 'BOMB' 
              ? 'border-red-500/50 shadow-[inset_0_0_80px_rgba(239,68,68,0.55)]' 
              : 'border-yellow-500/50 shadow-[inset_0_0_80px_rgba(234,179,8,0.55)]'
          }`}
        >
          {/* Top Cinematic Hazard Banner */}
          <div className={`mt-16 font-mono font-black text-[10px] md:text-xs tracking-[0.25em] px-4 py-2 rounded-lg border shadow-2xl flex items-center gap-2 select-none uppercase ${
            skyWarningType === 'BOMB'
              ? 'bg-red-950/90 border-red-500 text-red-500'
              : 'bg-yellow-950/90 border-yellow-500 text-yellow-500'
          }`}>
            <span className="inline-block animate-ping text-[9px]">⚠️</span>
            <span>
              {skyWarningType === 'BOMB' ? 'BOMBARDMENT INCOMING' : 'AERIAL ARROW STORM'}
            </span>
            <span className="inline-block animate-ping text-[9px]">⚠️</span>
          </div>
          
          {/* Bottom Sub-indicator */}
          <div className={`mb-12 font-mono text-[9px] tracking-widest uppercase opacity-75 ${
            skyWarningType === 'BOMB' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            Take evasive action immediately!
          </div>
        </div>
      )}

      {/* CYBER DRAGON CINEMATIC AMBUSH WARNING OVERLAYS */}
      {dragonWarningSide && (
        <div
          id="cyber-dragon-warning-overlay"
          className={`absolute inset-0 pointer-events-none z-30 flex flex-col justify-between items-center p-8 animate-pulse ${
            dragonWarningSide === 'LEFT'
              ? 'border-l-[24px] border-red-500/70 shadow-[inset_60px_0_100px_rgba(239,68,68,0.45)]'
              : 'border-r-[24px] border-red-500/70 shadow-[inset_-60px_0_100px_rgba(239,68,68,0.45)]'
          }`}
        >
          {/* Top Warning Title */}
          <div className="mt-16 bg-black/90 border border-red-500 text-red-500 font-mono font-black text-xs md:text-sm tracking-[0.2em] px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-2 select-none uppercase">
            <span className="inline-block animate-ping text-[10px]">🔥</span>
            <span>
              {dragonWarningType === 'LOW' 
                ? 'CYBER DRAGON: GROUND BLOCKADE (JUMP!)' 
                : 'CYBER DRAGON: AERIAL FIRE SWEEP (DUCK!)'}
            </span>
            <span className="inline-block animate-ping text-[10px]">🔥</span>
          </div>

          {/* Dynamic Flashing Indicators (Left vs Right) */}
          <div className="flex-1 flex items-center justify-center">
            {dragonWarningSide === 'LEFT' ? (
              <div className="flex items-center gap-2 text-red-500 font-mono text-xl md:text-2xl font-black animate-bounce select-none tracking-widest bg-black/40 px-6 py-3 rounded-xl border border-red-500/30">
                <span>▶▶▶ DETECTED LEFT ▶▶▶</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500 font-mono text-xl md:text-2xl font-black animate-bounce select-none tracking-widest bg-black/40 px-6 py-3 rounded-xl border border-red-500/30">
                <span>◀◀◀ DETECTED RIGHT ◀◀◀</span>
              </div>
            )}
          </div>

          {/* Bottom Alert Text */}
          <div className="mb-12 font-mono text-[10px] tracking-[0.2em] uppercase text-red-400 font-extrabold bg-red-950/80 border border-red-500/40 px-4 py-1.5 rounded-lg">
            {dragonWarningType === 'LOW' 
              ? 'PREPARE TO TIMELY HIGH JUMP!' 
              : 'PREPARE TO CROUCH AND SLIDE UNDER!'}
          </div>
        </div>
      )}

      {/* BLINDING NEON LIGHTNING FLASH OVERLAY */}
      {skyFlashActive && (
        <div
          id="sky-flash-overlay"
          className="absolute inset-0 bg-cyan-400/90 z-35 pointer-events-none mix-blend-screen"
        />
      )}

      {/* GPU ASSET PRE-COMPILATION & MATERIAL WARM-UP LOADING COVER */}
      {!isWarmedUp && (
        <div id="gpu-warmup-loading-overlay" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-40 select-none font-mono">
          <div className="max-w-xs w-full space-y-4 text-center">
            <span className="text-[9px] text-pink-500 animate-pulse tracking-[0.3em] uppercase font-black border border-pink-500/25 px-3 py-1 rounded-full bg-pink-950/20">
              WARM-UP SEQUENCE
            </span>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              OPTIMIZING GPU...
            </h3>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/50 relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest leading-normal">
              Pre-compiling WebGL materials & shaders<br />for all levels
            </p>
          </div>
        </div>
      )}

      {/* BLINDING FOG VOLUMETRIC OVERLAY */}
      <div
        ref={hudFogOverlayRef}
        id="hud-blinding-fog"
        style={{
          display: 'none',
          background: 'radial-gradient(circle, rgba(240, 240, 245, 0.96) 0%, rgba(195, 200, 210, 0.97) 50%, rgba(145, 150, 160, 0.98) 100%)',
          transition: 'opacity 0.15s ease-out'
        }}
        className="absolute inset-0 z-15 pointer-events-none opacity-0 backdrop-blur-[2px]"
      />

      {/* GAME STATS OVERLAY / HUD */}
      {status === 'RUNNING' && (
        <div id="hud-stats-overlay" className="absolute top-4 left-4 right-4 pointer-events-none flex justify-between items-start font-mono z-20">
          {/* Top Left Stats (Lives, Coins) */}
          <div id="hud-left-stats" className="flex flex-col gap-2">
            {/* Lives Hearts */}
            <div id="hud-lives-card" className="bg-black/75 border border-neutral-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-red-500">
              <span className="text-[9px] uppercase text-neutral-400 font-mono tracking-wider">
                {isRtl ? 'القلوب' : 'LIVES'}
              </span>
              <div ref={hudLivesRef} className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="text-lg transition-transform scale-100 text-red-500 text-neon-pink"
                  >
                    ♥
                  </span>
                ))}
              </div>
            </div>

            {/* Coins Counter */}
            <div id="hud-coin-card" className="bg-black/75 border border-neutral-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-yellow-400">
              <span className="text-[9px] uppercase text-neutral-400 font-mono tracking-wider">
                {isRtl ? 'العملات' : 'COINS'}
              </span>
              <span ref={hudCoinsRef} className="font-black text-sm tracking-widest text-neon-yellow">
                000
              </span>
            </div>

            {/* Quick Inventory Activation HUD */}
            <div className="flex gap-1.5 pointer-events-auto">
              {/* Shield Activator */}
              <button
                disabled={playerInventory.shields <= 0}
                onClick={() => {
                  if (playerInventory.shields > 0) {
                    gameAudio.playBlockHit();
                    setPlayerInventory(prev => ({ ...prev, shields: prev.shields - 1 }));
                    
                    const state = stateRef.current;
                    state.shieldActive = true;
                    state.shieldTime = 10.0;
                    if (hudShieldRef.current) {
                      hudShieldRef.current.style.display = 'flex';
                    }
                    
                    // Activate powerup presentation/sound
                    setActivePowerUp('bounce');
                    setActivationKey(Date.now());
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-extrabold tracking-wider transition-all uppercase ${
                  playerInventory.shields > 0
                    ? 'bg-cyan-950/85 border-cyan-400/60 text-cyan-400 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-40'
                }`}
                title="Activate Cyber-Shield (10s)"
              >
                <span>🛡️</span>
                <span>{playerInventory.shields}</span>
              </button>

              {/* Magnet Activator */}
              <button
                disabled={playerInventory.magnets <= 0}
                onClick={() => {
                  if (playerInventory.magnets > 0) {
                    gameAudio.playCoin();
                    setPlayerInventory(prev => ({ ...prev, magnets: prev.magnets - 1 }));
                    
                    const state = stateRef.current;
                    state.magnetTime = 10.0;
                    
                    // Activate powerup presentation/sound
                    setActivePowerUp('magnet');
                    setActivationKey(Date.now());
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-extrabold tracking-wider transition-all uppercase ${
                  playerInventory.magnets > 0
                    ? 'bg-yellow-950/85 border-yellow-400/60 text-yellow-400 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.4)] animate-pulse'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-40'
                }`}
                title="Activate Data-Magnet (10s)"
              >
                <span>🧲</span>
                <span>{playerInventory.magnets}</span>
              </button>
            </div>
          </div>

          {/* Centered Campaign Progress & Controls */}
          <div id="hud-campaign-progress" className="flex flex-col items-center gap-1.5 pt-1 w-1/3 min-w-[200px] max-w-sm pointer-events-auto">
            {/* Horizontal Mini-map & Progress Bar */}
            <div className="w-full bg-black/85 border border-neutral-800/90 rounded-full px-3 py-1.5 flex flex-col gap-0.5 shadow-lg relative overflow-visible">
              <div className="flex justify-between text-[8px] text-neutral-400 font-mono select-none px-1">
                <span>0m</span>
                <span className="text-yellow-400 font-black tracking-widest text-[9px] truncate max-w-[120px]">{MAP_THEMES[activeMap || 1]?.name}</span>
                <span>3000m</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-900 rounded-full relative overflow-visible border border-neutral-800/50">
                {/* Glowing completed track */}
                <div 
                  id="hud-progress-fill"
                  style={{ width: '0%' }}
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)] transition-all duration-100"
                />
                {/* Moving Mario Indicator Icon */}
                <div
                  id="hud-progress-mario"
                  style={{ left: '0%' }}
                  className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center transition-all duration-100 overflow-visible"
                >
                  <div className="w-4 h-4 bg-red-600 border border-white rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md animate-pulse">
                    M
                  </div>
                </div>
              </div>
              <div className="text-center text-[8px] text-cyan-400 mt-0.5">
                SUB-LEVEL: <span id="hud-sublevel-val">1</span>/10
              </div>
            </div>
            
            {/* Pause Control */}
            <button
              onClick={handlePauseToggle}
              className="bg-black/75 border border-neutral-800/80 hover:bg-neutral-900 hover:border-cyan-400 px-3 py-1 rounded-lg flex items-center gap-1.5 text-white font-bold text-[9px] tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Pause className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
              <span>{isRtl ? 'إيقاف مؤقت' : 'PAUSE'}</span>
            </button>
          </div>

          {/* Top Right Stats (Score, Distance) */}
          <div id="hud-right-stats" className="flex flex-col gap-2 items-end">
            {/* Score */}
            <div id="hud-score-card" className="bg-black/75 border border-neutral-800/80 px-3 py-1.5 rounded-xl text-right">
              <div className="text-[9px] text-neutral-400 uppercase tracking-wider">
                {isRtl ? 'النتيجة' : 'SCORE'}
              </div>
              <div ref={hudScoreRef} className="font-black text-base text-cyan-400 text-neon-cyan tracking-wider">
                0
              </div>
            </div>

            {/* Distance meters */}
            <div id="hud-distance-card" className="bg-black/75 border border-neutral-800/80 px-3 py-1.5 rounded-xl text-right">
              <div className="text-[9px] text-neutral-400 uppercase tracking-wider">
                {isRtl ? 'المسافة' : 'DISTANCE'}
              </div>
              <div ref={hudDistanceRef} className="font-black text-sm text-pink-500 text-neon-pink tracking-widest">
                0m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIELD POWER-UP HUD INDICATOR */}
      <div
        ref={hudShieldRef}
        id="hud-shield-alert"
        style={{ display: 'none' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-cyan-950/80 border border-cyan-400/50 px-4 py-1.5 rounded-full text-center z-20 pointer-events-none animate-bounce font-mono text-xs text-cyan-400 flex items-center gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
        <span>
          {isRtl ? 'تفعيل درع الحماية مضاعف النقاط!' : 'SHIELD DOUBLE-SCORE ACTIVE!'} (<span ref={hudShieldTimeRef}>8</span>s)
        </span>
      </div>

      {/* HIGH-DOPAMINE MODULAR ACTIVE POWER-UP HUD */}
      <PowerUpHUD
        activeType={activePowerUp}
        princessCharId={princessCharId}
        activationKey={activationKey}
        isRtl={isRtl}
      />

      {/* LEVEL UP OVERLAY BANNER */}
      <div
        ref={hudLevelUpRef}
        id="hud-level-up-banner"
        style={{ display: 'none' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-neutral-950/95 border-2 border-yellow-500 px-6 py-3 rounded-2xl text-center z-25 pointer-events-none font-mono text-base text-yellow-400 flex flex-col items-center gap-1 shadow-2xl shadow-yellow-500/40 max-w-sm transition-all scale-75 duration-300 opacity-0"
      >
        <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
          {isRtl ? 'تم الارتقاء بمستوى العالم!' : 'WORLD LEVEL UP!'}
        </span>
        <span ref={hudLevelUpTextRef} className="font-black text-xl text-neon-yellow tracking-wider">
          NEON METROPOLIS
        </span>
      </div>

      {/* PAUSE SCREEN / SETTINGS OVERLAY */}
      {status === 'PAUSED' && (() => {
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

        return (
          <div id="paused-screen-overlay" className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-30 select-none animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="bg-neutral-900/90 border border-neutral-800 p-6 md:p-8 rounded-2xl max-w-sm w-full space-y-5 shadow-2xl backdrop-blur-xl pointer-events-auto">
              <div className="space-y-1 text-center">
                <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase border border-cyan-500/30 px-2.5 py-0.5 rounded-full bg-cyan-950/20">
                  {t.paused}
                </span>
                <h2 className="font-mono text-2xl font-black text-white uppercase tracking-tight">
                  {t.settings}
                </h2>
              </div>

              {/* Volume Sliders & Mixing Controls */}
              <div className="space-y-3.5 text-left font-mono text-xs" dir="ltr">
                <h3 className="text-neutral-500 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-800 pb-1 flex items-center justify-between">
                  <span>VOLUME SYSTEM</span>
                </h3>
                
                {/* BGM Volume Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Music className="w-3 h-3 text-pink-500" />
                      {t.bgmVolume}
                    </span>
                    <span className="text-pink-400 font-bold">{Math.round(bgmVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgmVol * 100}
                    onChange={(e) => handleBgmVolChange(Number(e.target.value) / 100)}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* SFX Volume Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      {t.sfxVolume}
                    </span>
                    <span className="text-cyan-400 font-bold">{Math.round(sfxVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVol * 100}
                    onChange={(e) => handleSfxVolChange(Number(e.target.value) / 100)}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Quick Language Toggle */}
              <div className="space-y-2 text-left font-mono text-xs" dir="ltr">
                <h3 className="text-neutral-500 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-800 pb-1">
                  {t.language}
                </h3>
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {(['en', 'ar', 'es', 'fr', 'zh'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`py-1 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
                        currentLang === lang
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-black'
                          : 'bg-neutral-950/40 border-neutral-850 text-neutral-500 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1.5 space-y-2">
                <button
                  onClick={handleResume}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] text-black font-mono text-[11px] font-black tracking-widest transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  {t.resume}
                </button>
                <button
                  onClick={() => {
                    handleRestart();
                    onStatsChangeRef.current({ status: 'RUNNING' });
                  }}
                  className="w-full py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-mono text-[11px] font-bold tracking-widest transition-transform hover:text-white flex items-center justify-center gap-1.5 border border-neutral-700/30 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.restart}
                </button>
                <button
                  onClick={handleReturnToMainMenu}
                  className="w-full py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-mono text-[11px] font-bold tracking-widest transition-transform hover:text-white flex items-center justify-center gap-1.5 border border-neutral-700/30 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t.returnMenu}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* IDLE / LAUNCH SCREEN */}
      {status === 'IDLE' && (() => {
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

        return (
          <div id="idle-screen-overlay" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 z-30 select-none animate-fade-in overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <NeonMenuBackground />
            <div className="max-w-2xl w-full space-y-6 relative z-10 flex flex-col items-center justify-center">
              
              {menuView === 'MAIN' && (
                <div className="space-y-6 animate-fade-in max-w-md w-full">
                  <div className="space-y-2 text-center">
                    <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-950/20">
                      {t.subtitle}
                    </span>
                    <h2 className="font-mono text-3.5xl md:text-5xl font-black tracking-tighter uppercase text-white leading-tight">
                      {t.title}
                    </h2>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* MAIN MENU WALLET DISPLAY */}
                  <div className="flex items-center justify-between max-w-xs mx-auto w-full bg-neutral-900/60 border border-neutral-800/80 rounded-xl px-4 py-2.5 shadow-inner font-mono text-xs animate-fade-in">
                    <span className="text-neutral-400">GOLDEN WALLET:</span>
                    <span className="font-black text-yellow-400 flex items-center gap-1">
                      🪙 {totalCoins.toLocaleString()} COINS
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <button
                      id="start-game-button"
                      onClick={() => {
                        handleRestart();
                        onGameStart();
                      }}
                      className="group relative w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-black font-mono text-xs font-black tracking-widest hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-pink-500/25"
                    >
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 fill-black" />
                        {t.play}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        gameAudio.playBlockHit();
                        setMenuView('MAPS');
                      }}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/40 text-yellow-400 font-mono text-xs font-black tracking-widest hover:border-yellow-300 hover:text-yellow-200 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-yellow-500/5 animate-pulse"
                    >
                      <Map className="w-3.5 h-3.5 text-yellow-400" />
                      CAMPAIGN MAPS
                    </button>

                    <button
                      onClick={() => {
                        gameAudio.playCoin();
                        setMenuView('SETTINGS');
                      }}
                      className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs font-bold tracking-widest hover:border-cyan-400 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Settings className="w-3.5 h-3.5 text-cyan-400" />
                      {t.settings}
                    </button>

                    <button
                      onClick={() => {
                        gameAudio.playBlockHit();
                        setMenuView('SHOP');
                      }}
                      className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs font-bold tracking-widest hover:border-yellow-400 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                      {t.shop}
                    </button>

                    <button
                      onClick={() => {
                        gameAudio.playCoin();
                        setIsCoinExchangeOpen(true);
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 border border-yellow-500/50 text-yellow-400 font-mono text-xs font-black tracking-widest hover:border-yellow-400 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md animate-pulse"
                    >
                      🪙 Get Free Coins
                    </button>
                  </div>

                  {/* Quick controller diagram */}
                  <div id="controls-diagram" className="pt-2 flex justify-center gap-6 text-neutral-500 font-mono text-[10px] uppercase">
                    <span>{t.jump}</span>
                    <span>{t.slide}</span>
                    <span>{t.lanes}</span>
                  </div>
                </div>
              )}

              {menuView === 'SETTINGS' && (
                <div className="bg-neutral-900/90 border border-neutral-800 p-6 md:p-8 rounded-2xl max-w-sm mx-auto space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in text-center">
                  <div className="space-y-1">
                    <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase border border-cyan-500/30 px-2.5 py-0.5 rounded-full bg-cyan-950/20">
                      ARCADE SETUP
                    </span>
                    <h2 className="font-mono text-2xl font-black text-white uppercase tracking-tight">
                      {t.settings}
                    </h2>
                  </div>

                  {/* Volume Sliders & Mixing Controls */}
                  <div className="space-y-3.5 text-left font-mono text-xs" dir="ltr">
                    <h3 className="text-neutral-500 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-800 pb-1 flex items-center justify-between">
                      <span>VOLUME SYSTEM</span>
                    </h3>
                    
                    {/* BGM Volume Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Music className="w-3 h-3 text-pink-500" />
                          {t.bgmVolume}
                        </span>
                        <span className="text-pink-400 font-bold">{Math.round(bgmVol * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={bgmVol * 100}
                        onChange={(e) => handleBgmVolChange(Number(e.target.value) / 100)}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>

                    {/* SFX Volume Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          {t.sfxVolume}
                        </span>
                        <span className="text-cyan-400 font-bold">{Math.round(sfxVol * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sfxVol * 100}
                        onChange={(e) => handleSfxVolChange(Number(e.target.value) / 100)}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Language Selection Grid */}
                  <div className="space-y-2 text-left font-mono text-xs" dir="ltr">
                    <h3 className="text-neutral-500 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-800 pb-1">
                      {t.language}
                    </h3>
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {(['en', 'ar', 'es', 'fr', 'zh'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`py-1 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
                            currentLang === lang
                              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-black'
                              : 'bg-neutral-950/40 border-neutral-850 text-neutral-500 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      gameAudio.playCoin();
                      setMenuView('MAIN');
                    }}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold tracking-widest transition-transform cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t.back}
                  </button>
                </div>
              )}

              {menuView === 'SHOP' && (
                <ShopShowcase
                  totalCoins={totalCoins}
                  setTotalCoins={setTotalCoins}
                  unlockedCharacters={unlockedCharacters}
                  setUnlockedCharacters={setUnlockedCharacters}
                  selectedCharacter={selectedCharacter}
                  setSelectedCharacter={setSelectedCharacter}
                  isTemporaryTrial={isTemporaryTrial}
                  setIsTemporaryTrial={setIsTemporaryTrial}
                  playerInventory={playerInventory}
                  setPlayerInventory={setPlayerInventory}
                  handleWatchAdToTry={handleWatchAdToTry}
                  onClose={() => setMenuView('MAIN')}
                  gameAudio={gameAudio}
                  t={t}
                />
              )}
              {menuView === 'MAPS' && (
                <div className="bg-neutral-900/95 border border-neutral-800 p-5 md:p-6 rounded-2xl max-w-2xl w-full mx-auto space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in text-center font-mono max-h-[85vh] overflow-y-auto pointer-events-auto">
                  <div className="space-y-1">
                    <span className="text-[9px] text-yellow-400 font-mono tracking-widest uppercase border border-yellow-500/30 px-2.5 py-0.5 rounded-full bg-yellow-950/20">
                      CAMPAIGN WORLD SELECTION
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                      SELECT CAMPAIGN WORLD
                    </h2>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Complete 3000m on any map to unlock the next legendary neon world.
                    </p>
                  </div>

                  {/* Overworld-style 10-Map grid (strictly sequential) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mId) => {
                      const theme = MAP_THEMES[mId];
                      const isUnlocked = unlockedMaps.includes(mId);
                      const isActive = activeMap === mId;
                      
                      return (
                        <button
                          key={mId}
                          disabled={!isUnlocked}
                          onClick={() => {
                            if (isUnlocked) {
                              gameAudio.playCoin();
                              setActiveMap(mId);
                            }
                          }}
                          style={
                            isUnlocked
                              ? isActive
                                ? {
                                    borderColor: theme.neonBorder,
                                    boxShadow: `0 0 15px ${theme.neonBorder}40, inset 0 0 10px ${theme.neonBorder}20`,
                                  }
                                : {
                                    '--hover-glow-color': theme.neonBorder,
                                  } as any
                              : undefined
                          }
                          className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all select-none min-h-[145px] group ${
                            isUnlocked
                              ? isActive
                                ? 'bg-neutral-950/90 scale-[1.04] z-10'
                                : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:scale-[1.02] hover:border-[var(--hover-glow-color)] cursor-pointer shadow-md hover:shadow-[0_0_15px_var(--hover-glow-color)]/20'
                              : 'bg-neutral-950/20 border-neutral-900/50 text-neutral-600 cursor-not-allowed overflow-hidden'
                          }`}
                        >
                          {/* Map ID & Locked Indicator */}
                          <div className="flex items-center justify-between w-full text-[8px] font-bold px-1 z-10">
                            <span className={isActive ? 'text-white font-black' : isUnlocked ? 'text-neutral-400' : 'text-neutral-600'}>
                              MAP {mId}
                            </span>
                            {isUnlocked && mId < (activeMap || 1) && (
                              <Trophy className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500/20" />
                            )}
                          </div>

                          {/* 3D miniature map preview component instead of star spheres */}
                          <div className="w-full relative z-10">
                            <ThreeMapPreview mapId={mId} theme={theme} isUnlocked={isUnlocked} isActive={isActive} />
                          </div>

                          {/* Map Theme Name */}
                          <div className="text-[8px] font-black tracking-tight uppercase line-clamp-1 break-all w-full text-center px-1 z-10 transition-colors group-hover:text-white">
                            {theme.name.replace("CYBER ", "").replace("METROPOLIS", "")}
                          </div>

                          {/* Locked overlay with clean padlock icon and blur */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-1.5 z-20 rounded-2xl p-2">
                              <div className="w-7 h-7 rounded-full bg-neutral-900/95 border border-neutral-800 flex items-center justify-center shadow-md">
                                <Lock className="w-3 h-3 text-neutral-500" />
                              </div>
                              <span className="text-[7px] text-neutral-500 font-black tracking-widest uppercase">
                                LOCKED
                              </span>
                              <span className="text-[6px] text-neutral-600 font-bold uppercase text-center max-w-[80px] leading-tight">
                                REQ: CLEAR MAP {mId - 1}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* World Status Details Panel */}
                  <div className="bg-neutral-950/70 border border-neutral-800/80 p-3 rounded-xl text-left space-y-1">
                    <div className="text-[8px] text-neutral-500 uppercase tracking-wider font-bold">
                      ACTIVE WORLD PARAMETERS:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[9px] text-neutral-300">
                      <div>
                        <span className="text-neutral-500">THEME: </span>
                        <span className="font-bold text-yellow-400 uppercase">{MAP_THEMES[activeMap || 1]?.name}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">VISUAL STYLE: </span>
                        <span className="font-bold text-cyan-400 uppercase">
                          {activeMap === 1 ? "NEON GRID" :
                           activeMap === 2 ? "MOLTEN LAVA" :
                           activeMap === 3 ? "MOLTEN GOLD" :
                           activeMap === 4 ? "AQUATIC DEPTHS" :
                           activeMap === 5 ? "TOXIC CYBER" :
                           activeMap === 6 ? "FROZEN GLACIER" :
                           activeMap === 7 ? "HAUNTED SPOOKY" :
                           activeMap === 8 ? "HIGH AIRSHIP" :
                           activeMap === 9 ? "RAINBOW ROAD" : "TITAN CORE"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">START SPEED: </span>
                        <span className="font-bold text-pink-500">{15.0 + ((activeMap || 1) - 1) * 1.5} m/s</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1.5 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        gameAudio.playCoin();
                        setMenuView('MAIN');
                      }}
                      className="w-full sm:w-1/3 py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-[10px] font-bold tracking-widest transition-transform hover:text-white flex items-center justify-center gap-1.5 border border-neutral-700/30 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      BACK TO MENU
                    </button>
                    <button
                      onClick={() => {
                        gameAudio.playCoin();
                        onGameStart();
                      }}
                      className="w-full sm:w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-[1.01] active:scale-[0.99] text-black text-[10px] font-black tracking-widest transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      LAUNCH MISSION: {MAP_THEMES[activeMap || 1]?.name}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* GAME OVER SCREEN */}
      {status === 'GAMEOVER' && (
        <div id="gameover-screen-overlay" className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-30 animate-fade-in">
          <div className="max-w-xs space-y-6">
            <div className="space-y-1">
              <span className="text-xs text-red-500 font-mono tracking-widest text-neon-pink uppercase">
                {isRtl ? 'انتهت المحاولات' : 'Wasted / Game Over'}
              </span>
              <h2 className="font-mono text-4xl font-black text-white tracking-widest animate-pulse">
                {isRtl ? 'انتهت اللعبة' : 'GAME OVER'}
              </h2>
            </div>

            <div id="final-stats-card" className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">{isRtl ? 'النتيجة:' : 'SCORE:'}</span>
                <span className="font-bold text-cyan-400">{stateRef.current.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{isRtl ? 'المسافة:' : 'DISTANCE:'}</span>
                <span className="font-bold text-pink-500">{Math.floor(stateRef.current.distance)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{isRtl ? 'العملات:' : 'COINS:'}</span>
                <span className="font-bold text-yellow-400">{stateRef.current.coins}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Use Stored Heart option */}
              <button
                id="use-stored-heart-button"
                disabled={playerInventory.hearts <= 0}
                onClick={handleUseStoredHeart}
                className={`w-full py-3.5 rounded-xl text-white font-mono text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                  playerInventory.hearts > 0
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:scale-[1.02] active:scale-[0.98] shadow-rose-500/30 cursor-pointer animate-bounce'
                    : 'bg-neutral-800/80 border border-neutral-700/40 text-neutral-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${playerInventory.hearts > 0 ? 'text-white fill-white' : 'text-neutral-500'}`} />
                <span>
                  {isRtl
                    ? `استخدم قلب مخزن (${playerInventory.hearts})`
                    : `USE STORED HEART (${playerInventory.hearts} LEFT)`}
                </span>
              </button>

              <button
                id="revive-game-button"
                onClick={handleStartReviveAd}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] text-white font-mono text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-white fill-white" />
                {isRtl ? `إحياء مجاني (${currentRunRevives + 1} إعلان)` : `REVIVE FREE (${currentRunRevives + 1} AD${currentRunRevives > 0 ? 'S' : ''})`}
              </button>

              <button
                id="restart-game-button"
                onClick={handleRestart}
                className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] text-black font-mono text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                {isRtl ? 'إعادة المحاولة' : 'CONTINUE / REPLAY'}
              </button>

              <button
                id="menu-game-button"
                onClick={() => {
                  gameAudio.playCoin();
                  handleReturnToMainMenu();
                }}
                className="w-full py-3.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] text-neutral-300 hover:text-white font-mono text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 border border-neutral-700/30 cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                {isRtl ? 'القائمة الرئيسية' : 'MAIN MENU'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP COMPLETED / CAMPAIGN VICTORY SCREEN */}
      {mapCompleted && (
        <div id="victory-screen-overlay" className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-35 animate-fade-in font-mono">
          <div className="max-w-md w-full space-y-6 bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-yellow-500/80 p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.35)] pointer-events-auto">
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border-2 border-yellow-400 flex items-center justify-center shadow-lg animate-bounce mb-2">
                <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-500/20" />
              </div>
              <span className="text-[10px] text-yellow-400 font-bold tracking-[0.3em] uppercase">
                MISSION ACCOMPLISHED!
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                MAP COMPLETED
              </h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest text-center mt-1">
                Completed: <span className="text-yellow-400">{MAP_THEMES[activeMap || 1]?.name}</span>
              </p>
            </div>

            <div id="victory-stats-card" className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">FINAL SCORE:</span>
                <span className="font-black text-base text-cyan-400 tracking-wider">{stateRef.current.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">DISTANCE RECORDED:</span>
                <span className="font-bold text-pink-500">3,000m (MAX)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">GOLD COINS COLLECTED:</span>
                <span className="font-bold text-yellow-400">+{stateRef.current.coins} Coins</span>
              </div>
            </div>

            {/* Unlock Notification banner if next map exists */}
            {(activeMap || 1) < 10 && (
              <div className="bg-green-950/20 border border-green-500/30 p-2.5 rounded-lg text-[9px] text-green-400 text-center uppercase tracking-widest leading-relaxed">
                🎉 NEXT LEVEL UNLOCKED: <span className="font-black text-yellow-400">{MAP_THEMES[(activeMap || 1) + 1]?.name}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => {
                  gameAudio.playCoin();
                  setMapCompleted(false);
                  handleReturnToMainMenu();
                }}
                className="w-full sm:w-1/3 py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-bold tracking-widest transition-transform cursor-pointer flex items-center justify-center gap-1 border border-neutral-700/30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                OVERWORLD
              </button>
              
              {(activeMap || 1) < 10 ? (
                <button
                  onClick={() => {
                    gameAudio.playCoin();
                    setMapCompleted(false);
                    const nextM = (activeMap || 1) + 1;
                    setActiveMap(nextM);
                    setTimeout(() => {
                      handleRestart();
                      onStatsChangeRef.current({ status: 'RUNNING' });
                    }, 50);
                  }}
                  className="w-full sm:w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-[1.02] active:scale-[0.98] text-black text-[10px] font-black tracking-widest transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/25"
                >
                  <Play className="w-3.5 h-3.5 fill-black animate-pulse" />
                  NEXT MISSION
                </button>
              ) : (
                <button
                  onClick={() => {
                    gameAudio.playCoin();
                    setMapCompleted(false);
                    handleReturnToMainMenu();
                  }}
                  className="w-full sm:w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] text-black text-[10px] font-black tracking-widest transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Trophy className="w-3.5 h-3.5 fill-black" />
                  CAMPAIGN COMPLETE!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMBEDDED CONTROLS BAR (Bottom right control icons overlaying canvas) */}
      <div id="fullscreen-control-wrapper" className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button
          id="fullscreen-toggle-button"
          onClick={toggleFullScreen}
          className="p-2 rounded-lg bg-black/75 border border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all pointer-events-auto"
          title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* MOBILE TAP INSTRUCTIONS */}
      {status === 'RUNNING' && (
        <div id="mobile-swipe-instruction" className="absolute bottom-4 left-4 z-20 bg-black/70 border border-neutral-800/50 px-2.5 py-1 rounded-md text-[9px] font-mono text-neutral-400 pointer-events-none md:hidden uppercase tracking-widest">
          {isRtl ? 'اسحب للتحكم بالبطل' : 'Swipe screen to play'}
        </div>
      )}

      {/* REWARDED VIDEO AD COUNTDOWN OVERLAY */}
      {isShowingAd && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in font-mono select-none pointer-events-auto">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-pink-500/80 p-6 rounded-2xl space-y-6 shadow-2xl shadow-pink-500/20">
            {/* Ad header */}
            <div className="space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30">
                CYBER-BROADCASTING PARTNER NETWORK
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight pt-2">
                SPONSOR AD TRANSMISSION
              </h3>
            </div>

            {/* Simulated interactive video display */}
            <div className="relative aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-neutral-900/10 to-neutral-950/80 z-0"></div>
              
              {/* Rotating ad content depending on character */}
              <div className="z-10 space-y-2">
                <p className="text-pink-500 font-bold text-xs animate-pulse">
                  {adCharacterId === 'princess_peach' ? 'AD: PRE-ORDER PRINCESS RACING WHEELS!' :
                   adCharacterId === 'cyber_gorilla' ? 'AD: DRINK DK BANANA PROTEIN SHAKE FOR MAX ENERGY!' :
                   'AD: UPGRADE YOUR CHIPSETS AT NEO-TOKYO ROBOTICS!'}
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  "Experience 200% faster response times and sub-zero liquid nitrogen cooling!"
                </p>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 transition-all duration-1000"
                  style={{ width: `${((1 - adTimer) / 1) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="space-y-3">
              <div className="text-2xl font-black text-yellow-400">
                {adTimer}s REMAINING
              </div>
              <div className="text-xs text-pink-400 font-bold uppercase tracking-wider bg-pink-950/40 border border-pink-500/30 py-1 px-3 rounded-lg inline-block">
                AD {adWatchCount + 1} OF {Math.max(1, Math.floor((CHARACTER_ROSTER.find(c => c.id === adCharacterId)?.price || 0) / 10000))} IN PROGRESS
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Unlocking <span className="text-white font-bold">{CHARACTER_ROSTER.find(c => c.id === adCharacterId)?.name}</span> for one trial run once all broadcasts finish.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COIN EXCHANGE MODAL */}
      {isCoinExchangeOpen && (
        <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 text-center animate-fade-in font-mono select-none pointer-events-auto">
          <div className="max-w-md w-full bg-neutral-900 border border-yellow-500/80 p-6 rounded-2xl space-y-6 shadow-2xl shadow-yellow-500/10">
            <div className="space-y-1">
              <span className="text-[10px] text-yellow-400 uppercase tracking-widest px-2.5 py-1 rounded bg-yellow-950/40 border border-yellow-500/30">
                CYBER Coin Exchange
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight pt-2">
                Tiered Reward Offers
              </h3>
              <p className="text-xs text-neutral-400">
                Watch short sponsor ads sequentially to claim free gold coins permanently!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleStartExchangeAd(1)}
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 hover:border-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">Watch 1 Ad</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Single sponsor stream</span>
                </div>
                <span className="text-yellow-400 font-black text-sm">🪙 +300 COINS</span>
              </button>

              <button
                onClick={() => handleStartExchangeAd(2)}
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 hover:border-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">Watch 2 Ads</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Double sequential ads</span>
                </div>
                <span className="text-yellow-400 font-black text-sm">🪙 +800 COINS</span>
              </button>

              <button
                onClick={() => handleStartExchangeAd(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 hover:border-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">Watch 3 Ads</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Mega triple ad chain</span>
                </div>
                <span className="text-yellow-400 font-black text-sm">🪙 +1500 COINS</span>
              </button>
            </div>

            <button
              onClick={() => {
                gameAudio.playCoin();
                setIsCoinExchangeOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-neutral-700/30"
            >
              CLOSE PANEL
            </button>
          </div>
        </div>
      )}

      {/* COIN EXCHANGE AD PLAYER OVERLAY */}
      {isWatchingExchangeAd && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in font-mono select-none pointer-events-auto">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-yellow-500/80 p-6 rounded-2xl space-y-6 shadow-2xl shadow-yellow-500/20">
            <div className="space-y-1">
              <span className="text-[10px] text-yellow-400 uppercase tracking-widest px-2.5 py-1 rounded bg-yellow-950/40 border border-yellow-500/30">
                CYBER-BROADCASTING SPONSOR STREAMS
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight pt-2">
                COIN REWARD STREAMING
              </h3>
            </div>

            <div className="relative aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-neutral-900/10 to-neutral-950/80 z-0"></div>
              
              <div className="z-10 space-y-2">
                <p className="text-yellow-500 font-bold text-xs animate-pulse">
                  {exchangeAdCurrentIndex === 0 ? 'AD: NEO-TOKYO ULTRA HOVERBOARD GENERATION III' :
                   exchangeAdCurrentIndex === 1 ? 'AD: BUY 1 GET 1 CYBERNETIC MUSHROOM DECOCTION!' :
                   'AD: MUSHROOM KINGDOM MEGAPLEX EXPANSION OUT NOW'}
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  "Step into the future. Enhance your sensory processing speed by up to 300%."
                </p>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-1000"
                  style={{ width: `${((exchangeAdCurrentIndex + (1 - exchangeAdCountdown)) / (exchangeAdTier === 1 ? 1 : exchangeAdTier === 2 ? 2 : 3)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-2xl font-black text-yellow-400">
                {exchangeAdCountdown}s REMAINING
              </div>
              <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider bg-yellow-950/40 border border-yellow-500/30 py-1 px-3 rounded-lg inline-block">
                AD {exchangeAdCurrentIndex + 1} OF {exchangeAdTier === 1 ? 1 : exchangeAdTier === 2 ? 2 : 3} IN PROGRESS
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Stay tuned to receive your <span className="text-yellow-400 font-black">{exchangeAdTier === 1 ? '300' : exchangeAdTier === 2 ? '800' : '1500'} coins</span>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REVIVE AD PLAYER OVERLAY */}
      {isWatchingReviveAd && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in font-mono select-none pointer-events-auto">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-red-500/80 p-6 rounded-2xl space-y-6 shadow-2xl shadow-red-500/20">
            <div className="space-y-1">
              <span className="text-[10px] text-red-400 uppercase tracking-widest px-2.5 py-1 rounded bg-red-950/40 border border-red-500/30">
                CYBER-BROADCASTING REVIVAL PROTOCOL
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight pt-2">
                EMERGENCY DEFIBRILLATOR BROADCAST
              </h3>
            </div>

            <div className="relative aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-neutral-900/10 to-neutral-950/80 z-0"></div>
              
              <div className="z-10 space-y-2">
                <p className="text-red-500 font-bold text-xs animate-pulse">
                  {reviveAdCurrentIndex === 0 ? 'AD: CYBER DECK PRO SYSTEM UPDATE' :
                   reviveAdCurrentIndex === 1 ? 'AD: JOIN THE CYBER RUNNER 3D GRAND PRIX!' :
                   'AD: RECOVER LIFE CORES WITH POWER-UP GEL PACKS'}
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  "Revitalize your gameplay metrics with real-time neural synchronizer arrays."
                </p>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${((reviveAdCurrentIndex + (1 - reviveAdCountdown)) / (currentRunRevives + 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-2xl font-black text-red-400">
                {reviveAdCountdown}s REMAINING
              </div>
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider bg-red-950/40 border border-red-500/30 py-1 px-3 rounded-lg inline-block">
                AD {reviveAdCurrentIndex + 1} OF {currentRunRevives + 1} IN PROGRESS
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Stay tuned to receive <span className="text-red-400 font-black">1 HEART</span> and continue your run!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
