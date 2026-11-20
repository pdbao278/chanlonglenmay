import Phaser from 'phaser';

/**
 * Generates crisp procedural Đông Hồ Neon sprites on Phaser canvas textures
 * (lantern dragon tail segments, glowing tail tip, cloud energy orbs, poison talismans, spirit wisps, particles).
 */
export function createProceduralTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('seg_lantern')) return;

  // 1. Dragon Lantern Tail Segment (Đốt thân rồng lồng đèn Đông Hồ)
  const makeLantern = (key: string, bodyHex: string, rimHex: string, coreHex: string, size = 64) => {
    const tex = scene.textures.createCanvas(key, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const cx = size / 2;
    const cy = size / 2;

    // Soft outer neon halo
    const halo = ctx.createRadialGradient(cx, cy, size * 0.18, cx, cy, size * 0.48);
    halo.addColorStop(0, rimHex + 'aa');
    halo.addColorStop(1, rimHex + '00');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Dark ink silhouette outline (Đông Hồ woodblock style)
    ctx.fillStyle = '#140c24';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // Rich lantern body
    const bodyGrad = ctx.createRadialGradient(cx - 5, cy - 6, 3, cx, cy, size * 0.31);
    bodyGrad.addColorStop(0, coreHex);
    bodyGrad.addColorStop(0.55, bodyHex);
    bodyGrad.addColorStop(1, '#5a1226');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.29, 0, Math.PI * 2);
    ctx.fill();

    // Lantern golden ribs
    ctx.strokeStyle = rimHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.14, size * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.29, 0, Math.PI * 2);
    ctx.stroke();

    // Center star/cloud jewel
    ctx.fillStyle = '#fff9db';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    tex.refresh();
  };

  makeLantern('seg_lantern', '#E63946', '#FFB703', '#FFE082', 64);
  makeLantern('seg_tip', '#06D6A0', '#FFE66D', '#FFFFFF', 72);
  makeLantern('seg_fever', '#06D6A0', '#FFB703', '#FFFBE6', 78);

  // 1b. Luminous Vietnamese Dragon Head (Rồng Ánh Sáng Đông Hồ Neon — facing East / +X)
  {
    const size = 144;
    const tex = scene.textures.createCanvas('dragon_head', size, size);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 72;
      const cy = 72;

      // Radiant jade-gold aura halo
      const aura = ctx.createRadialGradient(cx + 4, cy, 12, cx, cy, 68);
      aura.addColorStop(0, 'rgba(255, 230, 109, 0.72)');
      aura.addColorStop(0.48, 'rgba(6, 214, 160, 0.42)');
      aura.addColorStop(1, 'rgba(6, 214, 160, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 68, 0, Math.PI * 2);
      ctx.fill();

      // Fiery golden-crimson flowing mane flames behind the head
      const drawManeTuft = (x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number, color: string) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#140c24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.quadraticCurveTo(cpx + 6, y1, x1 + 10, y1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      drawManeTuft(56, 46, 32, 22, 14, 34, '#E63946');
      drawManeTuft(56, 98, 32, 122, 14, 110, '#E63946');
      drawManeTuft(52, 56, 24, 42, 10, 56, '#FFB703');
      drawManeTuft(52, 88, 24, 102, 10, 88, '#FFB703');
      drawManeTuft(50, 72, 24, 68, 12, 72, '#FFE66D');

      // Twin sweeping golden Vietnamese Dragon antlers/horns
      const drawHorn = (sign: number) => {
        ctx.save();
        ctx.fillStyle = '#FFE66D';
        ctx.strokeStyle = '#140c24';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(64, cy + sign * 16);
        ctx.bezierCurveTo(46, cy + sign * 30, 30, cy + sign * 44, 18, cy + sign * 36);
        ctx.quadraticCurveTo(30, cy + sign * 30, 38, cy + sign * 24);
        ctx.lineTo(28, cy + sign * 19);
        ctx.quadraticCurveTo(44, cy + sign * 16, 62, cy + sign * 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      drawHorn(-1);
      drawHorn(1);

      // Bold dark ink silhouette of dragon skull & snout
      ctx.fillStyle = '#140c24';
      ctx.beginPath();
      ctx.moveTo(126, cy);
      ctx.bezierCurveTo(124, cy - 16, 104, cy - 22, 86, cy - 25);
      ctx.bezierCurveTo(72, cy - 30, 54, cy - 28, 44, cy - 16);
      ctx.lineTo(44, cy + 16);
      ctx.bezierCurveTo(54, cy + 28, 72, cy + 30, 86, cy + 25);
      ctx.bezierCurveTo(104, cy + 22, 124, cy + 16, 126, cy);
      ctx.closePath();
      ctx.fill();

      // Main luminous emerald-jade head gradient
      const headGrad = ctx.createLinearGradient(46, cy, 124, cy);
      headGrad.addColorStop(0, '#048A81');
      headGrad.addColorStop(0.45, '#06D6A0');
      headGrad.addColorStop(0.85, '#64F5C8');
      headGrad.addColorStop(1, '#FFE66D');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.moveTo(121, cy);
      ctx.bezierCurveTo(118, cy - 12, 100, cy - 17, 84, cy - 20);
      ctx.bezierCurveTo(71, cy - 24, 56, cy - 22, 49, cy - 12);
      ctx.lineTo(49, cy + 12);
      ctx.bezierCurveTo(56, cy + 22, 71, cy + 24, 84, cy + 20);
      ctx.bezierCurveTo(100, cy + 17, 118, cy + 12, 121, cy);
      ctx.closePath();
      ctx.fill();

      // Golden snout ridge & cheek crest plates
      ctx.fillStyle = '#FFB703';
      ctx.strokeStyle = '#140c24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(118, cy);
      ctx.lineTo(94, cy - 6);
      ctx.lineTo(66, cy - 5);
      ctx.lineTo(60, cy);
      ctx.lineTo(66, cy + 5);
      ctx.lineTo(94, cy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sacred forehead Dragon Pearl (Ngọc Rồng)
      ctx.fillStyle = '#FFF9DB';
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(74, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fierce glowing amber-gold eyes
      const drawEye = (sign: number) => {
        ctx.fillStyle = '#140c24';
        ctx.beginPath();
        ctx.ellipse(88, cy + sign * 12, 8.5, 5.5, sign * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.ellipse(89, cy + sign * 12, 6, 3.6, sign * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E63946';
        ctx.beginPath();
        ctx.arc(91, cy + sign * 12, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(92.2, cy + sign * 11, 1.1, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(-1);
      drawEye(1);

      // Snout nostrils
      ctx.fillStyle = '#140c24';
      ctx.beginPath();
      ctx.arc(111, cy - 4.5, 2.2, 0, Math.PI * 2);
      ctx.arc(111, cy + 4.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping golden whiskers starting from snout sides
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(112, cy - 10);
      ctx.quadraticCurveTo(106, cy - 32, 82, cy - 42);
      ctx.moveTo(112, cy + 10);
      ctx.quadraticCurveTo(106, cy + 32, 82, cy + 42);
      ctx.stroke();

      tex.refresh();
    }
  }

  // 1c. Scaled Luminous Dragon Body Segment (Thân Rồng vảy ngọc — facing East / +X)
  {
    const size = 84;
    const tex = scene.textures.createCanvas('dragon_body_seg', size, size);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 42;
      const cy = 42;

      const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 40);
      glow.addColorStop(0, 'rgba(6, 214, 160, 0.72)');
      glow.addColorStop(0.65, 'rgba(255, 183, 3, 0.28)');
      glow.addColorStop(1, 'rgba(6, 214, 160, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      // Small lateral golden cloud fins
      ctx.fillStyle = '#FFB703';
      ctx.strokeStyle = '#140c24';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(46, cy - 18);
      ctx.quadraticCurveTo(34, cy - 34, 20, cy - 26);
      ctx.quadraticCurveTo(30, cy - 20, 32, cy - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(46, cy + 18);
      ctx.quadraticCurveTo(34, cy + 34, 20, cy + 26);
      ctx.quadraticCurveTo(30, cy + 20, 32, cy + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dark woodblock outline oval body
      ctx.fillStyle = '#140c24';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 27, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Emerald-jade scale body
      const bodyGrad = ctx.createRadialGradient(cx + 4, cy, 3, cx, cy, 25);
      bodyGrad.addColorStop(0, '#9BFFDF');
      bodyGrad.addColorStop(0.5, '#06D6A0');
      bodyGrad.addColorStop(1, '#04726A');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 23, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Overlapping golden dragon scale chevrons
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx + 7, cy, 12, Math.PI * 0.65, Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 2, cy, 13, Math.PI * 0.65, Math.PI * 1.35);
      ctx.stroke();

      // Center luminous golden dorsal spine ridge
      ctx.fillStyle = '#FFE66D';
      ctx.strokeStyle = '#140c24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + 15, cy);
      ctx.lineTo(cx, cy - 5.5);
      ctx.lineTo(cx - 16, cy);
      ctx.lineTo(cx, cy + 5.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      tex.refresh();
    }
  }

  // 1d. Flaming Luminous Dragon Tail Tip (Đuôi Rồng Lửa Ngọc — facing East / +X)
  {
    const size = 96;
    const tex = scene.textures.createCanvas('dragon_tail_tip', size, size);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 48;
      const cy = 48;

      const glow = ctx.createRadialGradient(cx - 6, cy, 6, cx, cy, 44);
      glow.addColorStop(0, 'rgba(255, 230, 109, 0.85)');
      glow.addColorStop(0.55, 'rgba(230, 57, 70, 0.35)');
      glow.addColorStop(1, 'rgba(6, 214, 160, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 44, 0, Math.PI * 2);
      ctx.fill();

      // Flaming forked golden-crimson tail plume sweeping backward (-X)
      ctx.fillStyle = '#E63946';
      ctx.strokeStyle = '#140c24';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(58, cy);
      ctx.quadraticCurveTo(36, cy - 26, 8, cy - 18);
      ctx.quadraticCurveTo(22, cy - 6, 12, cy);
      ctx.quadraticCurveTo(22, cy + 6, 8, cy + 18);
      ctx.quadraticCurveTo(36, cy + 26, 58, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner bright golden flame core
      ctx.fillStyle = '#FFE66D';
      ctx.beginPath();
      ctx.moveTo(54, cy);
      ctx.quadraticCurveTo(36, cy - 13, 18, cy - 9);
      ctx.quadraticCurveTo(28, cy, 18, cy + 9);
      ctx.quadraticCurveTo(36, cy + 13, 54, cy);
      ctx.closePath();
      ctx.fill();

      // Scaled emerald tail base connecting to body (+X side)
      ctx.fillStyle = '#06D6A0';
      ctx.strokeStyle = '#140c24';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(58, cy, 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF9DB';
      ctx.beginPath();
      ctx.arc(58, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      tex.refresh();
    }
  }

  // 2. Cloud Energy Orb (Hạt Mây Năng Lượng)
  {
    const tex = scene.textures.createCanvas('cloud_orb', 56, 56);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 28;
      const cy = 28;
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 26);
      glow.addColorStop(0, 'rgba(6, 214, 160, 0.95)');
      glow.addColorStop(0.5, 'rgba(155, 93, 229, 0.45)');
      glow.addColorStop(1, 'rgba(6, 214, 160, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Stylized Vietnamese cloud puff (đám mây ngũ sắc)
      ctx.fillStyle = '#120e1f';
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 2, 10, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy + 2, 10, 0, Math.PI * 2);
      ctx.arc(cx, cy - 4, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E0FBF4';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 2, 7.5, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 2, 7.5, 0, Math.PI * 2);
      ctx.arc(cx, cy - 3.5, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#06D6A0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.stroke();

      tex.refresh();
    }
  }

  // 2b. Tail Segment Restore Item (Lồng Đèn Hồi Khúc — spawns every 10s)
  {
    const tex = scene.textures.createCanvas('heal_lantern', 64, 64);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 32;
      const cy = 32;

      // Warm jade-gold healing aura
      const aura = ctx.createRadialGradient(cx, cy, 6, cx, cy, 30);
      aura.addColorStop(0, 'rgba(255, 230, 109, 0.95)');
      aura.addColorStop(0.5, 'rgba(255, 92, 138, 0.55)');
      aura.addColorStop(1, 'rgba(6, 214, 160, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();

      // Dark woodblock outer ring
      ctx.fillStyle = '#140c24';
      ctx.beginPath();
      ctx.arc(cx, cy, 19, 0, Math.PI * 2);
      ctx.fill();

      // Golden lotus-crimson lantern body
      const body = ctx.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, 17);
      body.addColorStop(0, '#FFF5B8');
      body.addColorStop(0.5, '#FF4D6D');
      body.addColorStop(1, '#9E1946');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();

      // Crisp golden rim
      ctx.strokeStyle = '#FFE66D';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Bright jade-white "+" restore emblem in center
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 3, cy - 9, 6, 18);
      ctx.fillRect(cx - 9, cy - 3, 18, 6);
      ctx.strokeStyle = '#06D6A0';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx - 3, cy - 9, 6, 18);
      ctx.strokeRect(cx - 9, cy - 3, 18, 6);

      tex.refresh();
    }
  }

  // 3. Cursed Talisman Paper (Bùa Độc Thầy Thuốc)
  {
    const tex = scene.textures.createCanvas('talisman_paper', 44, 56);
    if (tex) {
      const ctx = tex.getContext();
      ctx.fillStyle = '#1a0b2e';
      ctx.fillRect(6, 4, 32, 48);
      ctx.fillStyle = '#FFB703';
      ctx.fillRect(9, 7, 26, 42);
      ctx.strokeStyle = '#D90429';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(12, 10, 20, 36);
      // Mystic rune strokes
      ctx.beginPath();
      ctx.moveTo(22, 14);
      ctx.lineTo(22, 41);
      ctx.moveTo(15, 20);
      ctx.lineTo(29, 20);
      ctx.moveTo(16, 28);
      ctx.lineTo(28, 34);
      ctx.moveTo(28, 28);
      ctx.lineTo(16, 34);
      ctx.stroke();
      tex.refresh();
    }
  }

  // 4. Orbiting Spirit Wisp (Ma Trơi / Bùa Đuổi Wave 2-3)
  {
    const tex = scene.textures.createCanvas('spirit_wisp', 48, 48);
    if (tex) {
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(24, 24, 3, 24, 24, 22);
      grad.addColorStop(0, '#FFF59D');
      grad.addColorStop(0.35, '#9B5DE5');
      grad.addColorStop(0.75, 'rgba(230, 57, 70, 0.5)');
      grad.addColorStop(1, 'rgba(155, 93, 229, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#180929';
      ctx.beginPath();
      ctx.arc(24, 24, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38F9D7';
      ctx.beginPath();
      ctx.arc(20.5, 23, 2.3, 0, Math.PI * 2);
      ctx.arc(27.5, 23, 2.3, 0, Math.PI * 2);
      ctx.fill();

      tex.refresh();
    }
  }

  // 5. Pre-baked colored soft glow particle dots (zero runtime Canvas tint overhead in Phaser 4)
  const makeGlowDot = (key: string, rgbaInner: string, rgbaMid: string, rgbaOuter: string) => {
    const tex = scene.textures.createCanvas(key, 24, 24);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(12, 12, 1, 12, 12, 12);
    grad.addColorStop(0, rgbaInner);
    grad.addColorStop(0.45, rgbaMid);
    grad.addColorStop(1, rgbaOuter);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 24, 24);
    tex.refresh();
  };

  makeGlowDot('glow_gold', 'rgba(255, 251, 224, 1)', 'rgba(255, 183, 3, 0.72)', 'rgba(255, 183, 3, 0)');
  makeGlowDot('glow_jade', 'rgba(224, 255, 246, 1)', 'rgba(6, 214, 160, 0.75)', 'rgba(6, 214, 160, 0)');
  makeGlowDot('glow_red', 'rgba(255, 232, 235, 1)', 'rgba(230, 57, 70, 0.78)', 'rgba(230, 57, 70, 0)');
  makeGlowDot('glow_purple', 'rgba(243, 232, 255, 1)', 'rgba(155, 93, 229, 0.78)', 'rgba(155, 93, 229, 0)');
  makeGlowDot('glow_white', 'rgba(255, 255, 255, 1)', 'rgba(255, 248, 220, 0.65)', 'rgba(255, 255, 255, 0)');
}
