
import { useCallback, useEffect } from 'react';

import { useApi } from './useApi';

import {
  getMe,
  getAccounts,
  getTransactions,
  getSuggestions,
} from '../api/homeApi';

export function useGetMe() {
  const api = useApi(getMe);

  useEffect(() => {
    void api.execute();
  }, [api.execute]);

  return {
    data: api.data,
    isLoading: api.isLoading,
    error: api.error,
    refetch: api.execute,
  };
}

export function useGetAccounts() {
  const api = useApi(getAccounts);

  useEffect(() => {
    void api.execute();
  }, [api.execute]);

  return {
    data: api.data,
    isLoading: api.isLoading,
    error: api.error,
    refetch: api.execute,
  };
}

export function useGetTransactions() {
  const fetchTransactions = useCallback(
    (signal: AbortSignal) => getTransactions(5, undefined, signal),
    [],
  );

  const api = useApi(fetchTransactions);

  useEffect(() => {
    void api.execute();
  }, [api.execute]);

  return {
    data: api.data,
    isLoading: api.isLoading,
    error: api.error,
    refetch: api.execute,
  };
}

export function useGetSuggestions() {
  const api = useApi(getSuggestions);

  useEffect(() => {
    void api.execute();
  }, [api.execute]);

  return {
    data: api.data,
    isLoading: api.isLoading,
    error: api.error,
    refetch: api.execute,
  };
}

export function useHome() {
  const me = useGetMe();
  const accounts = useGetAccounts();
  const transactions = useGetTransactions();
  const suggestions = useGetSuggestions();

  const refreshAll = useCallback(() => {
    return Promise.all([
      me.refetch(),
      accounts.refetch(),
      transactions.refetch(),
      suggestions.refetch(),
    ]);
  }, [
    me.refetch,
    accounts.refetch,
    transactions.refetch,
    suggestions.refetch,
  ]);

  return {
    me,
    accounts,
    transactions,
    suggestions,
    refreshAll,
  };
}
