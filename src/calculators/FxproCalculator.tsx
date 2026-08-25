import React, { useEffect, useMemo, useState } from "react";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { TypographyH4 } from "../components/ui/typography";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  formatNumber,
  filterGroupsBySearch,
  loadMergedGroups,
  sortGroupsByMoexLeg,
} from "../utils";
import { AlorLabel, XpbeeRates } from "./XpbeeCalculator";

interface Instrument {
  name: string;
  value: number;
  ratio: number;
}

interface FxproGroup {
  id: string;
  type: "pair" | "triple";
  instruments: Instrument[];
}

const FXPRO_STORAGE_KEY = "fxproGroups";

/** 1000 контрактов MOEX COCOA = 1 лот FXPRO #Cocoa */
const FXPRO_COCOA_LOT_PER_MOEX = 0.001;

/** 375 контрактов MOEX COFFEE = 0.1 лота FXPRO #Coffee */
const FXPRO_COFFEE_MOEX_LOTS = 375;
const FXPRO_COFFEE_FXPRO_LOTS = 0.1;

const initialPairs: FxproGroup[] = [
  {
    id: "BR/BRENT",
    type: "pair",
    instruments: [
      { name: "BR", value: 100, ratio: 1 },
      { name: "BRENT", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "NG/NAT.GAS",
    type: "pair",
    instruments: [
      { name: "NG", value: 100, ratio: 1 },
      { name: "NAT.GAS", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "ED/EURUSD",
    type: "pair",
    instruments: [
      { name: "ED", value: 100, ratio: 1 },
      { name: "EURUSD", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "GOLD/XAUUSD",
    type: "pair",
    instruments: [
      { name: "GOLD", value: 100, ratio: 1 },
      { name: "XAUUSD", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "SILV/XAGUSD",
    type: "pair",
    instruments: [
      { name: "SILV", value: 500, ratio: 1 },
      { name: "XAGUSD", value: 1, ratio: 0.002 },
    ],
  },
  {
    id: "PLT/XPTUSD",
    type: "pair",
    instruments: [
      { name: "PLT", value: 100, ratio: 1 },
      { name: "XPTUSD", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "PLD/XPDUSD",
    type: "pair",
    instruments: [
      { name: "PLD", value: 100, ratio: 1 },
      { name: "XPDUSD", value: 1, ratio: 0.01 },
    ],
  },
  {
    id: "EU/CNY/EURCNH",
    type: "triple",
    instruments: [
      { name: "EU", value: 1, ratio: 1 },
      { name: "CNY", value: 8, ratio: 8 },
      { name: "EURCNH", value: 0.01, ratio: 0.01 },
    ],
  },
  {
    id: "COCOA/SI/#Cocoa",
    type: "triple",
    instruments: [
      { name: "COCOA", value: 10, ratio: 1 },
      { name: "SI", value: 10, ratio: 1 },
      { name: "#Cocoa", value: 0.01, ratio: 0.001 },
    ],
  },
  {
    id: "COFFEE/#Coffee",
    type: "pair",
    instruments: [
      {
        name: "COFFEE",
        value: FXPRO_COFFEE_MOEX_LOTS,
        ratio: FXPRO_COFFEE_MOEX_LOTS,
      },
      {
        name: "#Coffee",
        value: FXPRO_COFFEE_FXPRO_LOTS,
        ratio: FXPRO_COFFEE_FXPRO_LOTS,
      },
    ],
  },
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

const getDisplayValue = (
  inst: Instrument,
  index: number,
  moexBiasPercent: number,
): number =>
  index === 0 ? inst.value * (1 + moexBiasPercent / 100) : inst.value;

const toStoredValue = (
  displayed: number,
  index: number,
  moexBiasPercent: number,
): number =>
  index === 0 ? displayed / (1 + moexBiasPercent / 100) : displayed;

interface PairCardProps {
  group: FxproGroup;
  onUpdate: (groupId: string, instruments: Instrument[]) => void;
  moexBiasPercent: number;
}

function PairCard({ group, onUpdate, moexBiasPercent }: PairCardProps) {
  const [instruments, setInstruments] = useState(group.instruments);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (focusedIndex !== null) return;
    setInstruments(group.instruments);
  }, [group.instruments, focusedIndex]);

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
      formatNumber(getDisplayValue(instruments[index], index, moexBiasPercent)),
    );
  };

  const handleBlur = (index: number) => {
    if (focusedIndex === index) {
      const normalized = editingValue.replace(/\s/g, "").replace(",", ".");
      const parsed = parseFloat(normalized);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        const stored = toStoredValue(parsed, index, moexBiasPercent);
        handleChange(index, round2(stored));
      }
      setFocusedIndex(null);
    }
  };

  const baseDisplayValue = getDisplayValue(instruments[0], 0, moexBiasPercent);
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
        <div
          className={`grid gap-3 sm:gap-4 mb-2 ${
            instruments.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
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
                        getDisplayValue(inst, index, moexBiasPercent),
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
          max={Math.max(1000, Math.ceil(instruments[0].ratio * 20))}
          step={1}
        />
      </CardContent>
    </Card>
  );
}

interface FxproCalculatorProps {
  rates: XpbeeRates;
  moexBiasPercent: number;
  searchQuery: string;
}

/**
 * Калькулятор лотности для арбитража MOEX / FXPRO.
 */
export function FxproCalculator({
  rates,
  moexBiasPercent,
  searchQuery,
}: FxproCalculatorProps) {
  const { EURRate, CNYRate, USDRate, CocoaRate } = rates;

  const [groups, setGroups] = useState<FxproGroup[]>(() =>
    loadMergedGroups(FXPRO_STORAGE_KEY, [...initialPairs]),
  );

  const updateGroup = (groupId: string, updatedInstruments: Instrument[]) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, instruments: updatedInstruments }
          : group,
      ),
    );
  };

  useEffect(() => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === "EU/CNY/EURCNH") {
          if (EURRate == null || CNYRate == null) return group;

          const eurCny = EURRate / CNYRate / 1000;
          const newInstruments = group.instruments.map((inst) => ({ ...inst }));
          newInstruments[1].ratio = eurCny;

          const baseValue = newInstruments[0].value;
          const baseRatio = newInstruments[0].ratio;
          newInstruments.forEach((inst, i) => {
            if (i !== 0) {
              inst.value = round2(baseValue * (inst.ratio / baseRatio));
            }
          });

          return { ...group, instruments: newInstruments };
        }

        if (group.id === "COCOA/SI/#Cocoa") {
          if (
            group.instruments.length < 3 ||
            USDRate == null ||
            CocoaRate == null ||
            CocoaRate === 0
          ) {
            return group;
          }

          const siCocoa = USDRate / CocoaRate;
          if (!Number.isFinite(siCocoa) || siCocoa <= 0) return group;

          const newInstruments = group.instruments.map((inst) => ({ ...inst }));
          newInstruments[0].ratio = siCocoa;
          newInstruments[1].ratio = 1;
          newInstruments[2].ratio = siCocoa * FXPRO_COCOA_LOT_PER_MOEX;

          const baseValue = newInstruments[1].value;
          const baseRatio = newInstruments[1].ratio;
          newInstruments.forEach((inst, i) => {
            if (i !== 1) {
              inst.value = round2(baseValue * (inst.ratio / baseRatio));
            }
          });

          return { ...group, instruments: newInstruments };
        }

        return group;
      }),
    );
  }, [EURRate, CNYRate, USDRate, CocoaRate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(FXPRO_STORAGE_KEY, JSON.stringify(groups));
    }, 500);
    return () => clearTimeout(timeout);
  }, [groups]);

  const visibleGroups = useMemo(
    () => filterGroupsBySearch(sortGroupsByMoexLeg(groups), searchQuery),
    [groups, searchQuery],
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
