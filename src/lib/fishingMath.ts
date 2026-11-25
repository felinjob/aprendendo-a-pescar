/**
 * Pure domain calculations for sportfishing tackle engineering,
 * spool physics, IGFA rig compliance, and slow-pitch / surfcasting setups.
 */

export const LB_TO_KG = 0.45359237;
export const CM_PER_INCH = 2.54;

export interface StrikeDragResult {
  minLb: number;
  targetLb: number;
  maxLb: number;
  minKg: number;
  targetKg: number;
  maxKg: number;
}

export interface EmptySpoolTensionResult {
  effectiveTensionLb: number;
  effectiveTensionKg: number;
  ratioOfClassPct: number;
  isDangerZone: boolean;
}

export interface IgfaRigAuditResult {
  isHeavyClass: boolean;
  maxSingleSegmentM: number;
  maxCombinedM: number;
  combinedM: number;
  doubleLineOk: boolean;
  leaderOk: boolean;
  combinedOk: boolean;
  allCompliant: boolean;
  excessDoubleM: number;
  excessLeaderM: number;
  excessCombinedM: number;
}

export interface PeEstimationResult {
  diameterMm: number;
  strength4xLb: number;
  strength8xLb: number;
  strength8xKg: number;
}

export interface RetrievalSpeedResult {
  cptCm: number;
  iptInches: number;
  metersPerMinuteAt60Rpm: number;
}

/**
 * Strike drag calibration at full spool (25%–33% of IGFA line class, target 30%).
 */
export function calculateStrikeDrag(lineClassLb: number): StrikeDragResult {
  const safeClass = Math.max(2, lineClassLb);
  const minLb = Number((safeClass * 0.25).toFixed(1));
  const targetLb = Number((safeClass * 0.30).toFixed(1));
  const maxLb = Number((safeClass * 0.33).toFixed(1));

  return {
    minLb,
    targetLb,
    maxLb,
    minKg: Number((minLb * LB_TO_KG).toFixed(1)),
    targetKg: Number((targetLb * LB_TO_KG).toFixed(1)),
    maxKg: Number((maxLb * LB_TO_KG).toFixed(1)),
  };
}

/**
 * Empty-spool physics: as spool radius drops, required tension grows inversely
 * (T_eff = T_strike * (100 / spoolFillPct)).
 * At 50% fill, effective drag doubles; danger zone triggers at >= 75% of class breaking strength.
 */
export function calculateEmptySpoolTension(
  lineClassLb: number,
  spoolFillPct: number,
  strikeRatio = 0.3
): EmptySpoolTensionResult {
  const safeClass = Math.max(2, lineClassLb);
  const clampedFill = Math.max(10, Math.min(100, spoolFillPct));
  const strikeBaseLb = safeClass * strikeRatio;
  const effectiveTensionLb = Number((strikeBaseLb * (100 / clampedFill)).toFixed(1));
  const effectiveTensionKg = Number((effectiveTensionLb * LB_TO_KG).toFixed(1));
  const ratioOfClassPct = Math.round((effectiveTensionLb / safeClass) * 100);

  return {
    effectiveTensionLb,
    effectiveTensionKg,
    ratioOfClassPct,
    isDangerZone: ratioOfClassPct >= 75,
  };
}

/**
 * IGFA saltwater double-line + leader audit.
 * <= 20 lb (10 kg): single max 4.57 m (15 ft), combined max 6.10 m (20 ft).
 * > 20 lb: single max 9.14 m (30 ft), combined max 12.19 m (40 ft).
 */
