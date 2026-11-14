/**
 * Unit tests for Weather & Bird Activity Conditions calculations
 * Covers:
 * 1. Unit conversion (temp, wind, visibility, pressure, height)
 * 2. Timezone formatting (WIB, Asia/Jakarta, UTC+7, no DST)
 * 3. Thermal height calculation including edge cases where T - Td is near 0 or negative
 * 4. Stale-data logic (> 30 min triggers warning)
 * 5. Bird Activity Risk rule evaluation
 */

import {
  degreesToCompass,
  formatAirportTime,
  calculateThermalHeight,
  checkWeatherStaleness,
  calculateHeatIndex,
  formatTemperature,
  formatWindSpeed,
  formatVisibility,
  formatPressure,
  formatHeight
} from '../src/utils/weatherCalculations';
import { evaluateBirdActivityRisk, getTimeOfDayCategory, RuleDefinition } from '../src/utils/birdActivityEvaluator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('\n--- 1. Testing Compass Degrees to 16-point Cardinal ---');
assert(degreesToCompass(0) === 'N', '0° is North');
assert(degreesToCompass(360) === 'N', '360° is North');
assert(degreesToCompass(45) === 'NE', '45° is North-East');
assert(degreesToCompass(90) === 'E', '90° is East');
assert(degreesToCompass(180) === 'S', '180° is South');
assert(degreesToCompass(270) === 'W', '270° is West');
assert(degreesToCompass(68) === 'ENE', '68° (CGK Runway 07L heading) is ENE');
assert(degreesToCompass(null) === '--', 'null degree returns placeholder --');

console.log('\n--- 2. Testing Airport Timezone Formatting (WIB, Asia/Jakarta, UTC+7, no DST) ---');
// 2026-11-05T03:30:00Z should be 10:30 WIB (UTC + 7 hours)
const testDateUtc = '2026-11-05T03:30:00.000Z';
const formattedWib = formatAirportTime(testDateUtc, 'Asia/Jakarta');
assert(formattedWib === '10:30 WIB', `Formatted UTC 03:30Z to ${formattedWib} (expected 10:30 WIB)`);

// Midnight UTC (00:00Z) should be 07:00 WIB
const testMidnightUtc = '2026-11-05T00:00:00.000Z';
const formattedMidnight = formatAirportTime(testMidnightUtc, 'Asia/Jakarta');
assert(formattedMidnight === '07:00 WIB', `Formatted UTC 00:00Z to ${formattedMidnight} (expected 07:00 WIB)`);

// Invalid date handling
assert(formatAirportTime('invalid-date', 'Asia/Jakarta') === '--:-- WIB', 'Handles invalid date string safely');

console.log('\n--- 3. Testing Thermal / Mixing Height (125 * (T - Td)) & Edge Cases ---');
// Case A: Standard tropical afternoon (T = 32°C, Td = 24°C => diff 8°C => 1000m)
const caseNormal = calculateThermalHeight(32, 24);
assert(caseNormal.height_m === 1000, `Normal spread: 125 * (32 - 24) = ${caseNormal.height_m}m (expected 1000m)`);
assert(caseNormal.isEstimated === true, 'Flagged as estimated');

// Case B: Edge case T - Td is near 0 (T = 24.2°C, Td = 24.0°C => diff 0.2°C => 25m)
const caseNearZero = calculateThermalHeight(24.2, 24.0);
assert(caseNearZero.height_m === 25, `Near zero spread: 125 * 0.2 = ${caseNearZero.height_m}m (expected 25m)`);

// Case C: Edge case exact saturation T == Td (T = 22°C, Td = 22°C => 0m surface condensation)
const caseExactZero = calculateThermalHeight(22, 22);
assert(caseExactZero.height_m === 0, `Exact saturation T == Td returns 0m (expected 0m, got ${caseExactZero.height_m})`);

// Case D: Edge case supersaturation T < Td (T = 21.5°C, Td = 22.0°C => must NOT be negative)
const caseNegative = calculateThermalHeight(21.5, 22.0);
assert(caseNegative.height_m === 0, `T < Td supersaturation returns 0m surface condensation (never negative, got ${caseNegative.height_m})`);

// Case E: Missing / null inputs
const caseNull = calculateThermalHeight(null, 22);
assert(caseNull.height_m === null, 'Missing T returns null height');

console.log('\n--- 4. Testing Stale-Data Detection (> 30 min triggers warning) ---');
const now = Date.now();
const freshTimestamp = new Date(now - 5 * 60 * 1000).toISOString(); // 5 min ago
const staleTimestamp = new Date(now - 35 * 60 * 1000).toISOString(); // 35 min ago
const veryStaleTimestamp = new Date(now - 120 * 60 * 1000).toISOString(); // 2 hours ago

const freshCheck = checkWeatherStaleness(freshTimestamp, 30);
assert(freshCheck.isStale === false, `5 min old data is NOT stale (age: ${freshCheck.ageMinutes}m)`);

const staleCheck = checkWeatherStaleness(staleTimestamp, 30);
assert(staleCheck.isStale === true, `35 min old data IS stale (age: ${staleCheck.ageMinutes}m)`);

