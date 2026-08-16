/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NeonMenuBackground - Ultra-lightweight 60FPS 2D Canvas Cyberpunk Synthwave Background
 * Renders shifting laser rays, dynamic perspective grid waves, and multi-color neon cycling.
 * ZERO React state traps: Runs 100% on native requestAnimationFrame with 0 re-renders.
 */

import React, { useEffect, useRef } from 'react';

export const NeonMenuBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Cyberpunk color stops: Cyan, Hot Pink, Electric Green, Violet, Neon Yellow
    const colorPalette = [
      { r: 0, g: 240, b: 255 },    // Neon Cyan
      { r: 255, g: 0, b: 128 },    // Hot Pink
      { r: 57, g: 255, b: 20 },    // Electric Green
      { r: 157, g: 0, b: 255 },    // Bright Violet
      { r: 255, g: 230, b: 0 },    // Neon Yellow
    ];

    // Neon dust particle pool
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      size: 1 + Math.random() * 2.5,
      colorIndex: Math.floor(Math.random() * colorPalette.length),
      alpha: 0.2 + Math.random() * 0.6,
    }));

    // Laser rays
    const laserCount = 5;
    const lasers = Array.from({ length: laserCount }, (_, i) => ({
      progress: (i / laserCount),
      speed: 0.0012 + Math.random() * 0.0015,
      angle: (Math.PI / 6) + (Math.random() - 0.5) * 0.2,
      thickness: 1.5 + Math.random() * 2,
      colorIndex: i % colorPalette.length,
    }));

    let startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001; // seconds

      // 1. Dark Cyberpunk base clear
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, width, height);

      // 2. Horizon glow gradient
      const horizonY = height * 0.58;
      const paletteIdx = Math.floor(elapsed * 0.15) % colorPalette.length;
      const nextPaletteIdx = (paletteIdx + 1) % colorPalette.length;
      const colorLerp = (elapsed * 0.15) % 1;

      const curCol = colorPalette[paletteIdx];
      const nextCol = colorPalette[nextPaletteIdx];
      const r = Math.round(curCol.r + (nextCol.r - curCol.r) * colorLerp);
      const g = Math.round(curCol.g + (nextCol.g - curCol.g) * colorLerp);
      const b = Math.round(curCol.b + (nextCol.b - curCol.b) * colorLerp);

      const radialGrad = ctx.createRadialGradient(
        width * 0.5,
        horizonY,
        10,
        width * 0.5,
        horizonY,
        width * 0.65
      );
      radialGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.22)`);
      radialGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.06)`);
      radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Perspective Cyber Grid Wave on bottom half
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, width, height - horizonY);
      ctx.clip();

      const gridOffset = (elapsed * 45) % 30;
      const gridCols = 20;

      // Perspective vertical lines converging at horizon center
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.18)`;
      ctx.lineWidth = 1;

      const vanishX = width * 0.5;
      const vanishY = horizonY;

      for (let c = -gridCols; c <= gridCols; c++) {
        const bottomX = vanishX + c * (width / (gridCols * 0.8));
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal lines with exponential perspective compression
      for (let i = 0; i < 14; i++) {
        const p = Math.pow((i + gridOffset / 30) / 14, 2.2);
        const y = horizonY + p * (height - horizonY);
        const alpha = Math.min(0.28, p * 0.35);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Moving diagonal neon laser beams
      lasers.forEach((laser) => {
        laser.progress = (laser.progress + laser.speed) % 1;
        const col = colorPalette[laser.colorIndex];
        const beamY = laser.progress * height * 1.3 - height * 0.15;
        const beamX = width * 0.5 + Math.tan(laser.angle) * (beamY - height * 0.5);

        ctx.save();
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.25)`;
        ctx.lineWidth = laser.thickness;
        ctx.shadowColor = `rgba(${col.r}, ${col.g}, ${col.b}, 0.8)`;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(beamX - width * 0.6, beamY - height * 0.3);
        ctx.lineTo(beamX + width * 0.6, beamY + height * 0.3);
        ctx.stroke();
        ctx.restore();
      });

      // 5. Floating neon dust motes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const col = colorPalette[p.colorIndex];
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${col.r}, ${col.g}, ${col.b}, 0.9)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    // Clean, passive resize handler
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="neon-menu-canvas"
      className="absolute inset-0 z-0 pointer-events-none opacity-45 transition-opacity duration-700"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
};

export default NeonMenuBackground;
