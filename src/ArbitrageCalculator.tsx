import React, {useEffect, useState} from 'react';
import {Slider} from './components/ui/slider';
import {Input} from './components/ui/input';
import {TypographyH2, TypographyH4} from './components/ui/typography';
import {Card, CardContent, CardHeader, CardTitle} from './components/ui/card';
import {useGetMoexSecurityQuery, useGetRuRateQuery} from "./api";
import {getFuturesSuffix, moneyFormat} from "./utils";
import {Alert, AlertDescription, AlertTitle} from "./components/ui/alert";
import {Button} from "./components/ui/button";

export const AlorLabel = ({symbol}) => {
    const map = {
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
        BTC: 'BITOK'
    };

    const bybitMap = {
        PAXGUSDT: 'url("//bybit.com/bycsi-root/fop/a8286509-8373-4307-852e-8cbacca2c299.svg")'
    }

    const symbolParts = (symbol.includes('-') ? symbol.split('-') : symbol.split('/'));

    let key = map[symbolParts[0]];
    let backgroundImage = `url("//invest-brands.cdn-tinkoff.ru/${key}x160.png")`
    if (symbolParts[1]?.includes('BYBIT')) {
        const [exchange, ticker] = symbolParts[1].split(':')
        backgroundImage = bybitMap[ticker];
    }

    return (
        <div className="flex gap-1">
            {key && <div className="img" style={{backgroundImage}}/>}
            {symbol}
        </div>
    );
};

