type LogLevel = 'INFO' | 'ERROR';

type LogPayload = {
  level: LogLevel;
  timestamp: string;
  source: string;
  message: string;
  details?: Record<string, unknown>;
};

function write(payload: LogPayload) {
  const serialized = JSON.stringify(payload);
  if (payload.level === 'ERROR') {
    // eslint-disable-next-line no-console
    console.error(serialized);
    return;
  }
  // eslint-disable-next-line no-console
  console.info(serialized);
}

export function logClientInfo(source: string, message: string, details?: Record<string, unknown>) {
  write({
    level: 'INFO',
    timestamp: new Date().toISOString(),
    source,
    message,
    details
  });
}

export function logClientError(source: string, message: string, details?: Record<string, unknown>) {
  write({
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    source,
    message,
    details
  });
}