const veryStaleCheck = checkWeatherStaleness(veryStaleTimestamp, 30);
assert(veryStaleCheck.isStale === true && veryStaleCheck.ageMinutes >= 120, '2 hours old data is flagged stale');

console.log('\n--- 5. Testing Unit System Conversions (Never Mixed) ---');
// Temperature
assert(formatTemperature(30, 'aviation').value === '30' && formatTemperature(30, 'aviation').unit === '°C', 'Aviation temp is in °C');
assert(formatTemperature(30, 'metric').value === '30' && formatTemperature(30, 'metric').unit === '°C', 'Metric temp is in °C');
assert(formatTemperature(30, 'imperial').value === '86' && formatTemperature(30, 'imperial').unit === '°F', 'Imperial temp is in °F (86°F)');
assert(formatTemperature(null, 'aviation').value === '--', 'Null temp renders --');

// Wind speed
assert(formatWindSpeed(10, 'aviation').unit === 'kt', 'Aviation wind unit is kt');
assert(formatWindSpeed(10, 'metric').unit === 'km/h', 'Metric wind unit default is km/h');
assert(formatWindSpeed(10, 'metric', 'ms').unit === 'm/s', 'Metric wind unit optional is m/s');
assert(formatWindSpeed(10, 'imperial').unit === 'mph', 'Imperial wind unit is mph');

// Visibility
assert(formatVisibility(10, 'aviation').unit === 'km', 'Aviation visibility is in km');
assert(formatVisibility(3.5, 'aviation').secondary?.includes('3,500 m') || false, 'Visibility < 5km includes meters secondary');
assert(formatVisibility(10, 'imperial').unit === 'mi', 'Imperial visibility is in miles');

// Pressure
assert(formatPressure(1013, 'aviation').unit === 'hPa', 'Aviation pressure is in hPa');
assert(formatPressure(1013, 'imperial').unit === 'inHg', 'Imperial pressure is in inHg');

// Height
assert(formatHeight(1000, 'aviation').unit === 'ft', 'Aviation height is in ft');
assert(formatHeight(1000, 'metric').unit === 'm', 'Metric height is in m');

console.log('\n--- 6. Testing Bird Activity Risk Evaluation Rules ---');
// Test Rule: Thunderstorm -> HIGH
const riskTS = evaluateBirdActivityRisk({
  thermalHeightM: 500,
  windSpeedKt: 10,
  visibilityKm: 5,
  isThunderstorm: true,
  rainfallMm: 5,
  humidityPct: 90,
  hourWib: 14.0
});
assert(riskTS.level === 'HIGH', `Thunderstorm evaluates to HIGH risk (got ${riskTS.level})`);
assert(riskTS.ruleId === 'RULE_THUNDERSTORM_CONVECTIVE_DISPLACEMENT', `Triggered rule ${riskTS.ruleId}`);

// Test Rule: Crepuscular Dawn (06:00 WIB) with Low Vis (< 4km) -> HIGH
const riskCrepuscularLowVis = evaluateBirdActivityRisk({
  thermalHeightM: 100,
  windSpeedKt: 4,
  visibilityKm: 3.0,
  isThunderstorm: false,
  rainfallMm: 0,
  humidityPct: 95,
  hourWib: 6.25 // 06:15 WIB
});
assert(riskCrepuscularLowVis.level === 'HIGH', `Dawn with low visibility evaluates to HIGH risk (got ${riskCrepuscularLowVis.level})`);
assert(riskCrepuscularLowVis.ruleId === 'RULE_CREPUSCULAR_PEAK_LOW_VISIBILITY', `Triggered rule ${riskCrepuscularLowVis.ruleId}`);

// Test Rule: High Thermal (> 750m) & Low Wind (< 9kt) in afternoon -> MODERATE
const riskThermalSoaring = evaluateBirdActivityRisk({
  thermalHeightM: 1100,
  windSpeedKt: 5,
  visibilityKm: 9.0,
  isThunderstorm: false,
  rainfallMm: 0,
  humidityPct: 55,
  hourWib: 13.5 // 13:30 WIB
});
assert(riskThermalSoaring.level === 'MODERATE', `High thermal and low wind evaluates to MODERATE (got ${riskThermalSoaring.level})`);
assert(riskThermalSoaring.ruleId === 'RULE_THERMAL_SOARING_CONDITIONS', `Triggered rule ${riskThermalSoaring.ruleId}`);

// Test Rule: Default Calm midday -> LOW
const riskDefault = evaluateBirdActivityRisk({
  thermalHeightM: 400,
  windSpeedKt: 12,
  visibilityKm: 10.0,
  isThunderstorm: false,
  rainfallMm: 0,
  humidityPct: 60,
  hourWib: 11.0 // 11:00 WIB
});
assert(riskDefault.level === 'LOW', `Standard conditions evaluate to LOW (got ${riskDefault.level})`);
assert(riskDefault.ruleId === 'RULE_DEFAULT_BASELINE', `Triggered rule ${riskDefault.ruleId}`);

console.log('\n===========================================');
console.log(' ALL WEATHER & BIRD ACTIVITY TESTS PASSED! ');
console.log('===========================================\n');
