/**
 * Evaluate a small arithmetic expression used in money inputs.
 * Supports decimal commas, +, -, *, /, x, percentages and parentheses.
 * No identifiers or executable JavaScript are accepted.
 */
export function evaluateMoneyExpression(value) {
  const source = String(value ?? '').trim();
  if (!source) return null;

  const normalized = source
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[×x]/gi, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-');

  if (!/^[0-9.+\-*/()%]+$/.test(normalized)) return null;

  let index = 0;

  function peek() { return normalized[index] || ''; }
  function consume(char) {
    if (peek() !== char) return false;
    index += 1;
    return true;
  }
  function parseNumber() {
    const start = index;
    let dots = 0;
    while (/[0-9.]/.test(peek())) {
      if (peek() === '.') dots += 1;
      if (dots > 1) return null;
      index += 1;
    }
    if (index === start) return null;
    const number = Number(normalized.slice(start, index));
    return Number.isFinite(number) ? number : null;
  }
  function parsePrimary() {
    if (consume('+')) return parsePrimary();
    if (consume('-')) {
      const value = parsePrimary();
      return value === null ? null : -value;
    }
    if (consume('(')) {
      const value = parseExpression();
      if (value === null || !consume(')')) return null;
      return value;
    }
    return parseNumber();
  }
  function parseFactor() {
    let value = parsePrimary();
    if (value === null) return null;
    while (consume('%')) value /= 100;
    return value;
  }
  function parseTerm() {
    let value = parseFactor();
    if (value === null) return null;
    while (peek() === '*' || peek() === '/') {
      const operator = normalized[index++];
      const right = parseFactor();
      if (right === null || (operator === '/' && Math.abs(right) < Number.EPSILON)) return null;
      value = operator === '*' ? value * right : value / right;
      if (!Number.isFinite(value)) return null;
    }
    return value;
  }
  function parseExpression() {
    let value = parseTerm();
    if (value === null) return null;
    while (peek() === '+' || peek() === '-') {
      const operator = normalized[index++];
      const right = parseTerm();
      if (right === null) return null;
      value = operator === '+' ? value + right : value - right;
      if (!Number.isFinite(value)) return null;
    }
    return value;
  }

  const result = parseExpression();
  if (result === null || index !== normalized.length || !Number.isFinite(result)) return null;
  return result;
}

export function normalizeMoneyExpression(value, { minimum = 0, maximum = Number.POSITIVE_INFINITY } = {}) {
  if (String(value ?? '').trim() === '') return '';
  const evaluated = evaluateMoneyExpression(value);
  if (evaluated === null) return null;
  return Math.min(maximum, Math.max(minimum, evaluated)).toFixed(2);
}
