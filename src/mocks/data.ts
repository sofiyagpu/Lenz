import type { AgentEvent, CheckResult, Part, VersionData } from '../types';

export type TemplateId = 'blinker' | 'humidity' | 'weather';

/** One script line: wait `ms`, then emit. A question or retryable error pauses until the user answers. */
export type ScriptLine = [ms: number, event: AgentEvent];

interface Template {
  title: string;
  data: Omit<VersionData, 'version'>;
  script: ScriptLine[];
}

const ex = (zero: string, hobby: string, engineer: string) => ({ zero, hobby, engineer });

const blinkerParts: Part[] = [
  {
    ref: 'U1', value: 'NE555P', package: 'DIP-8', qty: 1, factorySku: 'ZV-IC-0555', stock: 142, bin: 'A3-12', price: 18,
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/ne555.pdf',
    params: { 'Питание': '4,5–16 В', 'Ток покоя': '3 мА', 'Выход': '200 мА', 'Температура': '0…70 °C' },
    explain: ex('Таймер: включает и выключает светодиод сам, как метроном.', 'Таймер 555 в режиме генератора.', 'Astable, f = 1.44 / ((R1 + 2·R2)·C1).'),
  },
  {
    ref: 'R1', value: '1kΩ', package: 'Axial', qty: 1, factorySku: 'ZV-R-1K0', stock: 2400, bin: 'B1-03', price: 1,
    params: { 'Допуск': '5 %', 'Мощность': '0,25 Вт' },
    explain: ex('Резистор ограничивает ток. Полоски: коричневая-чёрная-красная.', 'Зарядный резистор таймера.', 'R_A, задаёт время заряда.'),
  },
  {
    ref: 'R2', value: '68kΩ', package: 'Axial', qty: 1, factorySku: 'ZV-R-68K', stock: 1800, bin: 'B1-17', price: 1,
    params: { 'Допуск': '1 %', 'Мощность': '0,25 Вт' },
    explain: ex('Этот резистор задаёт, как часто мигает светодиод.', 'Задаёт частоту мигания.', 'R_B, 1 % после Монте-Карло.'),
  },
  {
    ref: 'R3', value: '220Ω', package: 'Axial', qty: 1, factorySku: 'ZV-R-220', stock: 3100, bin: 'B1-02', price: 1,
    params: { 'Допуск': '5 %', 'Мощность': '0,25 Вт' },
    explain: ex('Защищает светодиод, чтобы он не сгорел. Полоски: красная-красная-коричневая.', 'Токоограничивающий для LED.', 'I_LED ≈ (9 − 1.8 − 1.7) / 220 ≈ 25 мА.'),
  },
  {
    ref: 'C1', value: '10uF', package: 'Radial D5', qty: 1, factorySku: 'ZV-C-10U-25', stock: 640, bin: 'C2-08', price: 4,
    params: { 'Напряжение': '25 В', 'Тип': 'электролит' },
    explain: ex('Конденсатор — маленький аккумулятор. У него есть плюс и минус, длинная ножка — плюс.', 'Времязадающий конденсатор, полярный.', 'C_T, электролит, ESR не критичен.'),
  },
  {
    ref: 'C2', value: '10nF', package: 'Disc 5 mm', qty: 1, factorySku: 'ZV-C-10N', stock: 8, bin: 'C1-04', price: 2,
    params: { 'Напряжение': '50 В', 'Тип': 'керамика' },
    explain: ex('Убирает помехи на ножке 5.', 'Фильтр вывода CTRL.', 'Блокировка CV, 10 нФ по даташиту.'),
  },
  {
    ref: 'D1', value: 'LED red', package: 'THT 5 mm', qty: 1, factorySku: 'ZV-LED-R5', stock: 900, bin: 'D1-01', price: 3,
    params: { 'Прямое напряжение': '1,8 В', 'Макс. ток': '30 мА' },
    explain: ex('Светодиод. Длинная ножка — плюс.', 'Красный LED 5 мм.', 'V_F 1.8 В @ 20 мА.'),
  },
  {
    ref: 'BT1', value: '9V', package: 'Clip', qty: 1, factorySku: 'ZV-BAT-9V-CLIP', stock: 210, bin: 'E4-02', price: 15,
    params: { 'Разъём': 'Крона', 'Провод': '15 см' },
    explain: ex('Батарейка «Крона». Красный провод — плюс.', 'Колодка батареи 9 В.', '9 В, 500 мА·ч.'),
  },
];

