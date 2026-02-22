import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Форматирование числа с округлением до 2 знаков после запятой через Intl.NumberFormat */
const numberFormat2 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatNumber(value: number): string {
    return numberFormat2.format(value);
}

export const moneyFormat = (
    money: number,
    currency: string = 'RUB',
    minimumFractionDigits: number = 0,
    maximumFractionDigits: number = 0,
) => {
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency === 'USDT' ? 'USD' : currency,
        minimumFractionDigits,
        maximumFractionDigits,
    };
    const numberFormat = new Intl.NumberFormat('ru-RU', options);

    let result = numberFormat.format(money);
    if (currency === 'USDT') {
        result = result.replace('$', 'USDT');
    }

    return result;
};

function getThirdThursday(year, month) {
    let date = new Date(year, month - 1, 1);
    let thursdays = 0;
    while (thursdays < 3) {
        if (date.getDay() === 4) { // Thursday
            thursdays++;
        }
        if (thursdays < 3) {
            date.setDate(date.getDate() + 1);
        }
    }
    return date;
}

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
    const letterMap = { 3: 'H', 6: 'M', 9: 'U', 12: 'Z' };
    const letter = letterMap[expMonth];
    const yearDigit = expYear % 10;
    return letter + yearDigit;
}
