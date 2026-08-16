import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Lock, Check, Zap, Play, ArrowLeft, ChevronLeft, ChevronRight, Shield, Heart, Magnet, Sparkles, Coins, Gift } from 'lucide-react';
import { CHARACTER_ROSTER, CONSUMABLES_LIST } from './ThreeGame';
import { gameAdManager, COIN_TIERS_CONFIG } from '../utils/adManager';

interface ShopShowcaseProps {
  totalCoins: number;
  setTotalCoins: React.Dispatch<React.SetStateAction<number>>;
  unlockedCharacters: string[];
  setUnlockedCharacters: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCharacter: string;
  setSelectedCharacter: (id: string) => void;
  isTemporaryTrial: boolean;
  setIsTemporaryTrial: (trial: boolean) => void;
  playerInventory: { hearts: number; shields: number; magnets: number };
  setPlayerInventory: React.Dispatch<React.SetStateAction<{ hearts: number; shields: number; magnets: number }>>;
  handleWatchAdToTry: (charId: string) => void;
  onClose: () => void;
  gameAudio: any;
  t: any;
}

// High-Quality Procedural Cyberpunk Character Generator
export function buildSmoothCyberCharacter(
  charGroup: THREE.Group,
  charId: string,
  color: string,
  accentColor: string
) {
  while (charGroup.children.length > 0) {
    charGroup.remove(charGroup.children[0]);
  }

  // 1. High-End PBR Materials
  const primaryColor = color || '#00f0ff';
  const glowColor = accentColor || color || '#00f0ff';
  const darkAlloyColor = '#101018';
  const deepPantsColor =
    charId === 'red_mario'
      ? '#0b1d51'
      : charId === 'blue_mario'
      ? '#081426'
      : charId === 'green_mario'
      ? '#063028'
      : charId === 'yellow_mario'
      ? '#3b0764'
      : '#14141e';

  const armorMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.85,
    roughness: 0.22,
  });

  const secondaryArmorMat = new THREE.MeshStandardMaterial({
    color: accentColor || '#38bdf8',
    metalness: 0.8,
    roughness: 0.25,
  });

  const darkBodyMat = new THREE.MeshStandardMaterial({
    color: darkAlloyColor,
    metalness: 0.65,
    roughness: 0.35,
  });

  const suitUnderlayerMat = new THREE.MeshStandardMaterial({
    color: deepPantsColor,
    metalness: 0.4,
    roughness: 0.6,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.95,
    roughness: 0.12,
  });

  if (charId === 'cyber_gorilla') {
    // ----------------------------------------------------
    // A. MECHA CYBER TITAN (Heavy Armored Robot)
    // ----------------------------------------------------
    const chest = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.38, 32, 32),
      armorMat
    );
    chest.position.set(0, 0.72, 0);
    chest.scale.set(1.15, 1.0, 0.95);
    charGroup.add(chest);

    const reactorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 16, 32),
      chromeMat
    );
    reactorRing.position.set(0, 0.76, 0.28);
    charGroup.add(reactorRing);

    const reactorCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 32, 32),
      glowMat
    );
    reactorCore.position.set(0, 0.76, 0.25);
    reactorCore.scale.set(1, 1, 0.6);
    charGroup.add(reactorCore);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.015, 16, 24),
      glowMat
    );
    innerRing.position.set(0, 0.76, 0.29);
    charGroup.add(innerRing);

    const titanHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 32),
      darkBodyMat
    );
    titanHead.position.set(0, 1.15, 0.03);
    titanHead.scale.set(1.05, 0.9, 1.05);
    charGroup.add(titanHead);

    const titanBrow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.24, 16, 32),
      armorMat
    );
    titanBrow.rotation.z = Math.PI / 2;
    titanBrow.position.set(0, 1.22, 0.14);
    charGroup.add(titanBrow);

    const titanVisor = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.26, 16, 32),
      glowMat
    );
    titanVisor.rotation.z = Math.PI / 2;
    titanVisor.position.set(0, 1.14, 0.22);
    charGroup.add(titanVisor);

    [-1, 1].forEach((dir) => {
      const shoulder = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.14, 0.22, 24, 32),
        armorMat
      );
      shoulder.position.set(dir * 0.48, 0.88, 0);
      shoulder.rotation.z = dir * -0.4;
      charGroup.add(shoulder);

      const shoulderGlow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.03, 0.16, 12, 16),
        glowMat
      );
      shoulderGlow.position.set(dir * 0.54, 0.89, 0.05);
      shoulderGlow.rotation.z = dir * -0.4;
      charGroup.add(shoulderGlow);

      const upperArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.2, 16, 24),
        darkBodyMat
      );
      upperArm.position.set(dir * 0.46, 0.62, 0);
      charGroup.add(upperArm);

      const forearm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.22, 16, 24),
        armorMat
      );
      forearm.position.set(dir * 0.47, 0.38, 0.04);
      charGroup.add(forearm);

      const fist = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 24, 24),
        chromeMat
      );
      fist.position.set(dir * 0.47, 0.22, 0.08);
      charGroup.add(fist);
    });

    [-1, 1].forEach((dir) => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.26, 20, 24),
        suitUnderlayerMat
      );
      leg.position.set(dir * 0.2, 0.3, 0);
      charGroup.add(leg);

      const kneePad = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        armorMat
      );
      kneePad.position.set(dir * 0.2, 0.32, 0.11);
      charGroup.add(kneePad);

      const foot = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.11, 0.16, 16, 24),
        darkBodyMat
      );
      foot.rotation.x = Math.PI / 2;
      foot.position.set(dir * 0.2, 0.09, 0.06);
      charGroup.add(foot);

      const footGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.02, 0.22),
        glowMat
      );
      footGlow.position.set(dir * 0.2, 0.02, 0.06);
      charGroup.add(footGlow);
    });
  } else if (charId === 'princess_peach') {
    // ----------------------------------------------------
    // B. PRINCESS NOVA (Neon Cyber-Monarch)
    // ----------------------------------------------------
    const gown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.44, 0.65, 32, 1, false),
      armorMat
    );
    gown.position.set(0, 0.36, 0);
    charGroup.add(gown);

    const bottomTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.022, 16, 32),
      glowMat
    );
    bottomTrim.position.set(0, 0.04, 0);
    bottomTrim.rotation.x = Math.PI / 2;
    charGroup.add(bottomTrim);

    const waistBelt = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.018, 16, 32),
      glowMat
    );
    waistBelt.position.set(0, 0.64, 0);
    waistBelt.rotation.x = Math.PI / 2;
    charGroup.add(waistBelt);

    const corset = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.24, 24, 32),
      secondaryArmorMat
    );
    corset.position.set(0, 0.76, 0);
    corset.scale.set(1.0, 1.0, 0.85);
    charGroup.add(corset);

    [-1, 1].forEach((dir) => {
      const collarWing = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.28, 16, 24),
        armorMat
      );
      collarWing.position.set(dir * 0.22, 0.78, -0.05);
      collarWing.rotation.z = dir * -0.35;
      collarWing.rotation.y = dir * 0.25;
      charGroup.add(collarWing);

      const wingGlow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.025, 0.24, 12, 16),
        glowMat
      );
      wingGlow.position.set(dir * 0.24, 0.8, -0.04);
      wingGlow.rotation.z = dir * -0.35;
      charGroup.add(wingGlow);
    });

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      darkBodyMat
    );
    head.position.set(0, 1.1, 0);
    charGroup.add(head);

    const crownBase = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.016, 16, 32),
      glowMat
    );
    crownBase.position.set(0, 1.2, 0);
    crownBase.rotation.x = Math.PI / 2;
    charGroup.add(crownBase);

    [-0.1, 0, 0.1].forEach((xOffset, i) => {
      const height = i === 1 ? 0.12 : 0.08;
      const crownSpire = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, height, 16),
        glowMat
      );
      crownSpire.position.set(
        xOffset,
        1.22 + height / 2,
        0.14 - Math.abs(xOffset) * 0.5
      );
      crownSpire.rotation.x = 0.2;
      charGroup.add(crownSpire);
    });

    [-1, 1].forEach((dir) => {
      const eyeOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 20, 20),
        glowMat
      );
      eyeOrb.position.set(dir * 0.075, 1.1, 0.17);
      charGroup.add(eyeOrb);
    });

    [-1, 1].forEach((dir) => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.26, 16, 24),
        armorMat
      );
      arm.position.set(dir * 0.24, 0.72, 0);
      arm.rotation.z = dir * -0.22;
      charGroup.add(arm);

      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        chromeMat
      );
      glove.position.set(dir * 0.29, 0.52, 0.04);
      charGroup.add(glove);
    });
  } else if (charId === 'princess_daisy') {
    // ----------------------------------------------------
    // C. SOLAR VALKYRIE (Golden Energetic Warrior)
    // ----------------------------------------------------
    const chest = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 0.3, 32, 32),
      armorMat
    );
    chest.position.set(0, 0.72, 0);
    chest.scale.set(1.05, 1.0, 0.85);
    charGroup.add(chest);

    const solarCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 24, 24),
      glowMat
    );
    solarCore.position.set(0, 0.75, 0.17);
    charGroup.add(solarCore);

    [-0.07, 0.0, 0.07].forEach((yOffset) => {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.012, 12, 24, Math.PI * 0.8),
        glowMat
      );
      rib.position.set(0, 0.68 + yOffset, 0.12);
      rib.rotation.y = Math.PI * 0.1;
      rib.rotation.x = Math.PI * 0.1;
      charGroup.add(rib);
    });

    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.38, 0.45, 24, 1, false),
      armorMat
    );
    skirt.position.set(0, 0.36, 0);
    charGroup.add(skirt);

    const skirtTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.02, 16, 32),
      glowMat
    );
    skirtTrim.position.set(0, 0.14, 0);
    skirtTrim.rotation.x = Math.PI / 2;
    charGroup.add(skirtTrim);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      darkBodyMat
    );
    head.position.set(0, 1.1, 0);
    charGroup.add(head);

    [-0.14, -0.07, 0, 0.07, 0.14].forEach((x, i) => {
      const height = i === 2 ? 0.16 : i === 1 || i === 3 ? 0.13 : 0.09;
      const ray = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, height, 5),
        glowMat
      );
      ray.position.set(x, 1.2 + height / 2, 0.1 - Math.abs(x) * 0.4);
      ray.rotation.z = -x * 1.5;
      charGroup.add(ray);
    });

    [-1, 1].forEach((dir) => {
      const eye = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.035, 0.09, 12, 16),
        glowMat
      );
      eye.position.set(dir * 0.065, 1.1, 0.17);
      eye.rotation.z = dir * 0.45;
      charGroup.add(eye);

      const shoulder = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.2, 16, 24),
        armorMat
      );
      shoulder.position.set(dir * 0.28, 0.84, 0);
      shoulder.rotation.z = dir * -0.5;
      charGroup.add(shoulder);

      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.045, 0.24, 16, 20),
        suitUnderlayerMat
      );
      arm.position.set(dir * 0.26, 0.64, 0);
      arm.rotation.z = dir * -0.2;
      charGroup.add(arm);
    });
  } else if (charId === 'rosalina') {
    // ----------------------------------------------------
    // D. COSMIC ASTRAL OPERATIVE (Alien/Cosmic Goddess)
    // ----------------------------------------------------
    const astralBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.4, 0.62, 32, 1, false),
      armorMat
    );
    astralBody.position.set(0, 0.38, 0);
    charGroup.add(astralBody);

    const astralBottom = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.02, 16, 32),
      glowMat
    );
    astralBottom.position.set(0, 0.08, 0);
    astralBottom.rotation.x = Math.PI / 2;
    charGroup.add(astralBottom);

    const stellarCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 24, 24),
      glowMat
    );
    stellarCore.position.set(0, 0.74, 0.18);
    charGroup.add(stellarCore);

    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.012, 16, 32),
      chromeMat
    );
    orbitRing.position.set(0, 0.74, 0.18);
    orbitRing.rotation.x = Math.PI / 3;
    orbitRing.rotation.y = Math.PI / 4;
    charGroup.add(orbitRing);

    const corset = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.26, 24, 32),
      secondaryArmorMat
    );
    corset.position.set(0, 0.74, 0);
    charGroup.add(corset);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32),
      darkBodyMat
    );
    head.position.set(0, 1.1, 0);
    charGroup.add(head);

    const cosmicCrest = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.32, 24, 32),
      armorMat
    );
    cosmicCrest.position.set(0, 1.2, -0.08);
    cosmicCrest.rotation.x = -0.4;
    cosmicCrest.scale.set(1.05, 1.0, 0.75);
    charGroup.add(cosmicCrest);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.014, 16, 32),
      glowMat
    );
    halo.position.set(0, 1.32, -0.02);
    halo.rotation.x = Math.PI / 2.3;
    charGroup.add(halo);

    const cosmicVisor = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.18, 16, 24),
      glowMat
    );
    cosmicVisor.rotation.z = Math.PI / 2;
    cosmicVisor.position.set(0, 1.1, 0.18);
    charGroup.add(cosmicVisor);

    [-1, 1].forEach((dir) => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.28, 16, 24),
        armorMat
      );
      arm.position.set(dir * 0.25, 0.72, 0);
      arm.rotation.z = dir * -0.22;
      charGroup.add(arm);
    });
  } else {
    // ----------------------------------------------------
    // E. VANGUARD SQUAD (Athletic Cyber-Runners 1-4)
    // ----------------------------------------------------
    const chest = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.21, 0.32, 32, 32),
      armorMat
    );
    chest.position.set(0, 0.7, 0);
    chest.scale.set(1.05, 1.0, 0.9);
    charGroup.add(chest);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.02, 16, 32),
      glowMat
    );
    collar.position.set(0, 0.92, 0);
    collar.rotation.x = Math.PI / 2;
    charGroup.add(collar);

    const energyZip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.32, 12, 16),
      glowMat
    );
    energyZip.position.set(0, 0.68, 0.2);
    charGroup.add(energyZip);

    const centerNode = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      glowMat
    );
    centerNode.position.set(0, 0.75, 0.21);
    charGroup.add(centerNode);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      darkBodyMat
    );
    head.position.set(0, 1.14, 0);
    charGroup.add(head);

    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7),
      armorMat
    );
    capDome.position.set(0, 1.18, -0.01);
    capDome.scale.set(1.02, 0.94, 1.04);
    charGroup.add(capDome);

    const capBrim = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.2, 16, 24),
      armorMat
    );
    capBrim.rotation.z = Math.PI / 2;
    capBrim.position.set(0, 1.16, -0.18);
    charGroup.add(capBrim);

    const hudVisor = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.065, 0.22, 16, 32),
      glowMat
    );
    hudVisor.rotation.z = Math.PI / 2;
    hudVisor.position.set(0, 1.13, 0.16);
    charGroup.add(hudVisor);

    [-1, 1].forEach((dir) => {
      const reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        chromeMat
      );
      reticle.position.set(dir * 0.07, 1.13, 0.22);
      charGroup.add(reticle);

      const earNode = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16),
        secondaryArmorMat
      );
      earNode.position.set(dir * 0.23, 1.14, 0);
      earNode.rotation.z = Math.PI / 2;
      charGroup.add(earNode);
    });

    [-1, 1].forEach((dir) => {
      const shoulderPad = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 20, 20),
        armorMat
      );
      shoulderPad.position.set(dir * 0.26, 0.82, 0);
      charGroup.add(shoulderPad);

      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.05, 0.22, 16, 20),
        suitUnderlayerMat
      );
      arm.position.set(dir * 0.27, 0.64, 0);
      arm.rotation.z = dir * -0.22;
      charGroup.add(arm);

      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        chromeMat
      );
      glove.position.set(dir * 0.32, 0.48, 0.04);
      charGroup.add(glove);
    });

    const pelvis = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.16, 20, 24),
      suitUnderlayerMat
    );
    pelvis.position.set(0, 0.42, 0);
    pelvis.scale.set(1.1, 0.9, 0.9);
    charGroup.add(pelvis);

    [-1, 1].forEach((dir) => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075, 0.24, 16, 20),
        suitUnderlayerMat
      );
      leg.position.set(dir * 0.11, 0.24, 0);
      charGroup.add(leg);

      const kneeGuard = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        armorMat
      );
      kneeGuard.position.set(dir * 0.11, 0.24, 0.08);
      charGroup.add(kneeGuard);

      const boot = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075, 0.14, 16, 20),
        armorMat
      );
      boot.rotation.x = Math.PI / 2;
      boot.position.set(dir * 0.11, 0.07, 0.04);
      charGroup.add(boot);

      const bootSole = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.18),
        glowMat
      );
      bootSole.position.set(dir * 0.11, 0.015, 0.04);
      charGroup.add(bootSole);
    });
  }

  charGroup.scale.set(0.85, 0.85, 0.85);
}

