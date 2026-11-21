import { describe, expect, test } from 'vitest';

import { formatMoney, statusColor, statusLabel, toNumber } from '@/utils/format';

describe('format utils', () => {
  test('toNumber parses strings and falls back to 0', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });

  test('formatMoney renders price with currency', () => {
    expect(formatMoney('99.9')).toBe('99.90 ₴');
  });

  test('status helpers map order status', () => {
    expect(statusLabel('on_the_way')).toBe('В дорозі');
    expect(statusColor('delivered')).toBe('success');
  });
});
