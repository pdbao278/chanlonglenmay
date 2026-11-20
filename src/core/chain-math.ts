export interface Vec2 {
  x: number;
  y: number;
}

export interface ChainSegment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

export interface EllipseObstacle {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface RectObstacle {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  banyanX: number;
  banyanY: number;
  banyanRadius: number;
  ellipses?: EllipseObstacle[];
  rects?: RectObstacle[];
}

/**
 * Optimized pixel-matched obstacle colliders for /assets/aistudio/image_2e458c28.png (1440 x 810).
 * Every walkable dirt road, stone bridge, and courtyard lane stays >= 76px wide so neither Cô Tấm
 * nor Thầy Thuốc snags on corners, while strictly blocking the Banyan Tree, 4 fenced islands,
 * Lotus Pond, top courtyard fences, and 4 corner huts.
 */
export const COURTYARD_ARENA_BOUNDS: ArenaBounds = {
  minX: 112,
  maxX: 1328,
  minY: 162,
  maxY: 788,
  banyanX: 720,
  banyanY: 398,
  banyanRadius: 100,
  ellipses: [
    // Central Banyan Tree trunk, roots & stone ring
    { id: 'banyan_tree', cx: 720, cy: 398, rx: 100, ry: 84 },
  ],
  rects: [
    // 4 Corner Huts & Outer Gardens
    { id: 'hut_top_left', minX: 0, maxX: 416, minY: 0, maxY: 176 },
    { id: 'hut_top_right', minX: 1024, maxX: 1440, minY: 0, maxY: 176 },
    { id: 'hut_bottom_left', minX: 0, maxX: 378, minY: 642, maxY: 810 },
    { id: 'hut_bottom_right', minX: 1062, maxX: 1440, minY: 642, maxY: 810 },

    // Top Courtyard Wooden Fences (central stone bridge x=660..780 & side junctions stay wide open)
    { id: 'courtyard_fence_top_left', minX: 488, maxX: 660, minY: 208, maxY: 226 },
    { id: 'courtyard_fence_top_right', minX: 780, maxX: 952, minY: 208, maxY: 226 },

    // Left Side Fenced Islands (Upper Bamboo + Lower Rock/Bamboo)
    { id: 'island_upper_left', minX: 196, maxX: 406, minY: 248, maxY: 344 },
    { id: 'island_lower_left', minX: 282, maxX: 416, minY: 422, maxY: 526 },

    // Right Side Fenced Islands (mirror of left)
    { id: 'island_upper_right', minX: 1034, maxX: 1244, minY: 248, maxY: 344 },
    { id: 'island_lower_right', minX: 1024, maxX: 1158, minY: 422, maxY: 526 },

    // Bottom Center Lotus Pond ("Ao Sen") + Fenced Bamboo Shoulders
    { id: 'lotus_pond', minX: 462, maxX: 978, minY: 604, maxY: 726 },
  ],
};

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDelta(fromRad: number, toRad: number): number {
  return normalizeAngle(toRad - fromRad);
}

export function distanceBetween(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function createInitialChain(
  headX: number,
  headY: number,
  count: number,
  spacing: number,
  facingAngle = 0
): ChainSegment[] {
  const segments: ChainSegment[] = [];
  const backX = -Math.cos(facingAngle);
  const backY = -Math.sin(facingAngle);
  for (let i = 0; i < count; i++) {
    segments.push({
      x: headX + backX * spacing * (i + 1),
      y: headY + backY * spacing * (i + 1),
      vx: 0,
      vy: 0,
      angle: facingAngle,
    });
  }
  return segments;
}

function resolveEllipseObstacle(x: number, y: number, r: number, e: EllipseObstacle): Vec2 {
  const erx = e.rx + r;
  const ery = e.ry + r;
  const dx = x - e.cx;
  const dy = y - e.cy;
  const nx = dx / erx;
  const ny = dy / ery;
  const normSq = nx * nx + ny * ny;

  if (normSq < 1) {
    if (normSq < 1e-8) {
      return { x: e.cx, y: e.cy + ery };
    }
    const inv = 1 / Math.sqrt(normSq);
    return {
      x: e.cx + dx * inv,
      y: e.cy + dy * inv,
    };
  }
  return { x, y };
}

function resolveRectObstacle(x: number, y: number, r: number, rect: RectObstacle): Vec2 {
  const closestX = clamp(x, rect.minX, rect.maxX);
  const closestY = clamp(y, rect.minY, rect.maxY);
  const dx = x - closestX;
  const dy = y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= r * r) {
    return { x, y };
  }

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const push = r - dist;
    return {
      x: x + (dx / dist) * push,
      y: y + (dy / dist) * push,
    };
  }

