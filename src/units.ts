const RU_PREFIX: Record<string, string> = { p: 'п', n: 'н', 'µ': 'мк', m: 'м', k: 'к', M: 'М', '': '' };
const RU_UNIT: Record<string, string> = { 'Ω': 'Ом', F: 'Ф', V: 'В', A: 'А', Hz: 'Гц', H: 'Гн', W: 'Вт' };

/** "4.7kΩ" → "4,7 кОм" (ru) / "4.7 kΩ" (en). Anything that isn't a value with a unit passes through. */
export function formatValue(value: string, lang: string) {
  const m = /^(\d+(?:\.\d+)?)\s*([pnuµmkM]?)(Ω|F|V|A|Hz|H|W)$/.exec(value);
  if (!m) return value;
  const [, num, raw, unit] = m;
  const prefix = raw === 'u' ? 'µ' : raw;
  return lang.startsWith('ru')
    ? `${num.replace('.', ',')} ${RU_PREFIX[prefix]}${RU_UNIT[unit]}`
    : `${num} ${prefix}${unit}`;
}

export const formatPrice = (rub: number, lang: string) =>
  new Intl.NumberFormat(lang, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(rub);
