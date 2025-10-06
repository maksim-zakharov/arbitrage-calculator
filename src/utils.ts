import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
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
