
import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from 'react';
  
  import { ApiError } from '../types/api';
  
  type ApiFunction<T> = (
    signal: AbortSignal,
  ) => Promise<T>;
  
  interface UseApiReturn<T> {
    data: T | null;
    isLoading: boolean;
    error: ApiError | null;
    execute: () => Promise<T | null>;
    reset: () => void;
  }
  
  export function useApi<T>(
    apiFunction: ApiFunction<T>,
  ): UseApiReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
  
    const controllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
  
    const execute = useCallback(async (): Promise<T | null> => {
      // Cancel any previous request for this hook.
      controllerRef.current?.abort();
  
      const controller = new AbortController();
      controllerRef.current = controller;
  
      const requestId = ++requestIdRef.current;
  
      setIsLoading(true);
      setError(null);
  
      try {
        const result = await apiFunction(controller.signal);
  
        // Ignore stale results.
        if (requestId !== requestIdRef.current) {
          return null;
        }
  
        setData(result);
  
        return result;
      } catch (err) {
        if (
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return null;
        }
  
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(
                'Something went wrong',
                0,
                'unknown_error',
              );
  
        setError(apiError);
  
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          controllerRef.current = null;
        }
      }
    }, [apiFunction]);
  
    const reset = useCallback(() => {
      requestIdRef.current += 1;
  
      controllerRef.current?.abort();
      controllerRef.current = null;
  
      setData(null);
      setError(null);
      setIsLoading(false);
    }, []);
  
    useEffect(() => {
      return () => {
        requestIdRef.current += 1;
        controllerRef.current?.abort();
      };
    }, []);
  
    return {
      data,
      isLoading,
      error,
      execute,
      reset,
    };
  }
  