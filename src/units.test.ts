import { expect, test } from 'vitest';
import { formatValue } from './units';

test('formatValue', () => {
  expect(formatValue('4.7kΩ', 'ru')).toBe('4,7 кОм');
  expect(formatValue('100nF', 'ru')).toBe('100 нФ');
  expect(formatValue('10uF', 'en')).toBe('10 µF');
  expect(formatValue('3.3V', 'ru')).toBe('3,3 В');
  expect(formatValue('32kHz', 'ru')).toBe('32 кГц');
  expect(formatValue('1MΩ', 'en')).toBe('1 MΩ');
  expect(formatValue('NE555P', 'ru')).toBe('NE555P');
});
