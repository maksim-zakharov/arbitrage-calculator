import React, { useEffect, useMemo, useState } from 'react';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { TypographyH4 } from '../components/ui/typography';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatNumber, filterGroupsBySearch, loadMergedGroups, sortGroupsByMoexLeg } from '../utils';
import { AlorLabel } from './XpbeeCalculator';

interface Instrument {
  name: string;
  value: number;
  ratio: number;
}

interface HyperliquidPair {
  id: string;
  type: 'pair';
  instruments: Instrument[];
}

const HYPERLIQUID_STORAGE_KEY = 'hyperliquidGroups';

/** Маппинг старых id групп (до перехода на префикс xyz:). */
const LEGACY_GROUP_ID_MAP: Record<string, string> = {
  'BR/BRENTOIL-USDC': 'BR/xyz:BRENTOIL',
  'NG/NATGAS-USDC': 'NG/xyz:NATGAS',
  'ED/EURUSD-USDC': 'ED/xyz:EURUSD',
  'GOLD/GOLD-USDC': 'GOLD/xyz:GOLD',
  'SILV/SILVER-USDC': 'SILV/xyz:SILVER',
  'PLD/PALLADIUM-USDC': 'PLD/xyz:PALLADIUM',
  'PLT/PLATINUM-USDC': 'PLT/xyz:PLATINUM',
  'NASD/XYZ100': 'NASD/xyz:XYZ100',
};

/** Маппинг старых имён ног Hyperliquid. */
const LEGACY_INSTRUMENT_NAME_MAP: Record<string, string> = {
  'BRENTOIL-USDC': 'xyz:BRENTOIL',
  'NATGAS-USDC': 'xyz:NATGAS',
  'EURUSD-USDC': 'xyz:EURUSD',
  'GOLD-USDC': 'xyz:GOLD',
  'SILVER-USDC': 'xyz:SILVER',
  'PALLADIUM-USDC': 'xyz:PALLADIUM',
  'PLATINUM-USDC': 'xyz:PLATINUM',
  XYZ100: 'xyz:XYZ100',
};

const initialPairs: HyperliquidPair[] = [
  {
    id: 'BR/xyz:BRENTOIL',
    type: 'pair',
    instruments: [
      { name: 'BR', value: 1, ratio: 1 },
      { name: 'xyz:BRENTOIL', value: 10, ratio: 10 },
    ],
  },
  {
    id: 'NG/xyz:NATGAS',
    type: 'pair',
    instruments: [
      { name: 'NG', value: 1, ratio: 1 },
      { name: 'xyz:NATGAS', value: 100, ratio: 100 },
    ],
  },
  {
    id: 'ED/xyz:EURUSD',
    type: 'pair',
    instruments: [
      { name: 'ED', value: 1, ratio: 1 },
      { name: 'xyz:EURUSD', value: 1000, ratio: 1000 },
    ],
  },
  {
    id: 'GOLD/xyz:GOLD',
    type: 'pair',
    instruments: [
      { name: 'GOLD', value: 1, ratio: 1 },
      { name: 'xyz:GOLD', value: 1, ratio: 10 },
    ],
  },
  {
    id: 'SILV/xyz:SILVER',
    type: 'pair',
    instruments: [
      { name: 'SILV', value: 1, ratio: 1 },
      { name: 'xyz:SILVER', value: 10, ratio: 10 },
    ],
  },
  {
    id: 'PLD/xyz:PALLADIUM',
    type: 'pair',
    instruments: [
      { name: 'PLD', value: 1, ratio: 1 },
      { name: 'xyz:PALLADIUM', value: 1, ratio: 1 },
    ],
  },
  {
    id: 'PLT/xyz:PLATINUM',
    type: 'pair',
    instruments: [
      { name: 'PLT', value: 1, ratio: 1 },
      { name: 'xyz:PLATINUM', value: 1, ratio: 1 },
    ],
  },
  {
    id: 'NASD/xyz:XYZ100',
    type: 'pair',
    instruments: [
      { name: 'NASD', value: 100, ratio: 1 },
      { name: 'xyz:XYZ100', value: 1, ratio: 0.01 },
    ],
  },
];

