
import type { Money } from '../types/api';
import type { Account } from '../types/home';

export function formatMoney(money: Money): string {
  const { amountMinor, currency } = money;

  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error('Invalid money amount');
  }

  const negative = amountMinor < 0;
  const absolute = Math.abs(amountMinor);

  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;

  const formattedWhole = whole.toLocaleString('en-US');

  const formattedAmount =
    `${formattedWhole}.${String(fraction).padStart(2, '0')}`;

  return `${negative ? '-' : ''}${currency} ${formattedAmount}`;
}

export function calculateTotalBalance(
  accounts: Account[],
  currency = 'AED',
): Money {
  const amountMinor = accounts.reduce((total, account) => {
    if (account.balance.currency !== currency) {
      return total;
    }

    return total + account.balance.amountMinor;
  }, 0);

  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error('Total balance exceeds safe integer range');
  }

  return {
    amountMinor,
    currency,
  };
}