// Dedicated 3D Pedestal Viewer for a single character (Isolated THREE.Scene per card)
const CharacterPedestalViewer: React.FC<{
  charId: string;
  color: string;
  accentColor: string;
  isSelected: boolean;
}> = ({ charId, color, accentColor, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 200;
    const height = containerRef.current.clientHeight || 220;

    // 1. FRESH ISOLATED SCENE (Contains ONLY THIS character)
    const cardScene = new THREE.Scene();
    cardScene.background = null;

    // 2. DEDICATED CAMERA
    const cardCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    cardCamera.position.set(0, 1.0, 2.2);
    cardCamera.lookAt(0, 0.6, 0);

    // 3. RENDERER
    const cardRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    cardRenderer.setSize(width, height);
    cardRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cardRenderer.shadowMap.enabled = true;

    // 4. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    const spotLight = new THREE.SpotLight(accentColor || color || 0x00f0ff, 2.5);
    spotLight.position.set(0, 3, 2);
    spotLight.target.position.set(0, 0.6, 0);
    cardScene.add(ambientLight, spotLight);
    cardScene.add(spotLight.target);

    // 5. SINGLE CENTERED PEDESTAL (STRICTLY AT 0, -0.05, 0)
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x151520, metalness: 0.8, roughness: 0.2 })
    );
    pedestal.position.set(0, -0.05, 0);
    cardScene.add(pedestal);

    // Glowing Neon Ring on Pedestal
    const neonMat = new THREE.MeshStandardMaterial({
      color: accentColor || color || 0x00f0ff,
      emissive: accentColor || color || 0x00f0ff,
      emissiveIntensity: isSelected ? 3.2 : 2.2,
      roughness: 0.1,
    });
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.016, 12, 32), neonMat);
    ringMesh.position.set(0, 0.005, 0);
    ringMesh.rotation.x = Math.PI / 2;
    cardScene.add(ringMesh);

    // 6. SINGLE CENTERED CHARACTER MESH (STRICTLY AT 0, 0, 0)
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 0, 0); // MUST BE 0,0,0
    buildSmoothCyberCharacter(charGroup, charId, color, accentColor);
    cardScene.add(charGroup);

    // 7. Continuous Smooth 360 Rotation Animation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      charGroup.rotation.y += 0.012;
      cardRenderer.render(cardScene, cardCamera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cardCamera.aspect = w / h;
      cardCamera.updateProjectionMatrix();
      cardRenderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      cardRenderer.dispose();
    };
  }, [charId, color, accentColor, isSelected]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[200px] md:min-h-[240px] relative flex items-center justify-center pointer-events-none"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block rounded-xl"
      />
    </div>
  );
};

