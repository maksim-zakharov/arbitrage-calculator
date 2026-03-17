import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TypographyH2, TypographyH4 } from './components/ui/typography';
import { Slider } from './components/ui/slider';
import { Button } from './components/ui/button';
import { formatNumber, getFuturesSuffix, moneyFormat } from './utils';
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

  const updateXpbee = () => {
    localStorage.removeItem('arbitrageGroups');
    window.location.reload();
  };

  return (
    <div className="flex gap-2 flex-col pl-4 pr-4 h-screen">
      <div className="flex flex-wrap justify-between pt-2 pb-2">
        <div className="grid grid-cols-2 gap-6 md:flex md:flex-nowrap">
          <span className="flex gap-1 align-middle">
            <AlorLabel symbol="EUR" />{' '}
            {moneyFormat((EURRate ?? 0) / 1000, 'RUB', 0, 2)}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="USD" />{' '}
            {moneyFormat((USDRate ?? 0) / 1000, 'RUB', 0, 2)}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="CNY" /> {moneyFormat(CNYRate ?? 0, 'RUB', 0, 2)}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="UCNY" />{' '}
            {moneyFormat((USDRate ?? 0) / (CNYRate ?? 1) / 1000, 'CNY', 0, 2)}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="EURUSD" />{' '}
            {moneyFormat((EURRate ?? 0) / (USDRate ?? 1), 'USD', 0, 2)}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="EURCNY" />{' '}
            {moneyFormat(
              (EURRate ?? 0) / (CNYRate ?? 1) / 1000,
              'CNY',
              0,
              2
            )}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="GOLD" />{' '}
            {GOLDRate != null ? moneyFormat(GOLDRate, 'USD', 0, 2) : '—'}
          </span>
          <span className="flex gap-1">
            <AlorLabel symbol="SILV" />{' '}
            {SilverRate != null ? moneyFormat(SilverRate, 'USD', 0, 2) : '—'}
          </span>
        </div>
        <a
          className="flex gap-1 bg-muted p-1 pl-2 pr-2 text-sm rounded-xl items-center"
          href="https://t.me/max89701"
          target="_blank"
          rel="noreferrer"
        >
          <div
            className="img"
            style={{ backgroundImage: 'url("/assets/telegram-48px.png")' }}
          />
          Задать вопрос
        </a>
      </div>
      <div className="flex gap-2">
        <TypographyH4>Калькулятор лотности для арбитража (XPBEE)</TypographyH4>
        <Button onClick={updateXpbee}>Обновить</Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 py-2">
        <span className="text-sm font-medium">Перевес на MOEX, %</span>
        <Slider
          className="w-40"
          value={[moexBiasPercent]}
          onValueChange={(v) => setMoexBiasPercent(v[0])}
          min={0}
          max={100}
          step={1}
        />
        <span className="text-sm text-muted-foreground">
          {formatNumber(moexBiasPercent)}%
        </span>
        <span className="text-xs text-muted-foreground">
          (только для пар/троек с ногой Форекс _xp)
        </span>
      </div>
      <a
        className="flex gap-1 bg-muted p-2 text-sm rounded-xl items-center w-max"
        href="https://crypto-spreads.ru/arbs-moex-cex?utm_source=calculator&utm_medium=link&utm_campaign=xpbee"
        target="_blank"
        rel="noopener noreferrer"
      >
        Котировки XPBee — актуальные данные и графики TradingView
      </a>
      <Tabs
        value={tab}
        onValueChange={(value) => isValidTab(value) && setTab(value)}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList>
          <TabsTrigger value="xpbee">XPBEE</TabsTrigger>
          <TabsTrigger value="fxpro">FXPRO</TabsTrigger>
          <TabsTrigger value="hyperliquid">Hyperliquid</TabsTrigger>
        </TabsList>
        <TabsContent value="xpbee" className="flex-1 min-h-0 overflow-auto mt-2">
          <XpbeeCalculator
            rates={{ EURRate, USDRate, CNYRate, GOLDRate, SilverRate }}
            moexBiasPercent={moexBiasPercent}
          />
        </TabsContent>
        <TabsContent value="fxpro" className="flex-1 min-h-0 overflow-auto mt-2">
          <FxproCalculator />
        </TabsContent>
        <TabsContent value="hyperliquid" className="flex-1 min-h-0 overflow-auto mt-2">
          <HyperliquidCalculator moexBiasPercent={moexBiasPercent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
