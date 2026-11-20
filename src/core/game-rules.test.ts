import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_CONSTANTS,
  applyHealSegmentPickup,
  applyXinKhucChoice,
  calculateActionPoints,
  calculateFeverRamDamage,
  calculateVictorySegmentBonus,
  canActivateWhip,
  canSacrificeSegment,
  computeRank,
  createInitialModifiers,
  getEffectiveBossSpeed,
  pickBuffChoices,
} from './game-rules';

test('canSacrificeSegment requires at least 2 tail segments', () => {
  assert.equal(canSacrificeSegment(4), true);
  assert.equal(canSacrificeSegment(2), true);
  assert.equal(canSacrificeSegment(1), false);
  assert.equal(canSacrificeSegment(0), false);
});

test('applyXinKhucChoice sacrifice removes 1 segment and grants permanent buff', () => {
  const initial = createInitialModifiers();
  const res = applyXinKhucChoice(4, initial, 'sacrifice', 'wind_boots');
  assert.equal(res.nextSegments, 3);
  assert.equal(res.nextModifiers.moveSpeedMult, 1.2);
  assert.equal(res.nextModifiers.dashCooldownSec, 0.9);
  assert.equal(res.nextModifiers.scoreMultiplier, 1);
  assert.deepEqual(res.nextModifiers.appliedBuffs, ['wind_boots']);
});

test('applyXinKhucChoice sacrifice thunder_tail extends stun and whip radius', () => {
  const initial = createInitialModifiers();
  const res = applyXinKhucChoice(3, initial, 'sacrifice', 'thunder_tail');
  assert.equal(res.nextSegments, 2);
  assert.equal(res.nextModifiers.whipStunSec, 3.0);
  assert.equal(res.nextModifiers.whipRadiusMult, 1.3);
});

test('applyXinKhucChoice sacrifice cloud_magnet boosts cloud charge and magnet radius', () => {
  const initial = createInitialModifiers();
  const res = applyXinKhucChoice(2, initial, 'sacrifice', 'cloud_magnet');
  assert.equal(res.nextSegments, 1);
  assert.equal(res.nextModifiers.cloudChargeMult, 1.35);
  assert.equal(res.nextModifiers.cloudMagnetRadiusMult, 2.0);
});

test('applyXinKhucChoice refuse preserves segments, enrages boss, and grants x2 score', () => {
  const initial = createInitialModifiers();
  const res = applyXinKhucChoice(4, initial, 'refuse');
  assert.equal(res.nextSegments, 4);
  assert.equal(res.nextModifiers.bossEnrageLevel, 1);
  assert.equal(res.nextModifiers.scoreMultiplier, 2);
  assert.ok(getEffectiveBossSpeed(2, 1) > getEffectiveBossSpeed(2, 0));
});

test('applyXinKhucChoice falls back to refuse when segments < 2', () => {
  const initial = createInitialModifiers();
  const res = applyXinKhucChoice(1, initial, 'sacrifice', 'wind_boots');
  assert.equal(res.nextSegments, 1);
  assert.equal(res.nextModifiers.scoreMultiplier, 2);
  assert.equal(res.nextModifiers.bossEnrageLevel, 1);
});

test('calculateFeverRamDamage scales with remaining tail segments', () => {
  assert.equal(calculateFeverRamDamage(0), 100);
  assert.equal(calculateFeverRamDamage(4), 200);
  assert.equal(calculateFeverRamDamage(2), 150);
});

test('scoring and rank thresholds match GDD spec', () => {
  assert.equal(calculateActionPoints(GAME_CONSTANTS.SCORE_WHIP_STUN, 2), 200);
  assert.equal(calculateVictorySegmentBonus(4), 1000);
  assert.equal(computeRank(3600).grade, 'S');
  assert.equal(computeRank(2500).grade, 'A');
  assert.equal(computeRank(1400).grade, 'B');
  assert.equal(computeRank(800).grade, 'C');
});

test('pickBuffChoices excludes already applied buffs when others remain', () => {
  const choices = pickBuffChoices(['wind_boots']);
  assert.equal(choices.length, 2);
  assert.equal(choices.some((b) => b.id === 'wind_boots'), false);
});

test('whip cooldown defaults to 10s and canActivateWhip blocks activation while cooling down', () => {
  const mods = createInitialModifiers();
  assert.equal(mods.whipCooldownSec, 10);
  assert.equal(GAME_CONSTANTS.HEAL_ITEM_SPAWN_INTERVAL_SEC, 10);
  assert.equal(canActivateWhip(0, 0, false, 3), true);
  assert.equal(canActivateWhip(9.5, 0, false, 3), false);
  assert.equal(canActivateWhip(0, 0.2, false, 3), false);
  assert.equal(canActivateWhip(0, 0, true, 3), false);
  assert.equal(canActivateWhip(0, 0, false, 0), false);
});

test('applyHealSegmentPickup restores 1 missing segment up to max, or grants score & cloud bonus when full', () => {
  const healed = applyHealSegmentPickup(2, 4, 1);
  assert.equal(healed.restored, true);
  assert.equal(healed.nextSegments, 3);
  assert.equal(healed.bonusScore, 30);
  assert.equal(healed.bonusCloudPercent, 0);

  const restoredFromZero = applyHealSegmentPickup(0, 4, 2);
  assert.equal(restoredFromZero.restored, true);
  assert.equal(restoredFromZero.nextSegments, 1);
  assert.equal(restoredFromZero.bonusScore, 60);

  const alreadyFull = applyHealSegmentPickup(4, 4, 2);
  assert.equal(alreadyFull.restored, false);
  assert.equal(alreadyFull.nextSegments, 4);
  assert.equal(alreadyFull.bonusScore, 100);
  assert.equal(alreadyFull.bonusCloudPercent, 10);
});
