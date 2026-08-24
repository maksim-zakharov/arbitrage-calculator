import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматирование числа с округлением до 2 знаков после запятой через Intl.NumberFormat */
const numberFormat2 = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(value: number): string {
  return numberFormat2.format(value);
}

export const moneyFormat = (
  money: number,
  currency: string = "RUB",
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 0,
) => {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency === "USDT" ? "USD" : currency,
    minimumFractionDigits,
    maximumFractionDigits,
  };
  const numberFormat = new Intl.NumberFormat("ru-RU", options);

  let result = numberFormat.format(money);
  if (currency === "USDT") {
    result = result.replace("$", "USDT");
  }

  return result;
};

function getThirdThursday(year, month) {
  let date = new Date(year, month - 1, 1);
  let thursdays = 0;
  while (thursdays < 3) {
    if (date.getDay() === 4) {
      // Thursday
      thursdays++;
    }
    if (thursdays < 3) {
      date.setDate(date.getDate() + 1);
    }
  }
  return date;
}

/**
 * Суффикс ближайшего квартального фьючерса FORTS (Si, EU, GOLD и т.д.).
 * Март H, июнь M, сентябрь U, декабрь Z; ролл после 3-го четверга месяца экспирации.
 */
export function getFuturesSuffix() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const quarterEnd = Math.ceil(month / 3) * 3;
  let expMonth = quarterEnd;
  let expYear = year;
  const expDate = getThirdThursday(expYear, expMonth);
  if (now > expDate) {
    expMonth += 3;
    if (expMonth > 12) {
      expMonth -= 12;
      expYear += 1;
    }
  }
  const letterMap = { 3: "H", 6: "M", 9: "U", 12: "Z" };
  const letter = letterMap[expMonth];
  const yearDigit = expYear % 10;
  return letter + yearDigit;
}

/** Месяцы поставок какао: февраль, май, август, ноябрь. */
const COCOA_CYCLE_MONTHS = [2, 5, 8, 11] as const;

/** Буквы FORTS для цикла какао (8=Q, 11=X, 2=G, 5=K). */
const COCOA_MONTH_LETTER: Record<(typeof COCOA_CYCLE_MONTHS)[number], string> =
  {
    2: "G",
    5: "K",
    8: "Q",
    11: "X",
  };

/**
 * N-й понедельник месяца (локальная дата, 1-й день месяца = 1).
 */
function getNthMonday(year: number, month: number, n: number): Date {
  const date = new Date(year, month - 1, 1);
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }
  date.setDate(date.getDate() + (n - 1) * 7);
  return date;
}

/**
 * Сравнивает календарные дни без учёта времени.
 */
function isSameOrBeforeDay(left: Date, right: Date): boolean {
  const leftUtc = Date.UTC(left.getFullYear(), left.getMonth(), left.getDate());
  const rightUtc = Date.UTC(
    right.getFullYear(),
    right.getMonth(),
    right.getDate(),
  );
  return leftUtc <= rightUtc;
}

/**
 * ISS-код ближайшего фьючерса какао (`CC` + месяц + год).
 * Цикл: август Q, ноябрь X, февраль G, май K (8 → 11 → 2 → 5 → 8).
 * Ролл после 4-го понедельника месяца поставки (последний день обращения).
 */
export function getCocoaFuturesSecid(now: Date = new Date()): string {
  const year = now.getFullYear();
  for (
    let contractYear = year - 1;
    contractYear <= year + 1;
    contractYear += 1
  ) {
    for (const month of COCOA_CYCLE_MONTHS) {
      const lastTrade = getNthMonday(contractYear, month, 4);
      if (isSameOrBeforeDay(now, lastTrade)) {
        return `CC${COCOA_MONTH_LETTER[month]}${contractYear % 10}`;
      }
    }
  }

  return `CCQ${(year + 1) % 10}`;
}

interface SortableInstrument {
  name: string;
}

interface SortableGroup {
  id: string;
  instruments: SortableInstrument[];
}

export interface StoredInstrument {
  /** Имя инструмента */
  name: string;
  /** Текущее значение лотности */
  value: number;
  /** Коэффициент пересчёта относительно базовой ноги */
  ratio: number;
}

export interface StoredGroup {
  /** Идентификатор группы (например ED/EURUSD_xp) */
  id: string;
  instruments: StoredInstrument[];
}

function cloneGroup<T extends StoredGroup>(group: T): T {
  return {
    ...group,
    instruments: group.instruments.map((instrument) => ({ ...instrument })),
  };
}

function mergeInstruments(
  saved: StoredInstrument[] | undefined,
  defaults: StoredInstrument[],
): StoredInstrument[] {
  if (!Array.isArray(saved)) {
    return defaults.map((instrument) => ({ ...instrument }));
  }

  const savedByName = new Map(
    saved.map((instrument) => [instrument.name, instrument]),
  );

  return defaults.map((defaultInstrument) => {
    const savedInstrument = savedByName.get(defaultInstrument.name);
    if (!savedInstrument) {
      return { ...defaultInstrument };
    }

    return {
      name: defaultInstrument.name,
      value: savedInstrument.value,
      ratio: savedInstrument.ratio,
    };
  });
}

/**
 * Загружает группы из localStorage и дополняет их новыми парами/тройками из дефолтного конфига.
 * Сохранённые значения пользователя не теряются; удалённые из конфига группы не возвращаются.
 */
export function loadMergedGroups<T extends StoredGroup>(
  storageKey: string,
  defaults: T[],
): T[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return defaults.map(cloneGroup);
  }

  let saved: T[];
  try {
    saved = JSON.parse(raw);
  } catch {
    return defaults.map(cloneGroup);
  }

  if (!Array.isArray(saved)) {
    return defaults.map(cloneGroup);
  }

  const savedById = new Map(
    saved
      .filter((group) => group && typeof group.id === "string")
      .map((group) => [group.id, group]),
  );

  return defaults.map((defaultGroup) => {
    const savedGroup = savedById.get(defaultGroup.id);
    if (!savedGroup) {
      return cloneGroup(defaultGroup);
    }

    return {
      ...defaultGroup,
      instruments: mergeInstruments(
        savedGroup.instruments,
        defaultGroup.instruments,
      ),
    };
  });
}

/**
 * Унифицированная сортировка карточек по первой (MOEX) ноге.
 * Используется во всех вкладках калькуляторов для одинакового порядка.
 */
export function sortGroupsByMoexLeg<T extends SortableGroup>(groups: T[]): T[] {
  return [...groups].sort((leftGroup, rightGroup) => {
    const leftMoexLeg = leftGroup.instruments[0]?.name ?? "";
    const rightMoexLeg = rightGroup.instruments[0]?.name ?? "";
    const byMoexLeg = leftMoexLeg.localeCompare(rightMoexLeg, "ru-RU");
    if (byMoexLeg !== 0) {
      return byMoexLeg;
    }
    return leftGroup.id.localeCompare(rightGroup.id, "ru-RU");
  });
}

/**
 * Фильтрует группы по id и именам инструментов (без учёта регистра).
 */
export function filterGroupsBySearch<T extends SortableGroup>(
  groups: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return groups;
  }

  return groups.filter((group) => {
    const searchable = [
      group.id,
      ...group.instruments.map((instrument) => instrument.name),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalized);
  });
}
