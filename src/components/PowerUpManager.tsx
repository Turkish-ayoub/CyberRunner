/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { Zap, Star, Shield, Magnet, Flame, Sword, Crown, Sparkles, UserCheck } from 'lucide-react';

export type PowerUpType = 'laser' | 'bounce' | 'jetpack' | 'princess' | 'magnet' | 'nitro';

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number;
  maxTime: number; // usually 10.0
  princessCharId?: string;
}

export interface PowerUpConfig {
  type: PowerUpType;
  title: string;
  desc: string;
  color: string;
  shadowColor: string;
  icon: React.ReactNode;
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  laser: {
    type: 'laser',
    title: 'LASER BLAST',
    desc: 'PRESS SPACE/SHIFT TO OBLITERATE ALL OBSTACLES!',
    color: '#ff00ff',
    shadowColor: 'rgba(255, 0, 255, 0.5)',
    icon: <Sword className="w-5 h-5 text-fuchsia-400" />,
  },
  bounce: {
    type: 'bounce',
    title: 'HIGH LEAPER',
    desc: 'RUBBER BOUNCE! MASSIVE GRAVITY-DEFYING JUMPS INTO THE SKY!',
    color: '#39ff14',
    shadowColor: 'rgba(57, 255, 20, 0.5)',
    icon: <Zap className="w-5 h-5 text-green-400" />,
  },
  jetpack: {
    type: 'jetpack',
    title: 'JETPACK FLIGHT',
    desc: 'HIGH-ALTITUDE SKY FLIGHT! VACUUMS COINS AUTOMATICALLY!',
    color: '#00ffff',
    shadowColor: 'rgba(0, 255, 255, 0.5)',
    icon: <Flame className="w-5 h-5 text-cyan-400" />,
  },
  princess: {
    type: 'princess',
    title: 'PRINCESS COMPANION',
    desc: 'A HOLOGRAPHIC PRINCESS RUNNING TIGHTLY IN LOCKSTEP WITH YOU!',
    color: '#ff1493',
    shadowColor: 'rgba(255, 20, 147, 0.5)',
    icon: <Crown className="w-5 h-5 text-pink-400" />,
  },
  magnet: {
    type: 'magnet',
    title: 'COIN MAGNET',
    desc: 'MAGNETIC FORCEPULLS ALL SURROUNDING GRID COINS TO YOU!',
    color: '#ffaa00',
    shadowColor: 'rgba(255, 170, 0, 0.5)',
    icon: <Magnet className="w-5 h-5 text-amber-400" />,
  },
  nitro: {
    type: 'nitro',
    title: 'NITRO SPEED',
    desc: 'DOUBLE SPEED & ENTIRELY INVINCIBLE MULTIPLIER BOOST!',
    color: '#ffd700',
    shadowColor: 'rgba(255, 215, 0, 0.5)',
    icon: <Star className="w-5 h-5 text-yellow-400" />,
  },
};

interface PowerUpHUDProps {
  activeType: PowerUpType | null;
  princessCharId?: string;
  activationKey: number; // Used to reset the internal timer on collection
  isRtl?: boolean;
}

/**
 * High-Dopamine HUD overlay that shows the active powerup with rich neon animations.
 * Runs its own self-contained high-performance loop for countdowns, preventing parent re-renders.
 */
