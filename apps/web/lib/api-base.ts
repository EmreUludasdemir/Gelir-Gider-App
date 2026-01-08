const DEFAULT_INTERNAL_API_URL = 'http://api:3001';

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window !== 'undefined') {
    return '/api';
  }

  return trimTrailingSlash(process.env.INTERNAL_API_URL || DEFAULT_INTERNAL_API_URL);
};

export const getRealtimeBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && isAbsoluteUrl(envUrl)) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const apiPort = port === '3000' || port === '' ? '3001' : port;
    return `${protocol}//${hostname}:${apiPort}`;
  }

  return trimTrailingSlash(process.env.INTERNAL_API_URL || DEFAULT_INTERNAL_API_URL);
};