const blinkerChecks: CheckResult[] = [
  {
    id: 'led-current', layer: 'rules', status: 'pass', title: 'Ток светодиода', partRefs: ['D1', 'R3'], value: '25mA', limit: '30mA',
    explain: ex('Светодиод не перегреется.', 'Ток в пределах даташита.', 'I_F 25 мА < 30 мА abs max.'),
  },
  {
    id: 'u1-heat', layer: 'rules', status: 'pass', title: 'Нагрев U1', partRefs: ['U1'], value: '41 °C', limit: '70 °C',
    explain: ex('Микросхема останется холодной.', 'Запас по температуре большой.', 'P_D ≈ 230 мВт, θ_JA 100 °C/Вт.'),
  },
  {
    id: 'mc-freq', layer: 'spice', status: 'pass', title: 'Частота мигания, Монте-Карло', partRefs: ['R1', 'R2', 'C1'], value: '497 / 500', limit: '0.9–1.1 Гц',
    explain: ex('Мигает примерно раз в секунду.', '497 из 500 прогонов в допуске.', 'MC 500 runs, R ±1 %, C ±20 %, 3 outliers.'),
  },
  { id: 'fw', layer: 'firmware', status: 'skipped', title: 'Прошивка', partRefs: [], explain: ex('Программа не нужна.', 'Нет микроконтроллера.', 'No MCU.') },
  {
    id: 'drc', layer: 'drc', status: 'pass', title: 'DRC платы', partRefs: [], value: '0', limit: '0',
    explain: ex('Плату можно заказывать.', 'Ошибок разводки нет.', '0 violations, 0.2 мм clearance.'),
  },
];

const humidityParts: Part[] = [
  {
    ref: 'U1', value: 'ESP32-DevKitC', package: 'Module', qty: 1, factorySku: 'ZV-MOD-ESP32', stock: 37, bin: 'M1-01', price: 420,
    datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf',
    params: { 'Питание': '5 В USB', 'Wi-Fi': '2,4 ГГц', 'ADC': '12 бит' },
    explain: ex('Мозг устройства: читает датчик и отправляет данные по Wi-Fi.', 'ESP32 с USB и стабилизатором.', 'ESP32-WROOM-32E, ADC1 для датчика.'),
  },
  {
    ref: 'U2', value: 'Capacitive v2.0', package: 'Module', qty: 1, factorySku: 'ZV-SNS-SOIL', stock: 0,
    params: { 'Питание': '3,3–5 В', 'Выход': 'аналоговый' },
    explain: ex('Щуп, который втыкают в землю.', 'Ёмкостный датчик влажности.', 'Analog 1.2–2.5 В.'),
  },
  {
    ref: 'U3', value: 'AHT20', package: 'Module', qty: 1, factorySku: 'ZV-SNS-AHT20', stock: 0,
    params: { 'Интерфейс': 'I²C', 'Точность': '±2 %RH' },
    explain: ex('Меряет влажность воздуха.', 'Датчик воздуха по I²C.', 'I²C 0x38.'),
  },
  {
    ref: 'R1', value: '10kΩ', package: 'Axial', qty: 2, factorySku: 'ZV-R-10K', stock: 2600, bin: 'B1-09', price: 1,
    params: { 'Допуск': '1 %' },
    explain: ex('Помогает проводам I²C работать.', 'Подтяжки SDA/SCL.', 'Pull-up 10k, t_r ≈ 400 нс.'),
  },
  {
    ref: 'C1', value: '100nF', package: 'Disc 5 mm', qty: 2, factorySku: 'ZV-C-100N', stock: 5000, bin: 'C1-01', price: 1,
    params: { 'Тип': 'керамика' },
    explain: ex('Сглаживает питание датчиков.', 'Развязка по питанию.', 'Decoupling X7R.'),
  },
];

const humidityChecks: CheckResult[] = [
  {
    id: 'adc-range', layer: 'rules', status: 'pass', title: 'Диапазон АЦП', partRefs: ['U1', 'U2'], value: '2.5V', limit: '3.1V',
    explain: ex('Датчик не повредит плату.', 'Сигнал в диапазоне АЦП.', 'V_max 2.5 В < 3.1 В ADC1 @ 11 dB.'),
  },
  {
    id: 'ripple', layer: 'spice', status: 'fail', title: 'Пульсации 3,3 В', partRefs: ['U1', 'C1'], value: '180mV', limit: '100mV',
    explain: ex('Питание «дрожит» при включении Wi-Fi — показания будут скакать.', 'Не хватает ёмкости на 3,3 В при передаче Wi-Fi.', 'TX burst 350 мА, нужно ≥ 22 мкФ рядом с U1.'),
    fixHint: 'Добавить 22 мкФ на 3,3 В',
  },
  {
    id: 'i2c-rise', layer: 'parasitics', status: 'warn', title: 'Фронт I²C', partRefs: ['R1', 'U3'], value: '820 нс', limit: '1000 нс',
    explain: ex('Провод до датчика длинноват, но работать будет.', 'Длинный провод: фронт близко к пределу.', 'C_bus ≈ 80 пФ, Standard-mode t_r ≤ 1 мкс.'),
  },
  {
    id: 'fw', layer: 'firmware', status: 'pass', title: 'Прошивка собирается', partRefs: ['U1'], value: '412 КБ', limit: '1,2 МБ',
    explain: ex('Программа готова.', 'Сборка без ошибок.', 'ESP-IDF 5.3, 412 KB / 1.2 MB.'),
  },
];