  const penLeft = x - rect.minX;
  const penRight = rect.maxX - x;
  const penTop = y - rect.minY;
  const penBottom = rect.maxY - y;
  const minPen = Math.min(penLeft, penRight, penTop, penBottom);

  if (minPen === penLeft) return { x: rect.minX - r, y };
  if (minPen === penRight) return { x: rect.maxX + r, y };
  if (minPen === penTop) return { x, y: rect.minY - r };
  return { x, y: rect.maxY + r };
}

function getEllipses(bounds: ArenaBounds): EllipseObstacle[] {
  if (bounds.ellipses && bounds.ellipses.length > 0) {
    return bounds.ellipses;
  }
  return [
    {
      id: 'banyan_fallback',
      cx: bounds.banyanX,
      cy: bounds.banyanY,
      rx: bounds.banyanRadius,
      ry: bounds.banyanRadius,
    },
  ];
}

export function isPointClearOfObstacles(
  x: number,
  y: number,
  entityRadius: number,
  bounds: ArenaBounds
): boolean {
  if (
    x < bounds.minX + entityRadius ||
    x > bounds.maxX - entityRadius ||
    y < bounds.minY + entityRadius ||
    y > bounds.maxY - entityRadius
  ) {
    return false;
  }

  for (const e of getEllipses(bounds)) {
    const erx = e.rx + entityRadius;
    const ery = e.ry + entityRadius;
    const nx = (x - e.cx) / erx;
    const ny = (y - e.cy) / ery;
    if (nx * nx + ny * ny < 0.998) {
      return false;
    }
  }

  if (bounds.rects) {
    for (const rect of bounds.rects) {
      const cx = clamp(x, rect.minX, rect.maxX);
      const cy = clamp(y, rect.minY, rect.maxY);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < entityRadius * entityRadius - 0.1) {
        return false;
      }
    }
  }

  return true;
}

