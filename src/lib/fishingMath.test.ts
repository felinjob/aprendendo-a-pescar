import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  auditIgfaRig,
  calculateEmptySpoolTension,
  calculateRetrievalSpeed,
  calculateShockLeader,
  calculateStrikeDrag,
  estimatePeLine,
  recommendSlowJigGrams,
} from './fishingMath.ts';

describe('fishingMath domain calculations', () => {
  it('computes IGFA 50 lb strike drag range (25%-33%) accurately', () => {
    const res = calculateStrikeDrag(50);
    assert.equal(res.minLb, 12.5);
    assert.equal(res.targetLb, 15);
    assert.equal(res.maxLb, 16.5);
    assert.equal(res.targetKg, 6.8);
  });

  it('doubles effective drag at 50% spool fill and flags danger zone below 40% fill', () => {
    const full = calculateEmptySpoolTension(50, 100);
    assert.equal(full.effectiveTensionLb, 15);
    assert.equal(full.isDangerZone, false);

    const half = calculateEmptySpoolTension(50, 50);
    assert.equal(half.effectiveTensionLb, 30);
    assert.equal(half.ratioOfClassPct, 60);
    assert.equal(half.isDangerZone, false);

    const critical = calculateEmptySpoolTension(50, 35);
    assert.equal(critical.ratioOfClassPct, 86);
    assert.equal(critical.isDangerZone, true);
  });

  it('audits IGFA combined double-line + leader caps for <=20 lb and >20 lb classes', () => {
    // 20 lb class: 4.57m single, 6.10m combined
    const okLight = auditIgfaRig(20, 2.0, 4.1);
    assert.equal(okLight.isHeavyClass, false);
    assert.equal(okLight.allCompliant, true);
    assert.equal(okLight.combinedM, 6.1);

    const failLight = auditIgfaRig(20, 3.0, 4.0);
    assert.equal(failLight.allCompliant, false);
    assert.equal(failLight.combinedOk, false);
    assert.equal(failLight.excessCombinedM, 0.9);

    // 50 lb class: 9.14m single, 12.19m combined
    const okHeavy = auditIgfaRig(50, 3.05, 9.14);
    assert.equal(okHeavy.isHeavyClass, true);
    assert.equal(okHeavy.allCompliant, true);

    const failHeavySingle = auditIgfaRig(80, 9.5, 2.0);
    assert.equal(failHeavySingle.doubleLineOk, false);
    assert.equal(failHeavySingle.excessDoubleM, 0.36);
    assert.equal(failHeavySingle.allCompliant, false);
  });

  it('estimates Japanese PE line diameter and breaking strengths', () => {
    const pe1 = estimatePeLine(1.0);
    assert.equal(pe1.diameterMm, 0.165);
    assert.equal(pe1.strength4xLb, 10);

    const pe4 = estimatePeLine(4.0);
    assert.equal(pe4.diameterMm, 0.33);
    assert.equal(pe4.strength8xLb, 54);
  });

  it('computes real CPT/IPT retrieval from spool diameter and gear ratio', () => {
    // 54mm spool, 6.2:1 gear ratio -> ~105.2 cm/turn (~41.4 in)
    const speed = calculateRetrievalSpeed(54, 6.2);
    assert.equal(speed.cptCm, 105.2);
    assert.equal(speed.iptInches, 41.4);
  });

  it('recommends slow-pitch jig weights (~1 g/ft) and surfcasting shock leaders', () => {
    const jig = recommendSlowJigGrams(100, 1.0);
    // 100 m = ~328 ft -> ~330 g
    assert.equal(jig.idealGrams, 330);

    const shock = calculateShockLeader(140, 4.2);
    // 140 g ≈ 4.94 oz -> 50 lb leader, length 4.2*2 + 1.5 = 9.9 m
    assert.equal(shock.recommendedLb, 50);
    assert.equal(shock.recommendedLengthM, 9.9);
  });
});