const weatherParts: Part[] = [
  humidityParts[0],
  {
    ref: 'U2', value: 'BME280', package: 'Module', qty: 1, factorySku: 'ZV-SNS-BME280', stock: 54, bin: 'M2-04', price: 260,
    params: { 'Интерфейс': 'I²C', 'Давление': '300–1100 гПа' },
    explain: ex('Меряет температуру, влажность и давление.', 'Датчик погоды по I²C.', 'I²C 0x76.'),
  },
  {
    ref: 'U3', value: 'SSD1306 0.96"', package: 'Module', qty: 1, factorySku: 'ZV-OLED-096', stock: 12, bin: 'M3-02', price: 190,
    params: { 'Разрешение': '128×64', 'Интерфейс': 'I²C' },
    explain: ex('Маленький экран.', 'OLED 128×64.', 'I²C 0x3C.'),
  },
  {
    ref: 'SW1', value: 'Tactile 6×6', package: 'THT', qty: 1, factorySku: 'ZV-SW-6X6', stock: 700, bin: 'S1-01', price: 2,
    params: { 'Ход': '0,25 мм' },
    explain: ex('Кнопка переключает экраны.', 'Кнопка на GPIO с подтяжкой.', 'GPIO0-safe, internal pull-up.'),
  },
];

const weatherChecks: CheckResult[] = [
  {
    id: 'i2c-addr', layer: 'rules', status: 'pass', title: 'Адреса I²C', partRefs: ['U2', 'U3'], value: '0x76, 0x3C',
    explain: ex('Датчик и экран не мешают друг другу.', 'Адреса не пересекаются.', 'No address conflicts.'),
  },
  {
    id: 'self-heat', layer: 'parasitics', status: 'warn', title: 'Самонагрев датчика', partRefs: ['U2', 'U1'], value: '+1.4 °C', limit: '+0.5 °C',
    explain: ex('Датчик стоит близко к мозгу и греется от него.', 'ESP32 греет BME280, вынесите датчик.', 'Thermal coupling ≈ 1.4 K, вынести ≥ 30 мм.'),
    fixHint: 'Вынести датчик дальше от ESP32',
  },
  {
    id: 'fw', layer: 'firmware', status: 'pass', title: 'Прошивка собирается', partRefs: ['U1'], value: '530 КБ', limit: '1,2 МБ',
    explain: ex('Программа готова.', 'Сборка без ошибок.', 'Arduino-ESP32 3.0.'),
  },
];

const count = (checks: CheckResult[]) => ({
  type: 'checks' as const,
  pass: checks.filter((c) => c.status === 'pass').length,
  warn: checks.filter((c) => c.status === 'warn').length,
  fail: checks.filter((c) => c.status === 'fail').length,
});