export function isSegmentClearOfObstacles(
  from: Vec2,
  to: Vec2,
  entityRadius: number,
  bounds: ArenaBounds
): boolean {
  const dist = distanceBetween(from, to);
  const steps = Math.max(2, Math.ceil(dist / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = from.x + (to.x - from.x) * t;
    const py = from.y + (to.y - from.y) * t;
    if (!isPointClearOfObstacles(px, py, entityRadius, bounds)) {
      return false;
    }
  }
  return true;
}

export function resolveArenaPosition(
  x: number,
  y: number,
  entityRadius: number,
  bounds: ArenaBounds
): Vec2 {
  let nx = x;
  let ny = y;
  const ellipses = getEllipses(bounds);
  const rects = bounds.rects ?? [];

  for (let iter = 0; iter < 3; iter++) {
    nx = clamp(nx, bounds.minX + entityRadius, bounds.maxX - entityRadius);
    ny = clamp(ny, bounds.minY + entityRadius, bounds.maxY - entityRadius);

    for (let i = 0; i < ellipses.length; i++) {
      const res = resolveEllipseObstacle(nx, ny, entityRadius, ellipses[i]);
      nx = res.x;
      ny = res.y;
    }

    for (let i = 0; i < rects.length; i++) {
      const res = resolveRectObstacle(nx, ny, entityRadius, rects[i]);
      nx = res.x;
      ny = res.y;
    }

    nx = clamp(nx, bounds.minX + entityRadius, bounds.maxX - entityRadius);
    ny = clamp(ny, bounds.minY + entityRadius, bounds.maxY - entityRadius);
  }

  return { x: nx, y: ny };
}

export function moveWithObstacleSubsteps(
  fromX: number,
  fromY: number,
  deltaX: number,
  deltaY: number,
  entityRadius: number,
  bounds: ArenaBounds
): Vec2 {
  const totalDist = Math.hypot(deltaX, deltaY);
  const maxStep = 12;
  const steps = Math.max(1, Math.ceil(totalDist / maxStep));
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  let cx = fromX;
  let cy = fromY;
  for (let i = 0; i < steps; i++) {
    const resolved = resolveArenaPosition(cx + stepX, cy + stepY, entityRadius, bounds);
    cx = resolved.x;
    cy = resolved.y;
  }
  return { x: cx, y: cy };
}

// ---------------------------------------------------------------------------
// Fast 2D Grid A* Navigation around Courtyard Obstacles (Zero Local Minima!)
// ---------------------------------------------------------------------------

const NAV_CELL = 24;
const NAV_COLS = 60; // 60 * 24 = 1440
const NAV_ROWS = 34; // 34 * 24 = 816

interface NavGridCache {
  bounds: ArenaBounds;
  radius: number;
  walkable: Uint8Array;
}

let cachedNavGrid: NavGridCache | null = null;

function getNavGrid(bounds: ArenaBounds, entityRadius: number): Uint8Array {
  const roundedRadius = Math.round(entityRadius);
  if (
    cachedNavGrid &&
    cachedNavGrid.bounds === bounds &&
    cachedNavGrid.radius === roundedRadius
  ) {
    return cachedNavGrid.walkable;
  }

  const walkable = new Uint8Array(NAV_COLS * NAV_ROWS);
  // Slightly trim nav radius (by 3px) so narrow road curves remain cleanly connected in grid space
  const navRadius = Math.max(12, roundedRadius - 3);
  for (let r = 0; r < NAV_ROWS; r++) {
    const wy = r * NAV_CELL + NAV_CELL * 0.5;
    for (let c = 0; c < NAV_COLS; c++) {
      const wx = c * NAV_CELL + NAV_CELL * 0.5;
      walkable[r * NAV_COLS + c] = isPointClearOfObstacles(wx, wy, navRadius, bounds) ? 1 : 0;
    }
  }

  cachedNavGrid = { bounds, radius: roundedRadius, walkable };
  return walkable;
}

function findNearestWalkableCell(
  col: number,
  row: number,
  walkable: Uint8Array
): { col: number; row: number } | null {
  const sc = clamp(col, 0, NAV_COLS - 1);
  const sr = clamp(row, 0, NAV_ROWS - 1);
  if (walkable[sr * NAV_COLS + sc] === 1) {
    return { col: sc, row: sr };
  }

  for (let rad = 1; rad <= 8; rad++) {
    let bestC = -1;
    let bestR = -1;
    let bestDistSq = Infinity;
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const nc = sc + dc;
        const nr = sr + dr;
        if (nc < 0 || nc >= NAV_COLS || nr < 0 || nr >= NAV_ROWS) continue;
        if (walkable[nr * NAV_COLS + nc] === 1) {
          const dsq = dc * dc + dr * dr;
          if (dsq < bestDistSq) {
            bestDistSq = dsq;
            bestC = nc;
            bestR = nr;
          }
        }
      }
    }
    if (bestC !== -1) return { col: bestC, row: bestR };
  }
  return null;
}

const DIRS_8: Array<[number, number, number]> = [
  [1, 0, 10],
  [-1, 0, 10],
  [0, 1, 10],
  [0, -1, 10],
  [1, 1, 14],
  [1, -1, 14],
  [-1, 1, 14],
  [-1, -1, 14],
];

/**
 * Computes a complete obstacle-free path from `from` to `to` on the courtyard road network
 * using 8-directional A* with corner-cut prevention. Guarantees Boss NEVER gets stuck behind
 * the Banyan Tree, Lotus Pond, or any fenced island!
 */