export const ShopShowcase: React.FC<ShopShowcaseProps> = ({
  totalCoins,
  setTotalCoins,
  unlockedCharacters,
  setUnlockedCharacters,
  selectedCharacter,
  setSelectedCharacter,
  isTemporaryTrial,
  setIsTemporaryTrial,
  playerInventory,
  setPlayerInventory,
  handleWatchAdToTry,
  onClose,
  gameAudio,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<'VANGUARD' | 'ELITE' | 'CONSUMABLES' | 'COIN_VAULT'>('VANGUARD');

  // Split character roster into squads of 4 for clean 4-pedestal alignment
  const vanguardSquad = CHARACTER_ROSTER.slice(0, 4);
  const eliteSquad = CHARACTER_ROSTER.slice(4, 8);
  const currentSquad = activeTab === 'VANGUARD' ? vanguardSquad : eliteSquad;

  const handleEarnCoinsTier = (tier: number) => {
    gameAudio.playBlockHit();
    gameAdManager.buyCoinsWithAds(tier, (coinsEarned) => {
      setTotalCoins((prev) => prev + coinsEarned);
    });
  };

  return (
    <div className="bg-neutral-950/95 border border-neutral-800 p-4 md:p-6 rounded-3xl max-w-5xl w-full mx-auto space-y-4 shadow-2xl backdrop-blur-2xl animate-fade-in font-mono max-h-[92vh] overflow-y-auto pointer-events-auto text-neutral-200">
      
      {/* 1. Top Bar: Title & Golden Wallet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-850 pb-3 gap-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
              CYBERNETIC ROSTER
            </h2>
            <span className="text-[9px] text-yellow-400 font-mono tracking-widest uppercase border border-yellow-500/40 px-2 py-0.5 rounded-full bg-yellow-950/30">
              GOLDEN SHOP
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Operative showroom. Inspect 3D pedestals, equip unlocked chassis, or test-drive via ad transmissions.
          </p>
        </div>

        {/* Golden Wallet Header Indicator */}
        <div className="flex items-center gap-3 bg-neutral-900/90 border border-yellow-500/30 rounded-2xl px-4 py-2 shadow-inner self-start sm:self-auto">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-xs text-neutral-950 shadow-md shadow-yellow-500/30">
            $
          </div>
          <div className="text-right">
            <div className="text-[9px] text-yellow-500/80 font-bold tracking-widest uppercase">GOLDEN WALLET</div>
            <div className="text-sm font-black text-yellow-400">{totalCoins.toLocaleString()} <span className="text-[10px]">COINS</span></div>
          </div>
        </div>
      </div>

      {/* 2. Squad / Category Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-850 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              gameAudio.playCoin();
              setActiveTab('VANGUARD');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'VANGUARD'
                ? 'bg-cyan-500 text-neutral-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Vanguard Squad (1-4)
          </button>

          <button
            onClick={() => {
              gameAudio.playCoin();
              setActiveTab('ELITE');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ELITE'
                ? 'bg-pink-500 text-white font-black shadow-lg shadow-pink-500/20'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Elite Specialists (5-8)
          </button>

          <button
            onClick={() => {
              gameAudio.playCoin();
              setActiveTab('CONSUMABLES');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CONSUMABLES'
                ? 'bg-yellow-400 text-neutral-950 font-black shadow-lg shadow-yellow-400/20'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Cyber-PowerUps
          </button>

          <button
            onClick={() => {
              gameAudio.playCoin();
              setActiveTab('COIN_VAULT');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COIN_VAULT'
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-neutral-950 font-black shadow-lg shadow-yellow-500/30'
                : 'bg-neutral-900/80 text-yellow-400/80 hover:text-yellow-300 hover:bg-neutral-800 border border-yellow-500/20'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Earn Coins (Ads)
          </button>
        </div>
      </div>

      {/* 3. SHOWROOM DISPLAY: 4-PEDESTAL WALL & UNIFIED INFO PANEL */}
      {(activeTab === 'VANGUARD' || activeTab === 'ELITE') && (
        <div className="space-y-4">
          
          {/* 3A. The 4-Pedestal Cyber Showroom Stage */}
          <div className="bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-neutral-950 border border-neutral-800 rounded-2xl p-2.5 sm:p-4 relative overflow-hidden shadow-2xl">
            
            {/* Showroom Ambient Neon Ceiling Fixtures */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
              {currentSquad.map((char) => {
                const isEquipped = selectedCharacter === char.id && !isTemporaryTrial;
                const isTrialActive = selectedCharacter === char.id && isTemporaryTrial;
                const isUnlocked = unlockedCharacters.includes(char.id);

                return (
                  <div
                    key={char.id}
                    className={`relative rounded-xl flex flex-col items-center justify-between border transition-all duration-300 overflow-hidden ${
                      isEquipped
                        ? 'border-cyan-400/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : isTrialActive
                        ? 'border-pink-500/80 bg-pink-950/20 shadow-lg shadow-pink-500/10'
                        : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    {/* Top Spotlight Fixture & Status Indicator */}
                    <div className="w-full pt-2.5 px-3 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: char.accentColor || char.color }}
                        />
                        <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">
                          BAY 0{char.id.includes('1') ? '1' : ''}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {isEquipped && (
                        <span className="text-[8px] bg-cyan-500 text-neutral-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-cyan-500/40">
                          EQUIPPED
                        </span>
                      )}
                      {isTrialActive && (
                        <span className="text-[8px] bg-pink-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm shadow-pink-500/40">
                          TRIAL ACTIVE
                        </span>
                      )}
                      {!isUnlocked && !isTrialActive && (
                        <div className="w-4 h-4 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-neutral-500" />
                        </div>
                      )}
                    </div>

                    {/* Single Centered 3D Pedestal Canvas */}
                    <div className="w-full h-48 sm:h-56 relative">
                      <CharacterPedestalViewer
                        charId={char.id}
                        color={char.color}
                        accentColor={char.accentColor}
                        isSelected={isEquipped || isTrialActive}
                      />
                    </div>

                    {/* Pedestal Bottom Base Glow Strip */}
                    <div 
                      className="w-full h-1 opacity-75"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${char.accentColor || char.color}, transparent)`
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3B. UNIFIED INFO PANEL ALIGNED DIRECTLY BELOW PEDESTALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {currentSquad.map((char) => {
              const isUnlocked = unlockedCharacters.includes(char.id);
              const isEquipped = selectedCharacter === char.id && !isTemporaryTrial;
              const isTrialActive = selectedCharacter === char.id && isTemporaryTrial;
              const canAfford = totalCoins >= char.price;
              const requiredAds = Math.max(1, Math.floor(char.price / 10000));

              return (
                <div
                  key={char.id}
                  className={`border rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'border-cyan-500/40 bg-neutral-900/90 shadow-md'
                      : isTrialActive
                      ? 'border-pink-500/40 bg-neutral-900/90 shadow-md'
                      : 'border-neutral-850 bg-neutral-950/70 hover:border-neutral-750'
                  }`}
                >
                  {/* Title & Description */}
                  <div>
                    <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center justify-between">
                      <span>{char.name}</span>
                      <span className="text-[9px] text-neutral-500 font-normal">
                        {char.price === 0 ? 'DEFAULT' : `🪙 ${char.price.toLocaleString()}`}
                      </span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {char.description}
                    </p>
                  </div>

                  {/* Actions & Price Row */}
                  <div className="border-t border-neutral-850 pt-2.5 mt-auto flex flex-col gap-1.5">
                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          gameAudio.playCoin();
                          setSelectedCharacter(char.id);
                          setIsTemporaryTrial(false);
                        }}
                        disabled={isEquipped}
                        className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 ${
                          isEquipped
                            ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 cursor-default'
                            : 'bg-neutral-800 hover:bg-cyan-500 hover:text-neutral-950 text-white border border-neutral-700 hover:border-cyan-400 shadow-md'
                        }`}
                      >
                        {isEquipped ? <><Check className="w-3.5 h-3.5" /> EQUIPPED</> : 'EQUIP'}
                      </button>
                    ) : (
                      <>
                        {/* Buy with Coins Button */}
                        <button
                          onClick={() => {
                            if (canAfford) {
                              gameAudio.playBlockHit();
                              const nextWallet = totalCoins - char.price;
                              setTotalCoins(nextWallet);
                              const nextUnlocked = [...unlockedCharacters, char.id];
                              setUnlockedCharacters(nextUnlocked);
                              setSelectedCharacter(char.id);
                              setIsTemporaryTrial(false);
                            } else {
                              gameAudio.playHit();
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all uppercase flex items-center justify-center gap-1 cursor-pointer ${
                            canAfford
                              ? 'bg-yellow-400 hover:bg-yellow-300 text-neutral-950 shadow-md shadow-yellow-500/20'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-60'
                          }`}
                        >
                          BUY 🪙 {char.price.toLocaleString()}
                        </button>

                        {/* Watch Ad to Try */}
                        <button
                          onClick={() => handleWatchAdToTry(char.id)}
                          className="w-full py-1.5 rounded-xl text-[9px] font-bold tracking-wider transition-all uppercase bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border border-pink-500/30 text-pink-400 hover:border-pink-300 hover:text-pink-300 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Play className="w-2.5 h-2.5 fill-pink-400" />
                          WATCH {requiredAds} {requiredAds === 1 ? 'AD' : 'ADS'} TO TRY
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CYBER-POWERUP CONSUMABLES SECTION */}
      {activeTab === 'CONSUMABLES' && (
        <div className="space-y-3 animate-fade-in text-left">
          <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-4">
            <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              CYBER-POWERUP CONSUMABLES & LIFELINES
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">
              Store consumables in your inventory to auto-deploy or manually trigger during high-speed runs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {CONSUMABLES_LIST.map((item) => {
              const count = playerInventory[item.id as keyof typeof playerInventory] || 0;
              const canAfford = totalCoins >= item.price;

              return (
                <div
                  key={item.id}
                  className="relative border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-neutral-950/80 hover:border-neutral-700 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg text-[9px] font-bold text-neutral-300">
                      OWNED: {count}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-white uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed min-h-[32px]">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] text-neutral-500 uppercase">PRICE</span>
                      <span className="font-black text-yellow-400">🪙 {item.price.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (canAfford) {
                          gameAudio.playBlockHit();
                          setTotalCoins((prev) => prev - item.price);
                          setPlayerInventory((prev) => ({
                            ...prev,
                            [item.id]: prev[item.id as keyof typeof playerInventory] + 1,
                          }));
                        } else {
                          gameAudio.playHit();
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-neutral-950 shadow-md shadow-yellow-500/10'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      🛒 BUY ITEM
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. COIN VAULT (EARN COINS VIA REWARDED AD CHAINS) */}
      {activeTab === 'COIN_VAULT' && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="border border-yellow-500/30 bg-neutral-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                CYBER-VAULT: EARN FREE GOLDEN COINS
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1">
                Watch verified sponsor ad transmissions sequentially to earn coins permanently. Chain completion is required to unlock payouts.
              </p>
            </div>
            <div className="bg-yellow-950/40 border border-yellow-500/40 px-3 py-1.5 rounded-xl text-right shrink-0">
              <span className="text-[9px] text-yellow-500/80 font-bold uppercase tracking-wider block">CURRENT VAULT</span>
              <span className="text-sm font-black text-yellow-400">🪙 {totalCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1 */}
            <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-yellow-500/50 transition-all group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-yellow-950/40 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    TIER 1 • QUICK STREAM
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">1 AD</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Standard Broadcast</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Watch 1 single verified sponsor ad to instantly claim standard cyber gold.
                </p>
              </div>

              <div className="border-t border-neutral-900 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase">REWARD PAYOUT</span>
                  <span className="text-base font-black text-yellow-400">🪙 +300 COINS</span>
                </div>
                <button
                  onClick={() => handleEarnCoinsTier(1)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-400 hover:to-amber-500 text-yellow-400 hover:text-neutral-950 border border-yellow-500/40 hover:border-yellow-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  WATCH 1 AD (+300 🪙)
                </button>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="border border-yellow-500/40 bg-neutral-950/90 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden shadow-lg group">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-amber-500 text-neutral-950 font-black text-[8px] uppercase tracking-widest px-3 py-0.5 rounded-bl-lg shadow-sm">
                POPULAR
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-yellow-950/50 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    TIER 2 • DOUBLE CHAIN
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">2 ADS</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Double Pipeline Relay</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Stream 2 consecutive sponsor ads in a sequential chain with +33% bonus yield.
                </p>
              </div>

              <div className="border-t border-neutral-900 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase">REWARD PAYOUT</span>
                  <span className="text-base font-black text-yellow-400">🪙 +800 COINS</span>
                </div>
                <button
                  onClick={() => handleEarnCoinsTier(2)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  WATCH 2 ADS (+800 🪙)
                </button>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="border border-pink-500/40 bg-neutral-950/90 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden shadow-lg group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-pink-950/50 text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    TIER 3 • MEGA NETWORK
                  </span>
                  <span className="text-[10px] text-pink-400 font-bold">3 ADS</span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Mega Network Relay</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Stream 3 consecutive ads in sequence for the highest currency multiplier.
                </p>
              </div>

              <div className="border-t border-neutral-900 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase">REWARD PAYOUT</span>
                  <span className="text-base font-black text-pink-400">🪙 +1,500 COINS</span>
                </div>
                <button
                  onClick={() => handleEarnCoinsTier(3)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  WATCH 3 ADS (+1500 🪙)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Back / Close Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            gameAudio.playCoin();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-mono text-xs font-bold tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
      </div>
    </div>
  );
};
