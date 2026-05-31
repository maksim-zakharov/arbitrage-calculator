import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TypographyH4 } from './components/ui/typography';
import { Slider } from './components/ui/slider';
import { formatNumber, getFuturesSuffix, moneyFormat } from './utils';
import { useGetMoexSecurityQuery } from './api';
import { XpbeeCalculator } from './calculators/XpbeeCalculator';
import { FxproCalculator } from './calculators/FxproCalculator';
import { HyperliquidCalculator } from './calculators/HyperliquidCalculator';
import { BybitCalculator } from './calculators/BybitCalculator';
import { AlorLabel } from './calculators/XpbeeCalculator';

const TAB_VALUES = ['xpbee', 'bybit', 'fxpro', 'hyperliquid'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(value: string | null): value is TabValue {
  return value !== null && TAB_VALUES.includes(value as TabValue);
}

interface RatesTickerProps {
  EURRate?: number | null;
  USDRate?: number | null;
  CNYRate?: number | null;
  GOLDRate?: number | null;
  SilverRate?: number | null;
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
        <span>{moneyFormat((EURRate ?? 0) / 1000, 'RUB', 0, 2)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="USD" />
        <span>{moneyFormat((USDRate ?? 0) / 1000, 'RUB', 0, 2)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="CNY" />
        <span>{moneyFormat(CNYRate ?? 0, 'RUB', 0, 2)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="UCNY" />
        <span>
          {moneyFormat((USDRate ?? 0) / (CNYRate ?? 1) / 1000, 'CNY', 0, 2)}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="EURUSD" />
        <span>{moneyFormat((EURRate ?? 0) / (USDRate ?? 1), 'USD', 0, 2)}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="EURCNY" />
        <span>
          {moneyFormat((EURRate ?? 0) / (CNYRate ?? 1) / 1000, 'CNY', 0, 2)}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="GOLD" />
        <span>
          {GOLDRate != null ? moneyFormat(GOLDRate, 'USD', 0, 2) : '—'}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap">
        <AlorLabel symbol="SILV" />
        <span>
          {SilverRate != null ? moneyFormat(SilverRate, 'USD', 0, 2) : '—'}
        </span>
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
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
  });

  useEffect(() => {
    localStorage.setItem('arbitrageMoexBiasPercent', String(moexBiasPercent));
  }, [moexBiasPercent]);

  return (
    <>
      <div className="flex flex-col h-dvh pb-[env(safe-area-inset-bottom)]">
        <a
          className="shrink-0 flex w-full items-center justify-center border-b border-black/10 bg-white px-3 py-2 text-xs sm:text-sm text-center text-black hover:bg-neutral-100 transition-colors pt-[max(0.5rem,env(safe-area-inset-top))]"
          href="https://crypto-spreads.ru/arbs-moex-cex?utm_source=calculator&utm_medium=link&utm_campaign=xpbee"
          target="_blank"
          rel="noopener noreferrer"
        >
          Котировки XPBee — актуальные данные и графики TradingView
        </a>
        <div className="flex flex-col flex-1 min-h-0 gap-3 px-3 sm:px-4">
          <div className="pt-2">
            <RatesTicker
              EURRate={EURRate}
              USDRate={USDRate}
              CNYRate={CNYRate}
              GOLDRate={GOLDRate}
              SilverRate={SilverRate}
            />
          </div>
          <TypographyH4>Калькулятор лотности для арбитража (XPBEE)</TypographyH4>
          <div className="flex flex-col gap-2 py-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <span className="text-sm font-medium">Перевес на MOEX, %</span>
            <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-xs">
              <Slider
                className="flex-1"
                value={[moexBiasPercent]}
                onValueChange={(v) => setMoexBiasPercent(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <span className="shrink-0 text-sm text-muted-foreground min-w-[3rem] text-right">
                {formatNumber(moexBiasPercent)}%
              </span>
            </div>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => isValidTab(value) && setTab(value)}
            className="flex flex-col flex-1 min-h-0 min-w-0"
          >
            <TabsList className="shrink-0">
              <TabsTrigger value="xpbee">XPBEE</TabsTrigger>
              <TabsTrigger value="bybit">BYBIT</TabsTrigger>
              <TabsTrigger value="fxpro">FXPRO</TabsTrigger>
              <TabsTrigger value="hyperliquid">Hyperliquid</TabsTrigger>
            </TabsList>
            <TabsContent value="xpbee" className="flex-1 min-h-0 overflow-auto mt-2">
              <XpbeeCalculator
                rates={{ EURRate, USDRate, CNYRate, GOLDRate, SilverRate }}
                moexBiasPercent={moexBiasPercent}
              />
            </TabsContent>
            <TabsContent value="bybit" className="flex-1 min-h-0 overflow-auto mt-2">
              <BybitCalculator />
            </TabsContent>
            <TabsContent value="fxpro" className="flex-1 min-h-0 overflow-auto mt-2">
              <FxproCalculator
                rates={{ EURRate, USDRate, CNYRate, GOLDRate, SilverRate }}
                moexBiasPercent={moexBiasPercent}
              />
            </TabsContent>
            <TabsContent value="hyperliquid" className="flex-1 min-h-0 overflow-auto mt-2">
              <HyperliquidCalculator moexBiasPercent={moexBiasPercent} />
            </TabsContent>
          </Tabs>
        </div>
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