export function auditIgfaRig(
  lineClassLb: number,
  doubleLineM: number,
  leaderM: number
): IgfaRigAuditResult {
  const isHeavyClass = lineClassLb > 20;
  const maxSingleSegmentM = isHeavyClass ? 9.14 : 4.57;
  const maxCombinedM = isHeavyClass ? 12.19 : 6.10;
  const safeDouble = Math.max(0, Number(doubleLineM.toFixed(2)));
  const safeLeader = Math.max(0, Number(leaderM.toFixed(2)));
  const combinedM = Number((safeDouble + safeLeader).toFixed(2));

  const doubleLineOk = safeDouble <= maxSingleSegmentM;
  const leaderOk = safeLeader <= maxSingleSegmentM;
  const combinedOk = combinedM <= maxCombinedM;

  return {
    isHeavyClass,
    maxSingleSegmentM,
    maxCombinedM,
    combinedM,
    doubleLineOk,
    leaderOk,
    combinedOk,
    allCompliant: doubleLineOk && leaderOk && combinedOk,
    excessDoubleM: Number(Math.max(0, safeDouble - maxSingleSegmentM).toFixed(2)),
    excessLeaderM: Number(Math.max(0, safeLeader - maxSingleSegmentM).toFixed(2)),
    excessCombinedM: Number(Math.max(0, combinedM - maxCombinedM).toFixed(2)),
  };
}

/**
 * Japanese Gou / PE formula:
 * d (mm) ≈ 0.165 * sqrt(PE)
 * Typical 4X braided breaking strength ≈ PE * 10 lb; 8X ≈ PE * 13–15 lb (uses 13.5 lb baseline).
 */
export function estimatePeLine(peNumber: number): PeEstimationResult {
  const safePe = Math.max(0.2, peNumber);
  const diameterMm = Number((0.165 * Math.sqrt(safePe)).toFixed(3));
  const strength4xLb = Number((safePe * 10).toFixed(1));
  const strength8xLb = Number((safePe * 13.5).toFixed(1));
  const strength8xKg = Number((strength8xLb * LB_TO_KG).toFixed(1));

  return {
    diameterMm,
    strength4xLb,
    strength8xLb,
    strength8xKg,
  };
}

/**
 * Real line retrieval per crank turn (CPT in cm and IPT in inches).
 * CPT (cm) = pi * spoolDiameterCm * gearRatio
 */
export function calculateRetrievalSpeed(
  spoolDiameterMm: number,
  gearRatio: number
): RetrievalSpeedResult {
  const safeDiamMm = Math.max(10, spoolDiameterMm);
  const safeRatio = Math.max(1, gearRatio);
  const cptCm = Number((Math.PI * (safeDiamMm / 10) * safeRatio).toFixed(1));
  const iptInches = Number((cptCm / CM_PER_INCH).toFixed(1));
  const metersPerMinuteAt60Rpm = Number(((cptCm * 60) / 100).toFixed(1));

  return {
    cptCm,
    iptInches,
    metersPerMinuteAt60Rpm,
  };
}

/**
 * Slow Pitch Jigging weight rule of thumb:
 * ~1 g per foot of depth (~3.28 g/m), scaled up by current factor (1.0 slack -> 1.5 strong).
 */
export function recommendSlowJigGrams(
  depthMeters: number,
  currentFactor = 1.0
): { minGrams: number; idealGrams: number; maxGrams: number } {
  const depthFeet = Math.max(10, depthMeters) * 3.28084;
  const clampedCurrent = Math.max(0.8, Math.min(1.8, currentFactor));
  const idealGrams = Math.round((depthFeet * clampedCurrent) / 10) * 10;

  return {
    minGrams: Math.max(40, Math.round((idealGrams * 0.85) / 10) * 10),
    idealGrams: Math.max(40, idealGrams),
    maxGrams: Math.max(60, Math.round((idealGrams * 1.2) / 10) * 10),
  };
}

/**
 * Surfcasting shock leader calculation:
 * Rule of thumb: 10 lb of leader per ounce (~28.35 g) of sinker, minimum 30 lb,
 * length = 2x rod length + 4–5 spool turns (~1.5 m).
 */
export function calculateShockLeader(
  sinkerGrams: number,
  rodLengthMeters: number
): { recommendedLb: number; recommendedLengthM: number } {
  const ounces = Math.max(1, sinkerGrams / 28.3495);
  const recommendedLb = Math.max(30, Math.ceil((ounces * 10) / 5) * 5);
  const recommendedLengthM = Number((Math.max(2, rodLengthMeters) * 2 + 1.5).toFixed(1));

  return {
    recommendedLb,
    recommendedLengthM,
  };
}
