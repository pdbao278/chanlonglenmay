import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COURTYARD_ARENA_BOUNDS,
  angleDelta,
  computeObstacleAwareSteer,
  createInitialChain,
  distanceBetween,
  findFleeWaypointTarget,
  findPathAroundObstacles,
  isPointClearOfObstacles,
  moveWithObstacleSubsteps,
  resolveArenaPosition,
  shouldTriggerDriftWhip,
  stepChainPhysics,
} from './chain-math';

test('createInitialChain spawns exact segment count at configured spacing on clear lower-left road', () => {
  const chain = createInitialChain(330, 565, 4, 38, 0);
  assert.equal(chain.length, 4);
  assert.equal(Math.round(distanceBetween({ x: 330, y: 565 }, chain[0])), 38);
  assert.equal(isPointClearOfObstacles(330, 565, 20, COURTYARD_ARENA_BOUNDS), true);
  for (const seg of chain) {
    assert.equal(isPointClearOfObstacles(seg.x, seg.y, 16, COURTYARD_ARENA_BOUNDS), true);
  }
});

test('stepChainPhysics preserves spacing, wraps around Banyan Tree, and generates whip tip velocity', () => {
  const chain = createInitialChain(520, 565, 4, 38, 0);
  let head = { x: 520, y: 565 };

  for (let i = 0; i < 10; i++) {
    head = resolveArenaPosition(head.x + 8, head.y, 20, COURTYARD_ARENA_BOUNDS);
    stepChainPhysics(head, chain, 38, 0.016, false, COURTYARD_ARENA_BOUNDS);
  }

  let peakTipSpeed = 0;
  for (let i = 0; i < 10; i++) {
    head = resolveArenaPosition(head.x, head.y - 14, 20, COURTYARD_ARENA_BOUNDS);
    const { tipSpeed } = stepChainPhysics(head, chain, 38, 0.016, true, COURTYARD_ARENA_BOUNDS);
    peakTipSpeed = Math.max(peakTipSpeed, tipSpeed);
    for (const seg of chain) {
      assert.equal(isPointClearOfObstacles(seg.x, seg.y, 15.5, COURTYARD_ARENA_BOUNDS), true);
    }
  }

  assert.ok(peakTipSpeed > 250, `Expected high tail tip whip speed, got ${peakTipSpeed}`);
});

