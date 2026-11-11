
import type { Money } from './api';

export interface SpendingItem {
  label: string;
  amount: Money;
}

export interface SpendingSummaryWidget {
  id: string;
  type: 'spending_summary';
  title: string;
  total: Money;
  changePercent: number;
  items: SpendingItem[];
}

export interface TransferAction {
  id: string;
  label: string;
}

export interface TransferDraftWidget {
  id: string;
  type: 'transfer_draft';
  fromAccountId: string;
  to: {
    name: string;
    maskedIban: string;
  };
  amount: Money;
  actions: TransferAction[];
}

export type ChatWidget =
  | SpendingSummaryWidget
  | TransferDraftWidget;