export const PowerUpHUD: React.FC<PowerUpHUDProps> = ({ activeType, princessCharId, activationKey, isRtl }) => {
  const [localTimeLeft, setLocalTimeLeft] = React.useState(10.0);

  React.useEffect(() => {
    if (!activeType) {
      setLocalTimeLeft(0);
      return;
    }

    setLocalTimeLeft(10.0);
    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setLocalTimeLeft((prev) => {
        const next = prev - delta;
        return next <= 0 ? 0 : next;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [activeType, activationKey]);

  if (!activeType || localTimeLeft <= 0) return null;

  const config = POWERUP_CONFIGS[activeType];
  const percent = Math.max(0, Math.min(100, (localTimeLeft / 10.0) * 100));

  let displayTitle = config.title;
  let displayDesc = config.desc;

  if (activeType === 'princess' && princessCharId) {
    displayTitle = `HOLOGRAM PRINCESS ${princessCharId.toUpperCase()}`;
    displayDesc = isRtl
      ? `تجري الأميرة ${princessCharId} معك خطوة بخطوة للحماية ومضاعفة المكافآت!`
      : `PRINCESS ${princessCharId.toUpperCase()} RUNS IN PERFECT SYNCED LOCKSTEP WITH MARIO!`;
  }

  if (isRtl) {
    if (activeType === 'laser') {
      displayTitle = 'سلاح شعاع الليزر';
      displayDesc = 'اضغط على SPACE أو SHIFT لإطلاق ليزر مدمر ينسف كل العوائق!';
    } else if (activeType === 'bounce') {
      displayTitle = 'القفزات المطاطية المرتفعة';
      displayDesc = 'سرعة قفز مضاعفة لتجاوز العقبات الكبيرة والتحليق عالياً!';
    } else if (activeType === 'jetpack') {
      displayTitle = 'حقيبة الطيران النفاثة';
      displayDesc = 'حلق في مسارات آمنة واجمع العملات الذهبية الطائرة تلقائياً!';
    } else if (activeType === 'magnet') {
      displayTitle = 'مغناطيس جذب العملات';
      displayDesc = 'يجذب جميع العملات الذهبية المحيطة بنصف قطر 15 وحدة!';
    } else if (activeType === 'nitro') {
      displayTitle = 'تعديل نيترو الخارق';
      displayDesc = 'سرعة فائقة مزدوجة مع حصانة كاملة ضد التصادم!';
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
        className="absolute top-24 left-1/2 -translate-x-1/2 bg-neutral-950/90 backdrop-blur-md border-2 rounded-2xl px-5 py-3 text-center z-25 pointer-events-none font-mono text-sm flex flex-col items-center gap-1 shadow-[0_0_30px_rgba(0,0,0,0.8)] min-w-[280px]"
        style={{
          borderColor: config.color,
          boxShadow: `0 0 20px ${config.shadowColor}, inset 0 0 10px ${config.shadowColor}`,
        }}
      >
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-1.5 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"
              style={{ boxShadow: `0 0 10px ${config.shadowColor}` }}
            >
              {config.icon}
            </motion.div>
            <span className="font-black tracking-widest text-white uppercase text-xs">
              {displayTitle}
            </span>
          </div>
          <span 
            className="font-black text-xs px-2 py-0.5 rounded-lg text-white bg-white/10 select-none font-mono min-w-[50px] text-right"
            style={{ textShadow: `0 0 10px ${config.color}` }}
          >
            {localTimeLeft.toFixed(1)}s
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-2 border border-white/5 relative">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: config.color,
              width: `${percent}%`,
              boxShadow: `0 0 12px ${config.color}`,
            }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Action description text */}
        <div className="text-[10px] text-neutral-400 font-sans tracking-wide leading-tight max-w-[250px] mt-1.5 uppercase text-center font-bold">
          {displayDesc}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- THREE JS POWER-UP GRAPHICS & SYSTEM METHODS ---

/**
 * Creates highly detailed 3D meshes for floating powerup icons on the neon track
 */
export function createPowerUpMeshHelper(
  type: PowerUpType,
  materials: {
    neonMagenta: THREE.Material;
    neonGreenBasic: THREE.Material;
    neonCyan: THREE.Material;
    neonYellow: THREE.Material;
    gold: THREE.Material;
  },
  geometries: {
    box: THREE.BufferGeometry;
    cylinder: THREE.BufferGeometry;
    sphere: THREE.BufferGeometry;
  }
): THREE.Group {
  const group = new THREE.Group();

  // 1. High contrast glowing outer sphere halo wireframe
  const outerMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: type === 'laser' ? '#ff00ff' :
              type === 'bounce' ? '#39ff14' :
              type === 'jetpack' ? '#00ffff' :
              type === 'princess' ? '#ff1493' :
              type === 'magnet' ? '#ffcc00' : '#ffd700',
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
  });

  const outerHalo = new THREE.Mesh(geometries.sphere, outerMat);
  outerHalo.scale.setScalar(0.48);
  outerHalo.position.y = 1.3;
  group.add(outerHalo);

  // 2. Build detailed modular interior components representing each icon
  let innerMesh: THREE.Object3D;

  if (type === 'laser') {
    const gunGroup = new THREE.Group();
    const body = new THREE.Mesh(geometries.box, new THREE.MeshStandardMaterial({ color: '#252525', metalness: 0.8, roughness: 0.2 }));
    body.scale.set(0.12, 0.12, 0.38);

    const barrel = new THREE.Mesh(geometries.cylinder, materials.neonMagenta);
    barrel.scale.set(0.04, 0.22, 0.04);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.22;

    const sight = new THREE.Mesh(geometries.box, new THREE.MeshStandardMaterial({ color: '#ff00ff', emissive: '#ff00ff', emissiveIntensity: 1.2 }));
    sight.scale.set(0.03, 0.05, 0.05);
    sight.position.set(0, 0.08, -0.05);

    gunGroup.add(body, barrel, sight);
    innerMesh = gunGroup;
  } else if (type === 'bounce') {
    const springGroup = new THREE.Group();
    const base = new THREE.Mesh(geometries.cylinder, materials.neonGreenBasic);
    base.scale.set(0.18, 0.04, 0.18);

    const cap = new THREE.Mesh(geometries.cylinder, new THREE.MeshStandardMaterial({ color: '#111111' }));
    cap.scale.set(0.16, 0.04, 0.16);
    cap.position.y = 0.2;

    const ring1 = new THREE.Mesh(geometries.sphere, new THREE.MeshStandardMaterial({ color: '#39ff14', emissive: '#39ff14', emissiveIntensity: 1.6 }));
    ring1.scale.set(0.14, 0.14, 0.14);
    ring1.position.y = 0.1;

    springGroup.add(base, ring1, cap);
    innerMesh = springGroup;
  } else if (type === 'jetpack') {
    const jetGroup = new THREE.Group();
    const tankMat = new THREE.MeshStandardMaterial({ color: '#2d2d2d', metalness: 0.9, roughness: 0.1 });

    const cy1 = new THREE.Mesh(geometries.cylinder, tankMat);
    cy1.scale.set(0.1, 0.35, 0.1);
    cy1.position.x = -0.11;

    const cy2 = cy1.clone();
    cy2.position.x = 0.11;

    const noz1 = new THREE.Mesh(geometries.cylinder, materials.neonCyan);
    noz1.scale.set(0.06, 0.1, 0.06);
    noz1.position.set(-0.11, -0.22, 0);

    const noz2 = noz1.clone();
    noz2.position.x = 0.11;

    jetGroup.add(cy1, cy2, noz1, noz2);
    innerMesh = jetGroup;
  } else if (type === 'princess') {
    const crownGroup = new THREE.Group();
    const crownBase = new THREE.Mesh(geometries.cylinder, materials.gold);
    crownBase.scale.set(0.16, 0.06, 0.16);

    const jewel = new THREE.Mesh(geometries.sphere, new THREE.MeshStandardMaterial({ color: '#ff1493', emissive: '#ff1493', emissiveIntensity: 1.5 }));
    jewel.scale.setScalar(0.06);
    jewel.position.set(0, 0.08, 0);

    crownGroup.add(crownBase, jewel);
    crownGroup.rotation.x = Math.PI / 12;
    innerMesh = crownGroup;
  } else if (type === 'magnet') {
    const magnetGroup = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: '#ff2200', roughness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#0077ff', roughness: 0.3 });

    const leg1 = new THREE.Mesh(geometries.cylinder, redMat);
    leg1.scale.set(0.05, 0.25, 0.05);
    leg1.position.set(-0.1, 0, 0);

    const leg2 = new THREE.Mesh(geometries.cylinder, blueMat);
    leg2.scale.set(0.05, 0.25, 0.05);
    leg2.position.set(0.1, 0, 0);

    const arch = new THREE.Mesh(geometries.cylinder, redMat);
    arch.scale.set(0.05, 0.2, 0.05);
    arch.rotation.z = Math.PI / 2;
    arch.position.set(0, 0.12, 0);

    magnetGroup.add(leg1, leg2, arch);
    magnetGroup.rotation.z = Math.PI; // Inverted horseshoe look
    innerMesh = magnetGroup;
  } else {
    // Nitro lightning bolts
    const boltGroup = new THREE.Group();
    const boltMat = materials.neonYellow;

    const box1 = new THREE.Mesh(geometries.box, boltMat);
    box1.scale.set(0.1, 0.28, 0.05);
    box1.rotation.z = -Math.PI / 6;
    box1.position.set(0.05, 0.08, 0);

    const box2 = new THREE.Mesh(geometries.box, boltMat);
    box2.scale.set(0.1, 0.28, 0.05);
    box2.rotation.z = -Math.PI / 6;
    box2.position.set(-0.05, -0.08, 0);

    boltGroup.add(box1, box2);
    innerMesh = boltGroup;
  }

  innerMesh.position.y = 1.3;
  innerMesh.name = "innerIcon";
  group.add(innerMesh);

  group.userData = { powerUpType: type };
  return group;
}

/**
 * Handles delta updates for the Princess hologram mesh position so she runs seamlessly in lockstep next to Mario
 */
export function updatePrincessHologramPosition(
  princessGroup: THREE.Group,
  marioX: number,
  marioY: number,
  nowTime: number,
  princessCharId: string
) {
  // Float tightly to the left or right side based on lane
  const sideOffset = marioX > 0 ? -1.15 : 1.15;
  princessGroup.position.x = marioX + sideOffset;
  // Dynamic floating hover motion
  princessGroup.position.y = marioY + Math.sin(nowTime * 0.012) * 0.06;
  princessGroup.position.z = -0.55; // Slightly behind/beside Mario

  // Swiveling & tilt rotation
  princessGroup.rotation.z = Math.sin(nowTime * 0.015) * 0.08;
  princessGroup.rotation.y = Math.PI + Math.sin(nowTime * 0.01) * 0.04;
}

/**
 * Smooth Vector Lerp for coin magnet attraction
 */
export function updateCoinMagnetAttraction(
  coinMesh: THREE.Object3D,
  playerX: number,
  playerY: number,
  playerZ: number,
  delta: number
) {
  const lerpFactor = delta * 12.0;
  coinMesh.position.x += (playerX - coinMesh.position.x) * lerpFactor;
  coinMesh.position.y += (playerY + 0.65 - coinMesh.position.y) * lerpFactor;
  
  // Bring Z closer to player
  const currentZ = coinMesh.position.z;
  coinMesh.position.z += (playerZ - currentZ) * lerpFactor;
}