export const templates: Record<TemplateId, Template> = {
  blinker: {
    title: 'Мигалка на NE555',
    data: { parts: blinkerParts, checks: blinkerChecks, summary: { power: '9V', current: '28mA', board: [40, 30] } },
    script: [
      [400, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'running' }],
      [900, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'done', detail: 'Генератор на 555, один светодиод, ~1 Гц' }],
      [500, { type: 'question', id: 'q-power', text: 'От чего питать?', options: ['Батарейка 9 В', 'USB 5 В', 'Три АА'] }],
      [300, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'running' }],
      [1400, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'done', detail: '8 деталей, все в наличии. C2 осталось 8 шт.' }],
      [300, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'running' }],
      [1200, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'done' }],
      [200, { type: 'version', version: 1, changed: ['schematic'] }],
      [300, { type: 'step', id: 'spice', label: 'SPICE: 500 прогонов Монте-Карло', status: 'running' }],
      [1800, { type: 'step', id: 'spice', label: 'SPICE: 500 прогонов, 2 провала → меняю R2 на 1 %', status: 'done', detail: 'R2 68 кОм 5 % → 1 %. Повторный прогон: 497 из 500 в допуске.' }],
      [300, { type: 'step', id: 'bb', label: 'Раскладываю на макетке', status: 'running' }],
      [1200, { type: 'step', id: 'bb', label: 'Раскладываю на макетке', status: 'done', detail: '14 шагов сборки, 2 контрольные точки' }],
      [300, { type: 'step', id: 'pcb', label: 'Развожу плату и корпус', status: 'running' }],
      [1600, { type: 'step', id: 'pcb', label: 'Развожу плату и корпус', status: 'done', detail: 'Плата 40 × 30 мм, корпус 52 × 42 × 24 мм' }],
      [200, { type: 'version', version: 2, changed: ['schematic', 'breadboard', 'pcb', 'enclosure'] }],
      [100, count(blinkerChecks)],
      [300, { type: 'message', text: 'Готово. Мигает примерно раз в секунду, все детали на складе. Начните со вкладки «Макетка» — там пошаговая сборка.' }],
    ],
  },
  humidity: {
    title: 'Датчик влажности на ESP32',
    data: { parts: humidityParts, checks: humidityChecks, summary: { power: '5V', current: '120mA', board: [60, 40] } },
    script: [
      [400, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'running' }],
      [900, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'done' }],
      [500, { type: 'question', id: 'q-what', text: 'Что меряем?', options: ['Почву', 'Воздух', 'И то и другое'] }],
      [300, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'running' }],
      [1400, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'done', detail: '2 датчика закончились на складе — показываю как недостающие' }],
      [300, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'running' }],
      [1200, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'done' }],
      [200, { type: 'version', version: 1, changed: ['schematic'] }],
      [300, { type: 'step', id: 'fw', label: 'Собираю прошивку', status: 'running' }],
      [1500, { type: 'step', id: 'fw', label: 'Собираю прошивку', status: 'failed', detail: 'Таймаут сборщика' }],
      [200, { type: 'error', text: 'Сборщик прошивки не ответил.', retryable: true }],
      [300, { type: 'step', id: 'fw', label: 'Собираю прошивку', status: 'running' }],
      [1300, { type: 'step', id: 'fw', label: 'Собираю прошивку', status: 'done', detail: '412 КБ из 1,2 МБ' }],
      [300, { type: 'step', id: 'spice', label: 'SPICE: пульсации питания', status: 'running' }],
      [1500, { type: 'step', id: 'spice', label: 'SPICE: пульсации 180 мВ при 100 мВ допустимых', status: 'failed', detail: 'Нужна ёмкость 22 мкФ рядом с ESP32' }],
      [200, { type: 'version', version: 2, changed: ['schematic', 'firmware'] }],
      [100, count(humidityChecks)],
      [300, { type: 'message', text: 'Схема и прошивка готовы, но есть проблема с питанием — откройте «Проверки» и нажмите «Исправить».' }],
    ],
  },
  weather: {
    title: 'Метеостанция',
    data: { parts: weatherParts, checks: weatherChecks, summary: { power: '5V', current: '95mA', board: [70, 50] } },
    script: [
      [400, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'running' }],
      [900, { type: 'step', id: 'parse', label: 'Разбираю запрос', status: 'done' }],
      [300, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'running' }],
      [1400, { type: 'step', id: 'parts', label: 'Подбираю детали со склада', status: 'done', detail: '5 деталей, экранов осталось 12 шт.' }],
      [300, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'running' }],
      [1200, { type: 'step', id: 'sch', label: 'Рисую схему', status: 'done' }],
      [200, { type: 'version', version: 1, changed: ['schematic', 'firmware'] }],
      [100, count(weatherChecks)],
      [300, { type: 'message', text: 'Готово. Одно предупреждение: датчик стоит близко к ESP32 и будет завышать температуру.' }],
    ],
  },
};

export const followUp = (text: string, version: number): ScriptLine[] => [
  [300, { type: 'step', id: `edit-${version}`, label: 'Вношу изменения', status: 'running', detail: text }],
  [1500, { type: 'step', id: `edit-${version}`, label: 'Вношу изменения', status: 'done', detail: text }],
  [300, { type: 'step', id: `check-${version}`, label: 'Перепроверяю', status: 'running' }],
  [1200, { type: 'step', id: `check-${version}`, label: 'Перепроверяю', status: 'done' }],
  [200, { type: 'version', version, changed: ['schematic'] }],
  [300, { type: 'message', text: `Сделал: «${text}». Новая версия ${version}.` }],
];

export const finalVersion = (id: TemplateId) =>
  Math.max(...templates[id].script.map(([, e]) => (e.type === 'version' ? e.version : 0)));

export const checksEvent = (id: TemplateId) => count(templates[id].data.checks);

export function pickTemplate(prompt: string): TemplateId {
  const p = prompt.toLowerCase();
  if (/метео|weather|bme|давлен/.test(p)) return 'weather';
  if (/esp32|влажн|humid|moisture|почв|soil/.test(p)) return 'humidity';
  return 'blinker';
}
