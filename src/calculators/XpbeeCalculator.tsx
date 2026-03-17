import React, { useEffect, useState } from 'react';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { TypographyH4 } from '../components/ui/typography';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatNumber } from '../utils';

/** Маппинг тикеров MOEX на ключи иконок (Tinkoff CDN). */
const moexIconMap: Record<string, string> = {
  GOLD: 'GoldFut2',
  GLDRUBF: 'GoldFut2',
  SILV: 'SilverFut',
  PLD: 'Palladium',
  PLT: 'Platinum',
  UCNY: 'USDCNY',
  CNY: 'CNYRUR',
  SI: 'USD1',
  USD: 'USD1',
  ED: 'EURUSD3',
  EURUSD: 'EURUSD3',
  EUR: 'EUR1',
  EU: 'EUR1',
  RUB: 'ruble',
  ETH: 'Ethereum',
  BTC: 'BITOK',
  BR: 'OilFut',
  NG: 'NG',
  COPPER: 'Co',
  NASD: 'NASDAQ100',
};

const bybitMap: Record<string, string> = {
  PAXGUSDT:
    'url("//bybit.com/bycsi-root/fop/a8286509-8373-4307-852e-8cbacca2c299.svg")',
};

const tinkoffIconUrl = (key: string) =>
  `url("//invest-brands.cdn-tinkoff.ru/${key}x160.png")`;

export const AlorLabel = ({ symbol }: { symbol: string }) => {
  if (symbol.includes('/')) {
    const [left, right] = symbol.split('/');
    const keyLeft = moexIconMap[left];
    return (
      <div className="flex gap-1 items-center flex-wrap">
        {keyLeft && (
          <div className="img" style={{ backgroundImage: tinkoffIconUrl(keyLeft) }} />
        )}
        <span>{left}</span>
        <span className="text-muted-foreground">/</span>
        <span>{right}</span>
      </div>
    );
  }

  const symbolParts = symbol.includes('-') ? symbol.split('-') : [symbol];
  const key = moexIconMap[symbolParts[0]];
  let backgroundImage = key ? tinkoffIconUrl(key) : undefined;
  if (symbolParts[1]?.includes('BYBIT')) {
    const [, ticker] = symbolParts[1].split(':');
    backgroundImage = bybitMap[ticker];
  }

  return (
    <div className="flex gap-1 items-center">
      {backgroundImage && <div className="img" style={{ backgroundImage }} />}
      {symbol}
    </div>
  );
};

interface Instrument {
  name: string;
  value: number;
  ratio: number;
}

interface CalculatorGroup {
  id: string;
  type: 'pair' | 'triple';
  instruments: Instrument[];
}

