# Lenz

Описал устройство словами → схема, макетка с инструкцией, плата, корпус. Полное ТЗ: [docs/SPEC.md](docs/SPEC.md). Работаем по этапам из раздела 12, по одному за раз.

- Стиль — из CoShip (`../../CoShip/apps/web`): токены в `src/styles.css`, Manrope, пилюли-кнопки. Частицы за курсором на лендинге (`src/particles.tsx`) не убирать.
- Все цвета — CSS-переменные из `src/styles.css`, в Tailwind доступны как `bg-surface`, `text-muted`, `border-line` и т. д.
- Все тексты — через i18n (`src/i18n.ts`), ru и en.
- Фронтенд на моках MSW (`src/mocks`), типы данных — `src/types.ts` (раздел 11 ТЗ).
- Статус всегда иконка + текст, не только цвет.

```sh
npm run dev     # http://127.0.0.1:5173
npm run build
npm test
```
