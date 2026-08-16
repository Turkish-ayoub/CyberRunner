/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cyber Runner - High Fidelity Procedural Textures
 * Creates dynamic textures for Neon Barriers, Data Cubes, Cyber Bricks, and Golden Coins.
 */

import { CanvasTexture, RepeatWrapping } from 'three';

// Create a high-quality procedural cyber brick/composite texture
export function createBrickTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Fill with dark carbon composite base
  ctx.fillStyle = '#0f1016';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const rowHeight = 512 / rows;
  const colWidth = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const offset = (r % 2) * (colWidth / 2);

    for (let c = -1; c <= cols; c++) {
      const x = c * colWidth + offset;
      const w = colWidth - 4;
      const h = rowHeight - 4;

      // Dark metallic plate gradient
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#242838');
      grad.addColorStop(0.5, '#161924');
      grad.addColorStop(1, '#0c0d14');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y + 2, w, h);

      // Subtle cyan seam highlight
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, w - 2, h - 2);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// Procedural texture for the High-Voltage Neon Barrier
export function createNeonBarrierTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = '#05181b';
  ctx.fillRect(0, 0, 256, 256);

  // High-contrast glowing neon cyber cylinder
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#02181a');
  grad.addColorStop(0.2, '#0891b2');
  grad.addColorStop(0.4, '#06b6d4');
  grad.addColorStop(0.5, '#a5f3fc');
  grad.addColorStop(0.65, '#0891b2');
  grad.addColorStop(1, '#02181a');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Glowing laser rings
  ctx.fillStyle = 'rgba(236, 72, 153, 0.7)';
  ctx.fillRect(0, 50, 256, 6);
  ctx.fillRect(0, 190, 256, 6);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 52, 256, 2);
  ctx.fillRect(0, 192, 256, 2);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

// Alias for backwards compatibility
export const createPipeTexture = createNeonBarrierTexture;

// Procedural texture for the Holographic Data Cube
export function createDataCubeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Vibrant neon gradient
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 180);
  grad.addColorStop(0, '#06b6d4');
  grad.addColorStop(0.7, '#0891b2');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Cyber bevel border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#22d3ee';
  ctx.strokeRect(7, 7, 242, 242);

  // Inner neon circuit line
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f472b6';
  ctx.strokeRect(20, 20, 216, 216);

  // Corner microchips
  ctx.fillStyle = '#facc15';
  const chipSize = 12;
  ctx.fillRect(26, 26, chipSize, chipSize);
  ctx.fillRect(218, 26, chipSize, chipSize);
  ctx.fillRect(26, 218, chipSize, chipSize);
  ctx.fillRect(218, 218, chipSize, chipSize);

  // Central Hologram Icon: Diamond Data Node
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(128, 60);
  ctx.lineTo(190, 128);
  ctx.lineTo(128, 196);
  ctx.lineTo(66, 128);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(128, 128, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(128, 128, 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  return texture;
}

// Alias for backwards compatibility
export const createQuestionBlockTexture = createDataCubeTexture;

// Procedural Gold Coin glowing texture
export function createCoinTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Radial gold shine
  const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, '#fff49b');
  grad.addColorStop(0.3, '#ffcc00');
  grad.addColorStop(0.7, '#d19000');
  grad.addColorStop(1, '#664200');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  // Outer ring border
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffa600';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring detail
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff576';
  ctx.beginPath();
  ctx.arc(64, 64, 34, 0, Math.PI * 2);
  ctx.stroke();

  // Shine sparkle dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(42, 42, 8, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  return texture;
}