const initialPairs: CalculatorGroup[] = [
  {
    id: 'ED/EURUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'ED', value: 1, ratio: 1 },
      { name: 'EURUSD_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'UCNY/USDCNH_xp',
    type: 'pair',
    instruments: [
      { name: 'UCNY', value: 1, ratio: 1 },
      { name: 'USDCNH_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'GOLD/XAUUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'GOLD', value: 1, ratio: 1 },
      { name: 'XAUUSD_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'GOLD/BYBIT:PAXGUSDT',
    type: 'pair',
    instruments: [
      { name: 'GOLD', value: 1, ratio: 1 },
      { name: 'BYBIT:PAXGUSDT', value: 1, ratio: 1 },
    ],
  },
  {
    id: 'SILV/XAGUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'SILV', value: 5, ratio: 1 },
      { name: 'XAGUSD_xp', value: 0.01, ratio: 0.002 },
    ],
  },
  {
    id: 'PLT/XPTUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'PLT', value: 1, ratio: 1 },
      { name: 'XPTUSD_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'PLD/XPDUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'PLD', value: 1, ratio: 1 },
      { name: 'XPDUSD_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'BTC/BTCUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'BTC', value: 10, ratio: 10 },
      { name: 'BTCUSD_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'ETH/ETHUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'ETH', value: 100, ratio: 1 },
      { name: 'ETHUSD_xp', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'BR/BRNUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'BR', value: 10, ratio: 1 },
      { name: 'BRNUSD_xp', value: 0.1, ratio: 0.01 },
    ],
  },
  {
    id: 'NG/NGUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'NG', value: 100, ratio: 1 },
      { name: 'NGUSD_xp', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'NASD/NDXUSD_xp',
    type: 'pair',
    instruments: [
      { name: 'NASD', value: 1000, ratio: 1 },
      { name: 'NDXUSD_xp', value: 1, ratio: 0.001 },
    ],
  },
];

const initialTriples: CalculatorGroup[] = [
  {
    id: 'SI/CNY/USDCNH_xp',
    type: 'triple',
    instruments: [
      { name: 'SI', value: 24, ratio: 1 },
      { name: 'CNY', value: 170, ratio: 7.08 },
      { name: 'USDCNH_xp', value: 0.24, ratio: 0.01 },
    ],
  },
  {
    id: 'EU/SI/EURUSD_xp',
    type: 'triple',
    instruments: [
      { name: 'EU', value: 20, ratio: 1 },
      { name: 'SI', value: 23, ratio: 1.15 },
      { name: 'EURUSD_xp', value: 0.2, ratio: 0.01 },
    ],
  },
  {
    id: 'EU/CNY/EURCNH_xp',
    type: 'triple',
    instruments: [
      { name: 'EU', value: 1, ratio: 1 },
      { name: 'CNY', value: 8, ratio: 8 },
      { name: 'EURCNH_xp', value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: 'GLDRUBF/SI/GOLD',
    type: 'triple',
    instruments: [
      { name: 'GLDRUBF', value: 31.1, ratio: 1 },
      { name: 'SI', value: 0, ratio: 0 },
      { name: 'GOLD', value: 1, ratio: 1 / 31.1 },
    ],
  },
];

const groupHasForex = (group: { instruments: Instrument[] }): boolean =>
  group.instruments.some((i) => i.name.endsWith('_xp'));

const getDisplayValue = (
  inst: Instrument,
  group: { instruments: Instrument[] },
  moexBiasPercent: number
): number => {
  if (!groupHasForex(group)) return inst.value;
  if (inst.name.endsWith('_xp')) return inst.value;
  return inst.value * (1 + moexBiasPercent / 100);
};

const toStoredValue = (
  displayed: number,
  inst: Instrument,
  group: { instruments: Instrument[] },
  moexBiasPercent: number
): number => {
  if (!groupHasForex(group) || inst.name.endsWith('_xp')) return displayed;
  return displayed / (1 + moexBiasPercent / 100);
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface PairCalculatorProps {
  group: CalculatorGroup;
  onUpdate: (groupId: string, instruments: Instrument[]) => void;
  moexBiasPercent?: number;
}

const PairCalculator = ({
  group,
  onUpdate,
  moexBiasPercent = 0,
}: PairCalculatorProps) => {
  const [instruments, setInstruments] = useState(group.instruments);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const hasForex = groupHasForex(group);

  const handleChange = (index: number, val: string | number) => {
    const value = round2(parseFloat(String(val)));
    if (Number.isNaN(value) || value < 0) return;

    const newInstruments = [...instruments];
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
      formatNumber(getDisplayValue(instruments[index], group, moexBiasPercent))
    );
  };

  const handleBlur = (index: number) => {
    if (focusedIndex === index) {
      const normalized = editingValue.replace(',', '.');
      const parsed = parseFloat(normalized);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        const stored = toStoredValue(
          parsed,
          instruments[index],
          group,
          moexBiasPercent
        );
        handleChange(index, round2(stored));
      }
      setFocusedIndex(null);
    }
  };

  const baseDisplayValue = getDisplayValue(instruments[0], group, moexBiasPercent);
  const handleSliderChange = (displayedValues: number[]) => {
    const stored = hasForex
      ? displayedValues[0] / (1 + moexBiasPercent / 100)
      : displayedValues[0];
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
        <div className="grid grid-cols-2 gap-4 mb-2">
          {instruments.map((inst, index) => (
            <label key={index}>
              {inst.name}:
              <Input
                type="text"
                inputMode="decimal"
                value={
                  focusedIndex === index
                    ? editingValue
                    : formatNumber(
                        getDisplayValue(inst, group, moexBiasPercent)
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
          onValueChange={(val) => handleSliderChange(val)}
          max={500}
          step={1}
        />
      </CardContent>
    </Card>
  );
};

interface TripleCalculatorProps {
  group: CalculatorGroup;
  onUpdate: (groupId: string, instruments: Instrument[]) => void;
  moexBiasPercent?: number;
}

const TripleCalculator = ({
  group,
  onUpdate,
  moexBiasPercent = 0,
}: TripleCalculatorProps) => {
  const [instruments, setInstruments] = useState(group.instruments);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const hasForex = groupHasForex(group);

  const handleChange = (index: number, val: string | number) => {
    const value = round2(parseFloat(String(val)));
    if (Number.isNaN(value) || value < 0) return;

    const newInstruments = [...instruments];
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
      formatNumber(getDisplayValue(instruments[index], group, moexBiasPercent))
    );
  };

  const handleBlur = (index: number) => {
    if (focusedIndex === index) {
      const normalized = editingValue.replace(',', '.');
      const parsed = parseFloat(normalized);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        const stored = toStoredValue(
          parsed,
          instruments[index],
          group,
          moexBiasPercent
        );
        handleChange(index, round2(stored));
      }
      setFocusedIndex(null);
    }
  };

  const baseDisplayValue = getDisplayValue(instruments[0], group, moexBiasPercent);
  const handleSliderChange = (displayedValues: number[]) => {
    const stored = hasForex
      ? displayedValues[0] / (1 + moexBiasPercent / 100)
      : displayedValues[0];
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
        <div className="grid grid-cols-3 gap-4 mt-2 mb-2">
          {instruments.map((inst, index) => (
            <label key={index}>
              {inst.name}:
              <Input
                type="text"
                inputMode="decimal"
                value={
                  focusedIndex === index
                    ? editingValue
                    : formatNumber(
                        getDisplayValue(inst, group, moexBiasPercent)
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
          onValueChange={(val) => handleSliderChange(val)}
          max={500}
          step={1}
        />
      </CardContent>
    </Card>
  );
};

export interface XpbeeRates {
  EURRate?: number | null;
  USDRate?: number | null;
  CNYRate?: number | null;
  GOLDRate?: number | null;
  SilverRate?: number | null;
}

interface XpbeeCalculatorProps {
  rates: XpbeeRates;
  moexBiasPercent: number;
}

export function XpbeeCalculator({ rates, moexBiasPercent }: XpbeeCalculatorProps) {
  const { EURRate, USDRate, CNYRate, GOLDRate, SilverRate } = rates;

  const [groups, setGroups] = useState<CalculatorGroup[]>(() => {
    const saved = localStorage.getItem('arbitrageGroups');
    return saved ? JSON.parse(saved) : [...initialPairs, ...initialTriples];
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
    const hasRates =
      USDRate != null && CNYRate != null && EURRate != null;
    const hasGold = GOLDRate != null;
    const hasSilver = SilverRate != null;
    if (!hasRates && !hasGold && !hasSilver) return;

    const eurUsd = hasRates ? EURRate! / USDRate! : null;
    const usdCny = hasRates ? USDRate! / CNYRate! / 1000 : null;
    const eurCny = hasRates ? EURRate! / CNYRate! / 1000 : null;

    setGroups((prev) =>
      prev.map((group) => {
        let newInstruments = [...group.instruments];
        let updated = false;

        if (group.id === 'SI/CNY/USDCNH_xp' && usdCny != null) {
          newInstruments[1].ratio = usdCny;
          updated = true;
        } else if (group.id === 'EU/SI/EURUSD_xp' && eurUsd != null) {
          newInstruments[1].ratio = eurUsd;
          updated = true;
        } else if (group.id === 'EU/CNY/EURCNH_xp' && eurCny != null) {
          newInstruments[1].ratio = eurCny;
          updated = true;
        } else if (
          group.id === 'GLDRUBF/SI/GOLD' &&
          GOLDRate != null
        ) {
          newInstruments[1].ratio = GOLDRate / 1000 / 31.1;
          updated = true;
        }

        if (updated) {
          const baseValue = newInstruments[0].value;
          const baseRatio = newInstruments[0].ratio;
          newInstruments.forEach((inst, i) => {
            if (i !== 0) {
              inst.value = round2(baseValue * (inst.ratio / baseRatio));
            }
          });
        }

        return updated ? { ...group, instruments: newInstruments } : group;
      })
    );
  }, [EURRate, USDRate, CNYRate, GOLDRate, SilverRate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('arbitrageGroups', JSON.stringify(groups));
    }, 500);
    return () => clearTimeout(timeout);
  }, [groups]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {groups.map((group) =>
        group.type === 'pair' ? (
          <PairCalculator
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            moexBiasPercent={moexBiasPercent}
          />
        ) : (
          <TripleCalculator
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            moexBiasPercent={moexBiasPercent}
          />
        )
      )}
    </div>
  );
}