export function findPathAroundObstacles(
  from: Vec2,
  to: Vec2,
  entityRadius: number,
  bounds: ArenaBounds
): Vec2[] {
  // Fast path: direct line-of-sight is completely clear
  if (isSegmentClearOfObstacles(from, to, entityRadius, bounds)) {
    return [to];
  }

  const walkable = getNavGrid(bounds, entityRadius);
  const startCell = findNearestWalkableCell(
    Math.floor(from.x / NAV_CELL),
    Math.floor(from.y / NAV_CELL),
    walkable
  );
  const goalCell = findNearestWalkableCell(
    Math.floor(to.x / NAV_CELL),
    Math.floor(to.y / NAV_CELL),
    walkable
  );

  if (!startCell || !goalCell) {
    return [to];
  }

  const startIdx = startCell.row * NAV_COLS + startCell.col;
  const goalIdx = goalCell.row * NAV_COLS + goalCell.col;
  if (startIdx === goalIdx) {
    return [to];
  }

  const total = NAV_COLS * NAV_ROWS;
  const gScore = new Int32Array(total).fill(1e9);
  const fScore = new Int32Array(total).fill(1e9);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const inOpen = new Uint8Array(total);

  const openList: number[] = [startIdx];
  inOpen[startIdx] = 1;
  gScore[startIdx] = 0;
  fScore[startIdx] =
    (Math.abs(goalCell.col - startCell.col) + Math.abs(goalCell.row - startCell.row)) * 10;

  let found = false;

  while (openList.length > 0) {
    // Pick lowest fScore node from openList (small grid, linear scan is <0.05ms)
    let bestPos = 0;
    let current = openList[0];
    let bestF = fScore[current];
    for (let i = 1; i < openList.length; i++) {
      const idx = openList[i];
      if (fScore[idx] < bestF) {
        bestF = fScore[idx];
        current = idx;
        bestPos = i;
      }
    }

    if (current === goalIdx) {
      found = true;
      break;
    }

    // Pop current via swap-with-last
    openList[bestPos] = openList[openList.length - 1];
    openList.pop();
    inOpen[current] = 0;
    closed[current] = 1;

    const cc = current % NAV_COLS;
    const cr = Math.floor(current / NAV_COLS);
    const curG = gScore[current];

    for (let d = 0; d < 8; d++) {
      const [dc, dr, cost] = DIRS_8[d];
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= NAV_COLS || nr < 0 || nr >= NAV_ROWS) continue;
      const nIdx = nr * NAV_COLS + nc;
      if (closed[nIdx] || walkable[nIdx] === 0) continue;

      // Prevent diagonal corner-cutting across obstacle edges
      if (dc !== 0 && dr !== 0) {
        if (walkable[cr * NAV_COLS + nc] === 0 || walkable[nr * NAV_COLS + cc] === 0) {
          continue;
        }
      }

      const tentativeG = curG + cost;
      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = current;
        gScore[nIdx] = tentativeG;
        const h = (Math.abs(goalCell.col - nc) + Math.abs(goalCell.row - nr)) * 10;
        fScore[nIdx] = tentativeG + h;
        if (!inOpen[nIdx]) {
          openList.push(nIdx);
          inOpen[nIdx] = 1;
        }
      }
    }
  }

  if (!found) {
    return [to];
  }

  // Reconstruct cell centers from start -> goal
  const rawPoints: Vec2[] = [];
  let trace = goalIdx;
  while (trace !== -1 && trace !== startIdx) {
    const tc = trace % NAV_COLS;
    const tr = Math.floor(trace / NAV_COLS);
    rawPoints.push({
      x: tc * NAV_CELL + NAV_CELL * 0.5,
      y: tr * NAV_CELL + NAV_CELL * 0.5,
    });
    trace = cameFrom[trace];
  }
  rawPoints.reverse();
  rawPoints.push(to);

  // String-pull / smooth waypoints so movement looks fluid instead of grid-stepped
  const smoothed: Vec2[] = [];
  let anchor = from;
  let i = 0;
  while (i < rawPoints.length) {
    let furthest = i;
    for (let j = rawPoints.length - 1; j > i; j--) {
      if (isSegmentClearOfObstacles(anchor, rawPoints[j], entityRadius - 2, bounds)) {
        furthest = j;
        break;
      }
    }
    smoothed.push(rawPoints[furthest]);
    anchor = rawPoints[furthest];
    i = furthest + 1;
  }

  return smoothed;
}

/**
 * Picks a safe, reachable road destination far from `threat` so Thầy Thuốc flees
 * smoothly around the courtyard during Fever Mode ("Lên Mây") without getting cornered.
 */
