
import type { Money } from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export type AccountType =
  | 'current'
  | 'savings'
  | 'gold'
  | (string & {});

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  maskedNumber: string;
  balance: Money;
}

export interface AccountsResponse {
  accounts: Account[];
}

export type TransactionDirection = 'debit' | 'credit';

export interface Transaction {
  id: string;
  accountId: string;
  title: string;
  category: string;
  direction: TransactionDirection;
  amount: Money;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  nextCursor: string | null;
}

export interface Suggestion {
  id: string;
  text: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
}
