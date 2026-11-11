
export interface SSEEvent {
    event: string;
    data: string;
    id?: string;
    retry?: number;
  }
  
  export class SSEParser {
    private buffer = '';
  
    /**
     * Feed each incoming network chunk into the parser.
     * Returns all complete events found in that chunk.
     */
    push(chunk: string): SSEEvent[] {
      this.buffer += chunk;
  
      const events: SSEEvent[] = [];
  
      while (true) {
        const boundary = this.findEventBoundary();
  
        if (!boundary) {
          break;
        }
  
        const rawEvent = this.buffer.slice(0, boundary.index);
  
        this.buffer = this.buffer.slice(
          boundary.index + boundary.length,
        );
  
        const parsed = this.parseEvent(rawEvent);
  
        if (parsed) {
          events.push(parsed);
        }
      }
  
      return events;
    }
  
    /**
     * Parse one complete SSE event.
     */
    private parseEvent(raw: string): SSEEvent | null {
      let event = '';
      let id: string | undefined;
      let retry: number | undefined;
  
      const dataLines: string[] = [];
  
      const lines = raw.split(/\r\n|\r|\n/);
  
      for (const line of lines) {
        // Comments and keep-alive lines.
        if (!line || line.startsWith(':')) {
          continue;
        }
  
        const colonIndex = line.indexOf(':');
  
        const field =
          colonIndex === -1
            ? line
            : line.slice(0, colonIndex);
  
        let value =
          colonIndex === -1
            ? ''
            : line.slice(colonIndex + 1);
  
        if (value.startsWith(' ')) {
          value = value.slice(1);
        }
  
        switch (field) {
          case 'event':
            event = value;
            break;
  
          case 'data':
            dataLines.push(value);
            break;
  
          case 'id':
            if (!value.includes('\0')) {
              id = value;
            }
            break;
  
          case 'retry': {
            const parsedRetry = Number(value);
  
            if (
              Number.isInteger(parsedRetry) &&
              parsedRetry >= 0
            ) {
              retry = parsedRetry;
            }
            break;
          }
  
          default:
            // Ignore unknown SSE fields.
            break;
        }
      }
  
      if (dataLines.length === 0) {
        return null;
      }
  
      return {
        event: event || 'message',
        data: dataLines.join('\n'),
        ...(id !== undefined ? { id } : {}),
        ...(retry !== undefined ? { retry } : {}),
      };
    }
  
    /**
     * Find the first blank line separating SSE events.
     */
    private findEventBoundary():
      | { index: number; length: number }
      | null {
      const match = /\r\n\r\n|\n\n|\r\r/.exec(this.buffer);
  
      if (!match || match.index === undefined) {
        return null;
      }
  
      return {
        index: match.index,
        length: match[0].length,
      };
    }
  
    /**
     * Call when the connection ends.
     * An incomplete event is intentionally discarded.
     */
    reset() {
      this.buffer = '';
    }
  }
  