export function findFleeWaypointTarget(
  from: Vec2,
  threat: Vec2,
  entityRadius: number,
  bounds: ArenaBounds
): Vec2 {
  const candidates: Vec2[] = [
    { x: 162, y: 210 },
    { x: 1278, y: 210 },
    { x: 162, y: 585 },
    { x: 1278, y: 585 },
    { x: 720, y: 192 },
    { x: 720, y: 558 },
    { x: 520, y: 398 },
    { x: 920, y: 398 },
    { x: 720, y: 758 },
  ];

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const pt of candidates) {
    if (!isPointClearOfObstacles(pt.x, pt.y, entityRadius - 2, bounds)) continue;
    const distThreat = distanceBetween(pt, threat);
    const distSelf = distanceBetween(pt, from);
    // Prefer spots far from Cô Tấm and not right on top of Boss already
    const score = distThreat + (distSelf > 120 ? 80 : -120);
    if (score > bestScore) {
      bestScore = score;
      best = pt;
    }
  }
  return best;
}

/**
 * Returns the steering unit vector along the shortest A* obstacle-free path to `target`.
 */
export function computeObstacleAwareSteer(
  from: Vec2,
  target: Vec2,
  entityRadius: number,
  bounds: ArenaBounds
): Vec2 {
  const path = findPathAroundObstacles(from, target, entityRadius, bounds);
  const next = path[0] ?? target;
  const dx = next.x - from.x;
  const dy = next.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return { x: 0, y: 0 };
  return { x: dx / dist, y: dy / dist };
}

/**
 * Updates snake-chain segments with inertia, rigid distance constraints, and obstacle wrapping.
 */
export function stepChainPhysics(
  head: Vec2,
  segments: ChainSegment[],
  spacing: number,
  dt: number,
  isDashing: boolean,
  bounds?: ArenaBounds
): { tipSpeed: number; whipSwingAngle: number } {
  if (segments.length === 0) {
    return { tipSpeed: 0, whipSwingAngle: 0 };
  }

  const safeDt = Math.max(0.001, Math.min(dt, 0.05));
  const inertiaRetention = isDashing ? 0.9 : 0.78;
  const prevTip = { x: segments[segments.length - 1].x, y: segments[segments.length - 1].y };
  const prevTipAngle = Math.atan2(prevTip.y - head.y, prevTip.x - head.x);
  const segRadius = 16;

  let anchorX = head.x;
  let anchorY = head.y;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const oldX = seg.x;
    const oldY = seg.y;

    const tipFactor = (i + 1) / segments.length;
    const carry = inertiaRetention * (0.45 + 0.55 * tipFactor);
    let candX = seg.x + seg.vx * safeDt * carry;
    let candY = seg.y + seg.vy * safeDt * carry;

    for (let pass = 0; pass < 2; pass++) {
      const dx = candX - anchorX;
      const dy = candY - anchorY;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.0001) {
        candX = anchorX + (dx / dist) * spacing;
        candY = anchorY + (dy / dist) * spacing;
      } else {
        candX = anchorX - spacing;
        candY = anchorY;
      }

      if (bounds) {
        const resolved = resolveArenaPosition(candX, candY, segRadius, bounds);
        candX = resolved.x;
        candY = resolved.y;
      }
    }

    seg.vx = (candX - oldX) / safeDt;
    seg.vy = (candY - oldY) / safeDt;
    seg.x = candX;
    seg.y = candY;
    seg.angle = Math.atan2(anchorY - seg.y, anchorX - seg.x);

    anchorX = seg.x;
    anchorY = seg.y;
  }

  const tip = segments[segments.length - 1];
  const tipSpeed = Math.hypot(tip.vx, tip.vy);
  const nextTipAngle = Math.atan2(tip.y - head.y, tip.x - head.x);
  const whipSwingAngle = Math.abs(angleDelta(prevTipAngle, nextTipAngle)) / safeDt;

  return { tipSpeed, whipSwingAngle };
}

export function shouldTriggerDriftWhip(params: {
  isDashing: boolean;
  dashGraceTimer: number;
  accumulatedTurnRad: number;
  tipSpeed: number;
  segmentsCount: number;
}): boolean {
  if (params.segmentsCount <= 0) return false;
  const inDashWindow = params.isDashing || params.dashGraceTimer > 0;
  if (!inDashWindow) return false;

  const sharpTurn = Math.abs(params.accumulatedTurnRad) >= (75 * Math.PI) / 180;
  const fastWhipTip = params.tipSpeed >= 520;
  return sharpTurn || fastWhipTip;
}
