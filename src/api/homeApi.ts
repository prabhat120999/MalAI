
import { apiRequest } from './client';
import { API_ENDPOINTS } from './endpoints';

import type {
  User,
  AccountsResponse,
  TransactionsResponse,
  SuggestionsResponse,
} from '../types/home';

export const getMe = (signal?: AbortSignal) =>
  apiRequest<User>(
    API_ENDPOINTS.ME,
    { signal },
  );

export const getAccounts = (signal?: AbortSignal) =>
  apiRequest<AccountsResponse>(
    API_ENDPOINTS.ACCOUNTS,
    { signal },
  );

export const getTransactions = (
  limit = 5,
  cursor?: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.append('cursor', cursor);
  }

  return apiRequest<TransactionsResponse>(
    `${API_ENDPOINTS.TRANSACTIONS}?${params.toString()}`,
    { signal },
  );
};

export const getSuggestions = (signal?: AbortSignal) =>
  apiRequest<SuggestionsResponse>(
    API_ENDPOINTS.SUGGESTIONS,
    { signal },
  );