// Пример конфигурации: 8 пар и 4 тройки с коэффициентами (замените на реальные)
const initialPairs = [
    {
        id: `ED/EURUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `ED`, value: 1, ratio: 1}, // Базовый
            {name: `EURUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `UCNY/USDCNH_xp`,
        type: 'pair',
        instruments: [
            {name: `UCNY`, value: 1, ratio: 1}, // Базовый
            {name: `USDCNH_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `GOLD/XAUUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `GOLD`, value: 1, ratio: 1}, // Базовый
            {name: `XAUUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `GOLD/BYBIT:PAXGUSDT`,
        type: 'pair',
        instruments: [
            {name: `GOLD`, value: 1, ratio: 1}, // Базовый
            {name: `BYBIT:PAXGUSDT`, value: 1, ratio: 1},
        ],
    },
    {
        id: `SILV/XAGUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `SILV`, value: 5, ratio: 1}, // Базовый
            {name: `XAGUSD_xp`, value: 0.01, ratio: 0.002},
        ],
    },
    {
        id: `PLT/XPTUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `PLT`, value: 1, ratio: 1}, // Базовый
            {name: `XPTUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `PLD/XPDUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `PLD`, value: 1, ratio: 1}, // Базовый
            {name: `XPDUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `BTC/BTCUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `BTC`, value: 10, ratio: 10},
            {name: `BTCUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
    {
        id: `ETH/ETHUSD_xp`,
        type: 'pair',
        instruments: [
            {name: `ETH`, value: 12, ratio: 12},
            {name: `ETHUSD_xp`, value: 0.01, ratio: 0.01},
        ],
    },
];

const initialTriples = [
    {
        id: `SI/CNY/USDCNH_xp`,
        type: 'triple',
        instruments: [
            {name: `SI`, value: 24, ratio: 1}, // Базовый
            {name: `CNY`, value: 170, ratio: 7.08}, // ratio зависит от курса Юаня
            {name: `USDCNH_xp`, value: 0.24, ratio: 0.01}, // Пример третьего
        ],
    },
    {
        id: `EU/SI/EURUSD_xp`,
        type: 'triple',
        instruments: [
            {name: `EU`, value: 20, ratio: 1}, // Базовый
            {name: `SI`, value: 23, ratio: 1.15}, // ratio зависит от курса Евро
            {name: `EURUSD_xp`, value: 0.2, ratio: 0.01}, // Пример третьего
        ],
    },
    {
        id: `EU/CNY/EURCNH_xp`,
        type: 'triple',
        instruments: [
            {name: `EU`, value: 1, ratio: 1}, // Базовый
            {name: `CNY`, value: 8, ratio: 8}, // ratio зависит от курса Евро и юаня
            {name: `EURCNH_xp`, value: 0.01, ratio: 0.01}, // Пример третьего
        ],
    },
    {
        id: `GLDRUBF/SI/GOLD`,
        type: 'triple',
        instruments: [
            {name: `GLDRUBF`, value: 31.1, ratio: 1}, // Базовый
            {name: `SI`, value: 0, ratio: 0}, // ratio = цена GOLD-3.26 / 1000 (обновляется из котировок)
            {name: `GOLD`, value: 1 / 31.1, ratio: 1 / 31.1}, // GOLD = 1/31.1 при GLDRUBF=31.1
        ],
    },
];

// Компонент для пары
const PairCalculator = ({group, onUpdate}) => {
    const [instruments, setInstruments] = useState(group.instruments);

    const handleChange = (index, val) => {
        const value = parseFloat(val);
        if (isNaN(value) || value < 0) return;

        const newInstruments = [...instruments];
        newInstruments[index].value = value;

        // Пересчёт остальных относительно базового
        const baseValue = value;
        const baseRatio = newInstruments[index].ratio;
        newInstruments.forEach((inst, i) => {
            if (i !== index) {
                inst.value = Math.round(baseValue * (inst.ratio / baseRatio) * 1000) / 1000;
            }
        });

        setInstruments(newInstruments);
        onUpdate(group.id, newInstruments);
    };

    return (
        <Card className="gap-1 p-2">
            <CardHeader className="pl-2 pt-3">
                <CardTitle>
                    <TypographyH4><AlorLabel symbol={group.id}/></TypographyH4>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-4 mb-2">
                    {instruments.map((inst, index) => (
                        <label key={index}>
                            {inst.name}:
                            <Input
                                type="number"
                                value={inst.value}
                                onChange={(e) => handleChange(index, e.target.value)}
                                min="0"
                                step={index === 0 ? '1' : '0.01'} // Шаг для контрактов/лотов
                                prefix={inst.name}
                            />
                        </label>
                    ))}
                </div>
                <Slider
                    className="pt-2 pb-2"
                    value={[instruments[0].value]}
                    onValueChange={(val) => handleChange(0, val)}
                    max={500}
                    step={1}
                />
            </CardContent>
        </Card>
    );
};

// Компонент для тройки (аналогично, но для 3 полей)
const TripleCalculator = ({group, onUpdate}) => {
    const [instruments, setInstruments] = useState(group.instruments);

    const handleChange = (index, val) => {
        const value = parseFloat(val);
        if (isNaN(value) || value < 0) return;

        const newInstruments = [...instruments];
        newInstruments[index].value = value;

        const baseValue = value;
        const baseRatio = newInstruments[index].ratio;
        newInstruments.forEach((inst, i) => {
            if (i !== index) {
                inst.value = Math.round(baseValue * (inst.ratio / baseRatio) * 1000) / 1000;
            }
        });

        setInstruments(newInstruments);
        onUpdate(group.id, newInstruments);
    };

    return (
        <Card className="gap-1 p-2">
            <CardHeader className="pl-2 pt-3">
                <CardTitle>
                    <TypographyH4><AlorLabel symbol={group.id}/></TypographyH4>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="grid grid-cols-3 gap-4 mt-2 mb-2">
                    {instruments.map((inst, index) => (
                        <label key={index}>
                            {inst.name}:
                            <Input
                                type="number"
                                value={inst.value}
                                onChange={(e) => handleChange(index, e.target.value)}
                                min="0"
                                step={index === 0 ? '1' : '0.01'}
                            />
                        </label>
                    ))}
                </div>
                <Slider
                    className="pt-2 pb-2"
                    value={[instruments[0].value]}
                    onValueChange={(val) => handleChange(0, val)}
                    max={500}
                    step={1}
                />
            </CardContent>
        </Card>
    );
};

export const ArbitrageCalculator = () => {
    const suffix = getFuturesSuffix();
    const {data: rateData} = useGetRuRateQuery();
    const {data: EURRate} = useGetMoexSecurityQuery(`EU${suffix}`, {
        pollingInterval: 5000
    })
    const {data: USDRate} = useGetMoexSecurityQuery(`Si${suffix}`, {
        pollingInterval: 5000
    })
    const {data: CNYRate} = useGetMoexSecurityQuery(`CR${suffix}`, {
        pollingInterval: 5000
    })
    const {data: GOLDRate} = useGetMoexSecurityQuery(`GD${suffix}`, {
        pollingInterval: 5000
    })

    // const EURRate = rateData?.Valute.EUR.Value;
    // const USDRate = rateData?.Valute.USD.Value;
    // const CNYRate = rateData?.Valute.CNY.Value;

    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('arbitrageGroups');
        return saved ? JSON.parse(saved) : [...initialPairs, ...initialTriples];
    });

    const updateGroup = (groupId, updatedInstruments) => {
        setGroups(groups.map((group) => (group.id === groupId ? {...group, instruments: updatedInstruments} : group)));
    };

    const update = () => {
        localStorage.removeItem('arbitrageGroups');
        window.location.reload();
    }

    useEffect(() => {
        const hasRates = rateData && USDRate != null && CNYRate != null && EURRate != null;
        const hasGold = GOLDRate != null;
        if (!hasRates && !hasGold) return;

        const usdCny = hasRates ? USDRate / CNYRate / 1000 : null;
        const eurUsd = hasRates ? EURRate / USDRate : null;
        const eurCny = hasRates ? EURRate / CNYRate / 1000 : null;

        setGroups((prev) =>
            prev.map((group) => {
                let newInstruments = [...group.instruments];
                let updated = false;

                if (group.id === `SI/CNY/USDCNH_xp` && usdCny != null) {
                    newInstruments[1].ratio = usdCny;
                    updated = true;
                } else if (group.id === `EU/SI/EURUSD_xp` && eurUsd != null) {
                    newInstruments[1].ratio = eurUsd;
                    updated = true;
                } else if (group.id === `EU/CNY/EURCNH_xp` && eurCny != null) {
                    newInstruments[1].ratio = eurCny;
                    updated = true;
                } else if (group.id === `GLDRUBF/SI/GOLD` && GOLDRate != null) {
                    const goldPrice = GOLDRate / 1000;
                    newInstruments[1].ratio = goldPrice / (31.1 * 31.1); // SI = (цена GOLD / 1000) / 31.1
                    updated = true;
                }

                if (updated) {
                    const baseValue = newInstruments[0].value;
                    const baseRatio = newInstruments[0].ratio;
                    newInstruments.forEach((inst, i) => {
                        if (i !== 0) {
                            inst.value = Math.round(baseValue * (inst.ratio / baseRatio) * 1000) / 1000;
                        }
                    });
                }

                return updated ? {...group, instruments: newInstruments} : group;
            })
        );
    }, [rateData, EURRate, USDRate, CNYRate, GOLDRate]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('arbitrageGroups', JSON.stringify(groups));
        }, 500);

        return () => clearTimeout(timeout);
    }, [groups]);

    return (
        <div className="flex gap-2 flex-col pl-4 pr-4 h-screen">
            <div className="flex flex-wrap justify-between pt-2 pb-2">
                <div className="grid grid-cols-2 gap-6 md:flex md:flex-nowrap">
                    <span className="flex gap-1"><AlorLabel
                        symbol="EUR"/> {moneyFormat(EURRate / 1000, 'RUB', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel
                        symbol="USD"/> {moneyFormat(USDRate / 1000, 'RUB', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel symbol="CNY"/> {moneyFormat(CNYRate, 'RUB', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel
                        symbol="UCNY"/> {moneyFormat(USDRate / CNYRate / 1000, 'CNY', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel
                        symbol="EURUSD"/> {moneyFormat(EURRate / USDRate, 'USD', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel
                        symbol="EURCNY"/> {moneyFormat(EURRate / CNYRate / 1000, 'CNY', 0, 2)}</span>
                    <span className="flex gap-1"><AlorLabel
                        symbol="GOLD"/> {GOLDRate != null ? moneyFormat(GOLDRate, 'USD', 0, 2) : '—'}</span>
                </div>
                <a
                    className="flex gap-1 bg-muted p-1 pl-2 pr-2 text-sm rounded-xl items-center"
                    href="https://crypto-spreads.ru/arbs-moex-cex?utm_source=calculator&utm_medium=link&utm_campaign=xpbee"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Котировки XPBEE с графиками TradingView
                </a>
                <a className="flex gap-1 bg-muted p-1 pl-2 pr-2 text-sm rounded-xl items-center"
                   href="https://t.me/max89701" target="_blank">
                    <div className="img" style={{backgroundImage: `url("/assets/telegram-48px.png")`}}/>
                    Задать вопрос
                </a>
            </div>
            <div className="flex gap-2">
                <TypographyH2>Калькулятор лотности для арбитража</TypographyH2>
                <Button
                     onClick={update}>Обновить
                </Button>
            </div>
            <Alert className="w-max">
                <AlertTitle>Хотите точные графики арбитража из XPBEE бесплатно или за подписку?</AlertTitle>
                <AlertDescription>
                    Пройдите быстрый опрос (2 мин)!
                </AlertDescription>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfRSwFruL7FYCvFKU-eTvg9eUXoHgpMJbCkSRQD0k_kcWL1VQ/viewform?usp=dialog"
                   target="_blank" className="mt-2">
                    <Button>
                        Перейти к опросу
                    </Button>
                </a>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {groups.map((group) => {
                    if (group.type === 'pair') {
                        return <PairCalculator key={group.id} group={group} onUpdate={updateGroup}/>;
                    } else {
                        return <TripleCalculator key={group.id} group={group} onUpdate={updateGroup}/>;
                    }
                })}
            </div>
        </div>
    );
};
