
import { BASE_URL, SESSION_TOKEN } from './config';
import { ApiError, ApiRequestOptions } from '../types/api';

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
  } = options;

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        Authorization: `Bearer ${SESSION_TOKEN}`,
        ...headers,
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
      signal,
    });
  } catch (error) {
    // Preserve cancellation instead of treating it as a network failure.
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(
      'Unable to connect. Please check your internet connection.',
      0,
      'network_error',
    );
  }

  const responseText = await response.text();

  let result: unknown = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new ApiError(
          'Invalid response from server',
          response.status,
          'invalid_response',
        );
      }
    }
  }

  if (!response.ok) {
    const errorResponse = result as {
      error?: {
        code?: string;
        message?: string;
      };
    } | null;

    throw new ApiError(
      errorResponse?.error?.message ??
        `Request failed with status ${response.status}`,
      response.status,
      errorResponse?.error?.code ??
        'unknown_error',
    );
  }

  return result as T;
}
