
export const API_ENDPOINTS = {
    ME: '/v1/me',
  
    ACCOUNTS: '/v1/accounts',
  
    TRANSACTIONS: '/v1/transactions',
  
    SUGGESTIONS: '/v1/chat/suggestions',
  
    CHAT_MESSAGES: '/v1/chat/messages',
  
    CHAT_HISTORY: '/v1/chat/messages',
  
    CHAT_CANCEL: (messageId: string) =>
      `/v1/chat/messages/${encodeURIComponent(messageId)}/cancel`,
  
    CHAT_MESSAGE: (messageId: string) =>
      `/v1/chat/messages/${encodeURIComponent(messageId)}`,
  
    CHAT_STREAM: (messageId: string) =>
      `/v1/chat/messages/${encodeURIComponent(messageId)}/stream`,
  
    WIDGET_ACTION: (widgetId: string, actionId: string) =>
      `/v1/chat/widgets/${encodeURIComponent(widgetId)}/actions/${encodeURIComponent(actionId)}`,
  } as const;
  