function migrateHyperliquidStorage(): void {
  const raw = localStorage.getItem(HYPERLIQUID_STORAGE_KEY);
  if (!raw) return;

  try {
    const groups = JSON.parse(raw);
    if (!Array.isArray(groups)) return;

    const migrated = groups.map((group: HyperliquidPair) => ({
      ...group,
      id: LEGACY_GROUP_ID_MAP[group.id] ?? group.id,
      instruments: group.instruments.map((instrument) => ({
        ...instrument,
        name: LEGACY_INSTRUMENT_NAME_MAP[instrument.name] ?? instrument.name,
      })),
    }));

    localStorage.setItem(HYPERLIQUID_STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    /* ignore corrupted storage */
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Отображаемое значение: для MOEX-ноги (index 0) учитываем перевес. */
const getDisplayValue = (
  inst: Instrument,
  index: number,
  moexBiasPercent: number
): number =>
  index === 0 ? inst.value * (1 + moexBiasPercent / 100) : inst.value;

/** В сохраняемое значение: из введённого пересчитываем MOEX-ногу обратно. */
const toStoredValue = (
  displayed: number,
  index: number,
  moexBiasPercent: number
): number =>
  index === 0 ? displayed / (1 + moexBiasPercent / 100) : displayed;

interface PairCardProps {
  group: HyperliquidPair;
  onUpdate: (groupId: string, instruments: Instrument[]) => void;
  moexBiasPercent: number;
}

function PairCard({ group, onUpdate, moexBiasPercent }: PairCardProps) {
  const [instruments, setInstruments] = useState(group.instruments);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleChange = (index: number, val: string | number) => {
    const value = round2(parseFloat(String(val)));
    if (Number.isNaN(value) || value < 0) return;

    const newInstruments = instruments.map((inst) => ({ ...inst }));
    newInstruments[index].value = value;

    const baseValue = value;
    const baseRatio = newInstruments[index].ratio;
    newInstruments.forEach((inst, i) => {
      if (i !== index) {
        inst.value = round2(baseValue * (inst.ratio / baseRatio));
      }
    });

    setInstruments(newInstruments);
    onUpdate(group.id, newInstruments);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    setEditingValue(
      formatNumber(getDisplayValue(instruments[index], index, moexBiasPercent))
    );
  };

  const handleBlur = (index: number) => {
    if (focusedIndex === index) {
      const normalized = editingValue.replace(',', '.');
      const parsed = parseFloat(normalized);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        const stored = toStoredValue(parsed, index, moexBiasPercent);
        handleChange(index, round2(stored));
      }
      setFocusedIndex(null);
    }
  };

  const baseDisplayValue = getDisplayValue(
    instruments[0],
    0,
    moexBiasPercent
  );
  const handleSliderChange = (values: number[]) => {
    const stored = values[0] / (1 + moexBiasPercent / 100);
    handleChange(0, round2(stored));
  };

  return (
    <Card className="gap-1 p-2">
      <CardHeader className="pl-2 pt-3">
        <CardTitle>
          <TypographyH4>
            <AlorLabel symbol={group.id} />
          </TypographyH4>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2">
          {instruments.map((inst, index) => (
            <label key={index} className="flex flex-col gap-2 text-sm">
              <span className="font-semibold">{inst.name}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={
                  focusedIndex === index
                    ? editingValue
                    : formatNumber(
                        getDisplayValue(inst, index, moexBiasPercent)
                      )
                }
                onChange={(e) =>
                  focusedIndex === index && setEditingValue(e.target.value)
                }
                onFocus={() => handleFocus(index)}
                onBlur={() => handleBlur(index)}
              />
            </label>
          ))}
        </div>
        <Slider
          className="pt-2 pb-2"
          value={[baseDisplayValue]}
          onValueChange={handleSliderChange}
          max={500}
          step={1}
        />
      </CardContent>
    </Card>
  );
}

interface HyperliquidCalculatorProps {
  /** Перевес на MOEX, % (отображаемое значение MOEX-ноги = хранимое × (1 + moexBiasPercent/100)). */
  moexBiasPercent: number;
  searchQuery: string;
}

/**
 * Калькулятор лотности для арбитража MOEX / Hyperliquid (пары xyz:).
 */
export function HyperliquidCalculator({
  moexBiasPercent,
  searchQuery,
}: HyperliquidCalculatorProps) {
  const [groups, setGroups] = useState<HyperliquidPair[]>(() => {
    migrateHyperliquidStorage();
    return loadMergedGroups(HYPERLIQUID_STORAGE_KEY, [...initialPairs]);
  });

  const updateGroup = (
    groupId: string,
    updatedInstruments: Instrument[]
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, instruments: updatedInstruments }
          : group
      )
    );
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(HYPERLIQUID_STORAGE_KEY, JSON.stringify(groups));
    }, 500);
    return () => clearTimeout(timeout);
  }, [groups]);

  const visibleGroups = useMemo(
    () => filterGroupsBySearch(sortGroupsByMoexLeg(groups), searchQuery),
    [groups, searchQuery]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        {visibleGroups.map((group) => (
          <PairCard
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            moexBiasPercent={moexBiasPercent}
          />
        ))}
    </div>
  );
}
