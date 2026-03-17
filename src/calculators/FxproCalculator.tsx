import React, { useEffect, useState } from 'react';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { TypographyH4 } from '../components/ui/typography';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatNumber } from '../utils';
import { AlorLabel } from './XpbeeCalculator';

interface Instrument {
  name: string;
  value: number;
  ratio: number;
}

interface FxproPair {
  id: string;
  type: 'pair';
  instruments: Instrument[];
}

const FXPRO_STORAGE_KEY = 'fxproGroups';

const initialPairs: FxproPair[] = [
  {
    id: 'BR/BRENT',
    type: 'pair',
    instruments: [
      { name: 'BR', value: 100, ratio: 1 },
      { name: 'BRENT', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'NG/NAT.GAS',
    type: 'pair',
    instruments: [
      { name: 'NG', value: 100, ratio: 1 },
      { name: 'NAT.GAS', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'GOLD/XAUUSD',
    type: 'pair',
    instruments: [
      { name: 'GOLD', value: 100, ratio: 1 },
      { name: 'XAUUSD', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'SILV/XAGUSD',
    type: 'pair',
    instruments: [
      { name: 'SILV', value: 500, ratio: 1 },
      { name: 'XAGUSD', value: 1, ratio: 0.002 },
    ],
  },
  {
    id: 'PLT/XPTUSD',
    type: 'pair',
    instruments: [
      { name: 'PLT', value: 100, ratio: 1 },
      { name: 'XPTUSD', value: 1, ratio: 0.01 },
    ],
  },
  {
    id: 'PLD/XPDUSD',
    type: 'pair',
    instruments: [
      { name: 'PLD', value: 100, ratio: 1 },
      { name: 'XPDUSD', value: 1, ratio: 0.01 },
    ],
  },
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

const getDisplayValue = (
  inst: Instrument,
  index: number,
  moexBiasPercent: number
): number =>
  index === 0 ? inst.value * (1 + moexBiasPercent / 100) : inst.value;

const toStoredValue = (
  displayed: number,
  index: number,
  moexBiasPercent: number
): number =>
  index === 0 ? displayed / (1 + moexBiasPercent / 100) : displayed;

interface PairCardProps {
  group: FxproPair;
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
          max={1000}
          step={1}
        />
      </CardContent>
    </Card>
  );
}

interface FxproCalculatorProps {
  moexBiasPercent: number;
}

/**
 * Калькулятор лотности для арбитража MOEX / FXPRO.
 */
export function FxproCalculator({
  moexBiasPercent,
}: FxproCalculatorProps) {
  const [groups, setGroups] = useState<FxproPair[]>(() => {
    const saved = localStorage.getItem(FXPRO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...initialPairs];
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
      localStorage.setItem(FXPRO_STORAGE_KEY, JSON.stringify(groups));
    }, 500);
    return () => clearTimeout(timeout);
  }, [groups]);

  return (
    <div className="flex gap-2 flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {groups.map((group) => (
          <PairCard
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            moexBiasPercent={moexBiasPercent}
          />
        ))}
      </div>
    </div>
  );
}
