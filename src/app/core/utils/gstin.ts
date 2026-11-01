/** GST state codes a GSTIN may start with (same list as the server). */
const STATE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '20', '21', '22', '23', '24', '26', '27', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '97',
]);
const SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** An empty GSTIN is allowed (the field is optional). Returns the problem in plain words, or null when fine. */
export function gstinProblem(value: string | null | undefined): string | null {
  const v = (value ?? '').trim().toUpperCase();
  if (!v) return null;
  if (v.length !== 15) return 'A GSTIN has 15 characters, for example 27ABCDE1234F1Z5.';
  if (!STATE_CODES.has(v.slice(0, 2))) return 'The first two digits must be a valid state code.';
  if (!SHAPE.test(v)) return 'This is not a valid GSTIN. Check the PAN part, the 14th character (Z) and the last character.';
  return null;
}

/** HSN/SAC is optional; when given it is 4 to 8 digits. */
export function sacProblem(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return !v || /^[0-9]{4,8}$/.test(v) ? null : 'The HSN/SAC code is 4 to 8 digits.';
}
