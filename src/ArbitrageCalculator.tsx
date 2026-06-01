import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GroupSearchInput } from './components/GroupSearchInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TypographyH3 } from './components/ui/typography';
import { Slider } from './components/ui/slider';
import { getFuturesSuffix, moneyFormat } from './utils';
import { useGetMoexSecurityQuery } from './api';
import { XpbeeCalculator } from './calculators/XpbeeCalculator';
import { FxproCalculator } from './calculators/FxproCalculator';
import { HyperliquidCalculator } from './calculators/HyperliquidCalculator';
import { AlorLabel } from './calculators/XpbeeCalculator';

const TAB_VALUES = ['xpbee', 'fxpro', 'hyperliquid'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && TAB_VALUES.includes(value as TabValue);
}

const EMPTY_TAB_SEARCH: Record<TabValue, string> = {
  xpbee: '',
  fxpro: '',
  hyperliquid: '',
};

interface RatesTickerProps {
  EURRate?: number | null;
  USDRate?: number | null;
  CNYRate?: number | null;
  GOLDRate?: number | null;
  SilverRate?: number | null;
}

const RATE_PLACEHOLDER = '—';

function isValidRate(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function formatTickerMoney(
  value: number | null | undefined,
  currency: string,
  divisor = 1
): string {
  if (!isValidRate(value)) return RATE_PLACEHOLDER;
  const result = value / divisor;
  if (!Number.isFinite(result)) return RATE_PLACEHOLDER;
  return moneyFormat(result, currency, 0, 2);
}

function formatCrossTicker(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  currency: string,
  scale = 1
): string {
  if (!isValidRate(numerator) || !isValidRate(denominator) || denominator === 0) {
    return RATE_PLACEHOLDER;
  }
  const result = numerator / denominator / scale;
  if (!Number.isFinite(result)) return RATE_PLACEHOLDER;
  return moneyFormat(result, currency, 0, 2);
}

function RatesTickerItems({
  EURRate,
  USDRate,
  CNYRate,
  GOLDRate,
  SilverRate,
}: RatesTickerProps) {
  return (
    <>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="EUR" />
        <span>{formatTickerMoney(EURRate, 'RUB', 1000)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="USD" />
        <span>{formatTickerMoney(USDRate, 'RUB', 1000)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="CNY" />
        <span>{formatTickerMoney(CNYRate, 'RUB')}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="UCNY" />
        <span>{formatCrossTicker(USDRate, CNYRate, 'CNY', 1000)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="EURUSD" />
        <span>{formatCrossTicker(EURRate, USDRate, 'USD')}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="EURCNY" />
        <span>{formatCrossTicker(EURRate, CNYRate, 'CNY', 1000)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="GOLD" />
        <span>{formatTickerMoney(GOLDRate, 'USD')}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="SILV" />
        <span>{formatTickerMoney(SilverRate, 'USD')}</span>
      </span>
    </>
  );
}

function RatesTicker(props: RatesTickerProps) {
  return (
    <div className="rates-ticker">
      <div className="rates-marquee-viewport sm:hidden overflow-hidden -mx-3">
        <div className="rates-marquee flex w-max">
          <div className="flex items-center gap-6 pr-6">
            <RatesTickerItems {...props} />
          </div>
          <div className="flex items-center gap-6 pr-6" aria-hidden="true">
            <RatesTickerItems {...props} />
          </div>
        </div>
      </div>
      <div className="hidden sm:flex sm:flex-wrap gap-4">
        <RatesTickerItems {...props} />
      </div>
    </div>
  );
}

export function ArbitrageCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => {
    const value = searchParams.get('tab');
    return isValidTab(value) ? value : 'xpbee';
  }, [searchParams]);

  const setTab = (value: TabValue) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const suffix = getFuturesSuffix();
  const { data: EURRate } = useGetMoexSecurityQuery(`EU${suffix}`, {
    pollingInterval: 5000,
  });
  const { data: USDRate } = useGetMoexSecurityQuery(`Si${suffix}`, {
    pollingInterval: 5000,
  });
  const { data: CNYRate } = useGetMoexSecurityQuery(`CR${suffix}`, {
    pollingInterval: 5000,
  });
  const { data: GOLDRate } = useGetMoexSecurityQuery(`GD${suffix}`, {
    pollingInterval: 5000,
  });
  const { data: SilverRate } = useGetMoexSecurityQuery(`SV${suffix}`, {
    pollingInterval: 5000,
  });

  const [moexBiasPercent, setMoexBiasPercent] = useState(() => {
    const saved = localStorage.getItem('arbitrageMoexBiasPercent');
    const n = saved ? parseFloat(saved) : 0;
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, 20);
  });

  useEffect(() => {
    localStorage.setItem('arbitrageMoexBiasPercent', String(moexBiasPercent));
  }, [moexBiasPercent]);

  const [tabSearchQueries, setTabSearchQueries] =
    useState<Record<TabValue, string>>(EMPTY_TAB_SEARCH);

  const searchQuery = tabSearchQueries[tab];

  const setSearchQuery = (value: string) => {
    setTabSearchQueries((prev) => ({ ...prev, [tab]: value }));
  };

  return (
    <>
      <div className="flex flex-col h-dvh pb-[env(safe-area-inset-bottom)]">
        <a
          className="shrink-0 block w-full border-b border-black/10 bg-white px-3 py-2 text-xs sm:text-sm text-center text-black hover:bg-neutral-100 transition-colors pt-[max(0.5rem,env(safe-area-inset-top))]"
          href="https://crypto-spreads.ru/?utm_source=calculator&utm_medium=link&utm_campaign=xpbee"
          target="_blank"
          rel="noopener noreferrer"
        >
          Скринер с котировками XPBEE — <span className="underline">попробовать сейчас</span>
        </a>
        <main className="flex flex-col flex-1 min-h-0 gap-3 px-3 sm:px-4">
          <div className="pt-2">
            <RatesTicker
              EURRate={EURRate}
              USDRate={USDRate}
              CNYRate={CNYRate}
              GOLDRate={GOLDRate}
              SilverRate={SilverRate}
            />
          </div>
          <TypographyH3 as="h1">Калькулятор лотности</TypographyH3>
          <div className="flex flex-col кам py-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <span className="text-sm font-medium">Перевес на MOEX, %</span>
            <div className="flex items-center gap-3 w-full sm:flex-1 sm:min-w-0">
              <Slider
                className="flex-1"
                value={[moexBiasPercent]}
                onValueChange={(v) => setMoexBiasPercent(v[0])}
                min={0}
                max={20}
                step={1}
                marks={[5, 10, 15, 20]}
              />
              <span className="shrink-0 text-sm text-muted-foreground min-w-[3rem] text-right">
                {Math.round(moexBiasPercent)}%
              </span>
            </div>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => isValidTab(value) && setTab(value)}
            className="flex flex-col flex-1 min-h-0 min-w-0"
          >
            <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 shrink-0 bg-background px-3 sm:px-4 pb-0 flex flex-col gap-1">
              <TabsList className="shrink-0">
                <TabsTrigger value="xpbee">XPBEE</TabsTrigger>
                <TabsTrigger value="fxpro">FXPRO</TabsTrigger>
                <TabsTrigger value="hyperliquid">Hyperliquid</TabsTrigger>
              </TabsList>
              <GroupSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <TabsContent value="xpbee" className="flex-1 min-h-0 overflow-auto">
              <XpbeeCalculator
                rates={{ EURRate, USDRate, CNYRate, GOLDRate, SilverRate }}
                moexBiasPercent={moexBiasPercent}
                searchQuery={searchQuery}
              />
            </TabsContent>
            <TabsContent value="fxpro" className="flex-1 min-h-0 overflow-auto">
              <FxproCalculator
                rates={{ EURRate, USDRate, CNYRate, GOLDRate, SilverRate }}
                moexBiasPercent={moexBiasPercent}
                searchQuery={searchQuery}
              />
            </TabsContent>
            <TabsContent value="hyperliquid" className="flex-1 min-h-0 overflow-auto">
              <HyperliquidCalculator
                moexBiasPercent={moexBiasPercent}
                searchQuery={searchQuery}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <a
        href="https://t.me/max_xchange"
        target="_blank"
        rel="noreferrer"
        aria-label="Задать вопрос"
        title="Задать вопрос"
        className="telegram-fab fixed z-50 size-[50px] overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right,0px))]"
      >
        <div
          className="size-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/assets/telegram-48px.png")' }}
          aria-hidden="true"
        />
      </a>
    </>
  );
}