test('resolveArenaPosition blocks Banyan Tree, Lotus Pond, Bamboo Islands, Fences, and Huts', () => {
  const outBanyan = resolveArenaPosition(720, 405, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outBanyan.x, outBanyan.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outPond = resolveArenaPosition(720, 660, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outPond.x, outPond.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outUpperLeft = resolveArenaPosition(300, 295, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outUpperLeft.x, outUpperLeft.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outLowerLeft = resolveArenaPosition(350, 475, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outLowerLeft.x, outLowerLeft.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outUpperRight = resolveArenaPosition(1140, 295, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outUpperRight.x, outUpperRight.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outLowerRight = resolveArenaPosition(1090, 475, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outLowerRight.x, outLowerRight.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  const outHut = resolveArenaPosition(220, 120, 20, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(outHut.x, outHut.y, 19.5, COURTYARD_ARENA_BOUNDS), true);

  // Central stone bridge & village gate stay clear
  assert.equal(isPointClearOfObstacles(720, 192, 24, COURTYARD_ARENA_BOUNDS), true);
  assert.equal(isPointClearOfObstacles(720, 232, 24, COURTYARD_ARENA_BOUNDS), true);
});

test('moveWithObstacleSubsteps prevents tunneling through top courtyard fence on fast dash', () => {
  const landed = moveWithObstacleSubsteps(560, 186, 0, 80, 20, COURTYARD_ARENA_BOUNDS);
  assert.ok(landed.y <= 189, `Expected player blocked above fence (y<=189), got y=${landed.y}`);
});

test('A* pathfinding navigates Thầy Thuốc around Lower-Left Rock Island (exact reported stuck case!)', () => {
  // Exact scenario from user screenshot: Boss on right side of island_lower_left, target on left side
  let boss = { x: 472, y: 505 };
  const target = { x: 250, y: 515 };
  const radius = 24;
  const speed = 240;
  const dt = 0.016;

  for (let frame = 0; frame < 140; frame++) {
    const steer = computeObstacleAwareSteer(boss, target, radius, COURTYARD_ARENA_BOUNDS);
    boss = moveWithObstacleSubsteps(
      boss.x,
      boss.y,
      steer.x * speed * dt,
      steer.y * speed * dt,
      radius,
      COURTYARD_ARENA_BOUNDS
    );
    assert.equal(
      isPointClearOfObstacles(boss.x, boss.y, radius - 0.5, COURTYARD_ARENA_BOUNDS),
      true,
      `Boss clipped obstacle at (${boss.x}, ${boss.y})`
    );
    if (distanceBetween(boss, target) < 28) break;
  }

  assert.ok(
    distanceBetween(boss, target) < 35,
    `Boss got stuck instead of navigating around island! Final pos (${boss.x.toFixed(1)}, ${boss.y.toFixed(1)}), dist=${distanceBetween(boss, target).toFixed(1)}`
  );
});

test('A* pathfinding navigates Thầy Thuốc cleanly around the Banyan Tree from north to south', () => {
  let boss = { x: 720, y: 278 };
  const target = { x: 720, y: 545 };
  const radius = 24;
  const speed = 240;
  const dt = 0.016;

  for (let frame = 0; frame < 180; frame++) {
    const steer = computeObstacleAwareSteer(boss, target, radius, COURTYARD_ARENA_BOUNDS);
    boss = moveWithObstacleSubsteps(
      boss.x,
      boss.y,
      steer.x * speed * dt,
      steer.y * speed * dt,
      radius,
      COURTYARD_ARENA_BOUNDS
    );
    assert.equal(isPointClearOfObstacles(boss.x, boss.y, radius - 0.5, COURTYARD_ARENA_BOUNDS), true);
    if (distanceBetween(boss, target) < 28) break;
  }

  assert.ok(
    distanceBetween(boss, target) < 35,
    `Boss failed to navigate around Banyan Tree! Final pos (${boss.x.toFixed(1)}, ${boss.y.toFixed(1)})`
  );
});

test('findFleeWaypointTarget picks an open distant road point for Fever Mode fleeing', () => {
  const fleePt = findFleeWaypointTarget({ x: 520, y: 500 }, { x: 480, y: 490 }, 24, COURTYARD_ARENA_BOUNDS);
  assert.equal(isPointClearOfObstacles(fleePt.x, fleePt.y, 22, COURTYARD_ARENA_BOUNDS), true);
  assert.ok(distanceBetween(fleePt, { x: 480, y: 490 }) > 350);
  const path = findPathAroundObstacles({ x: 520, y: 500 }, fleePt, 24, COURTYARD_ARENA_BOUNDS);
  assert.ok(path.length >= 1);
});

test('shouldTriggerDriftWhip triggers on sharp dash turn or fast tail whip', () => {
  assert.equal(
    shouldTriggerDriftWhip({
      isDashing: true,
      dashGraceTimer: 0,
      accumulatedTurnRad: (95 * Math.PI) / 180,
      tipSpeed: 200,
      segmentsCount: 4,
    }),
    true
  );

  assert.equal(
    shouldTriggerDriftWhip({
      isDashing: false,
      dashGraceTimer: 0,
      accumulatedTurnRad: Math.PI,
      tipSpeed: 800,
      segmentsCount: 4,
    }),
    false
  );
});

test('angleDelta wraps cleanly across PI boundary', () => {
  const d = angleDelta(Math.PI - 0.1, -Math.PI + 0.1);
  assert.ok(Math.abs(d - 0.2) < 0.001);
});
