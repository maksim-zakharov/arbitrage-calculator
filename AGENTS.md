# AGENTS.md — контекст проекта для LLM

Документ описывает проект **arbitrage-calculator** для передачи контекста при дальнейшей разработке.

---

## 1. Назначение проекта

**arbitrage-calculator** — веб-приложение (SPA) для расчёта **лотности и соотношений по ногам** в арбитражных связках между **MOEX (фьючерсы)** и **внешними площадками** (Форекс с суффиксом `_xp`, криптобиржи и т.д.).

Пользователь задаёт объёмы по одной ноге (или базовому инструменту в тройке), остальные пересчитываются по заданным **ratio** (коэффициентам). Часть ratio обновляется по котировкам MOEX (евро, доллар, юань, золото). Есть возможность задать **перевес на MOEX** для всех пар, где присутствует нога с Форексом (`_xp`): глобальный ползунок добавляет к отображаемым значениям MOEX-ног заданный процент.

---

## 2. Стек и зависимости

| Технология | Назначение |
|------------|------------|
| **React** ^18.2 | UI |
| **TypeScript** | Язык разработки |
| **Vite** | Сборка и dev-сервер |
| **Redux Toolkit** + **RTK Query** | Состояние и запросы (котировки) |
| **React Router** | Роутинг (если используется) |
| **Tailwind CSS** | Стили |
| **Radix UI** (Slider, слоты) | Компоненты (ползунки и т.д.) |

Сборка: `npm run build`. Запуск: `npm run start` (Vite).

---

## 3. Структура проекта

```
arbitrage-calculator/
├── src/
│   ├── index.tsx              # Точка входа, рендер в #root
│   ├── App.tsx                # Корневой компонент (ThemeProvider, ArbitrageCalculator)
│   ├── ArbitrageCalculator.tsx # Основной экран: котировки, пары/тройки, ползунки
│   ├── api.ts                 # RTK Query: ЦБ РФ (getRuRate), MOEX (getMoexSecurity)
│   ├── store.ts               # Redux store + api reducer
│   ├── utils.ts               # moneyFormat, getFuturesSuffix (код экспирации)
│   ├── components/
│   │   ├── ui/                # UI-кит: button, card, input, slider, typography, alert и т.д.
│   │   └── theme-provider.tsx # Тема (dark/light)
│   └── index.css              # Глобальные стили
├── package.json
├── vite.config.ts
├── README.md
└── AGENTS.md                  # Этот файл
```

---

## 4. Функционал и страницы

### 4.1. Одна страница — калькулятор

- **Экран**: один экран без отдельного роутинга: заголовок «Калькулятор лотности для арбитража», блок котировок, кнопка «Обновить», опрос (Alert), сетка карточек пар и троек.

### 4.2. Котировки (верхняя полоса)

- Отображаются курсы с MOEX (через `getMoexSecurity`): EUR, USD, CNY, UCNY, EURUSD, EURCNY, GOLD.
- Используются для пересчёта ratio в тройках (SI/CNY/USDCNH_xp, EU/SI/EURUSD_xp, EU/CNY/EURCNH_xp, GLDRUBF/SI/GOLD).

### 4.3. Пары и тройки

- **Пары** (type: `'pair'`): два инструмента с полями `name`, `value`, `ratio`. Примеры: ED/EURUSD_xp, UCNY/USDCNH_xp, GOLD/XAUUSD_xp, GOLD/BYBIT:PAXGUSDT, SILV/XAGUSD_xp, PLT/XPTUSD_xp, PLD/XPDUSD_xp, BTC/BTCUSD_xp, ETH/ETHUSD_xp.
- **Тройки** (type: `'triple'`): три инструмента. Примеры: SI/CNY/USDCNH_xp, EU/SI/EURUSD_xp, EU/CNY/EURCNH_xp, GLDRUBF/SI/GOLD.
- У каждой группы есть `id` (строка типа `SILV/XAGUSD_xp`) и массив `instruments` с `name`, `value`, `ratio`.
- Первый инструмент в группе считается базовым: при изменении его `value` остальные пересчитываются по формулам `value_i = baseValue * (ratio_i / baseRatio)`.

### 4.4. Перевес на MOEX (ползунок)

- Отдельный глобальный ползунок «Перевес на MOEX, %» (например 0–50% или 0–100%).
- Действует **только для групп, в которых есть хотя бы один инструмент с суффиксом `_xp`** (Форекс-нога). Для групп без `_xp` (например GOLD/BYBIT:PAXGUSDT) ползунок не влияет.
- Логика: для таких групп у **MOEX-ног** (все инструменты без суффикса `_xp`) отображаемое значение = сохранённое значение × (1 + процент/100). Ноги `_xp` отображаются без изменения. При вводе пользователем значения MOEX-ноги сохраняется обратное преобразование: сохранённое = введённое / (1 + процент/100).

Пример: пара SILV/XAGUSD_xp, соотношение 60 / 0.12, ползунок 10% → отображается 66 / 0.12 (перевес на MOEX).

### 4.5. Сохранение состояния

- Текущие группы (и значения инструментов) сохраняются в `localStorage` под ключом `arbitrageGroups` с задержкой 500 мс после изменений.
- При загрузке страницы данные подставляются из `localStorage`, при отсутствии — используются конфиги `initialPairs` и `initialTriples` из кода.

### 4.6. Обновление ratio по котировкам

- В `useEffect` в `ArbitrageCalculator` по данным MOEX пересчитываются ratio для троек (SI/CNY/USDCNH_xp, EU/SI/EURUSD_xp, EU/CNY/EURCNH_xp, GLDRUBF/SI/GOLD), после чего пересчитываются `value` всех инструментов в этих группах от базы.

---

## 5. Важные типы и константы

- Группа: `{ id: string, type: 'pair' | 'triple', instruments: Array<{ name: string, value: number, ratio: number }> }`.
- Суффикс Форекс: `_xp` в `name` инструмента (например `XAGUSD_xp`, `EURUSD_xp`).
- Код экспирации фьючерсов: `getFuturesSuffix()` возвращает строку вида `H5`, `M5`, `U5`, `Z5` для запросов к MOEX.

---

## 6. Расширение и правки

- Добавление новой пары/тройки: расширить массивы `initialPairs` / `initialTriples` в `ArbitrageCalculator.tsx`.
- Изменение логики перевеса на MOEX: проверка по `instruments.some(i => i.name.endsWith('_xp'))`, применение множителя только к отображаемым и сохраняемым значениям MOEX-ног в компонентах `PairCalculator` и `TripleCalculator`.
- Новые котировки или источники: добавить endpoint в `api.ts` и подписаться на данные в `ArbitrageCalculator.tsx`.
