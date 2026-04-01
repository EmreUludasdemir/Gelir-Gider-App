const DEFAULT_INTERNAL_API_URL = 'http://localhost:3001';

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    return trimTrailingSlash(envUrl || '/api');
  }

  const internalUrl = process.env.INTERNAL_API_URL;
  if (internalUrl) {
    return trimTrailingSlash(internalUrl);
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl && isAbsoluteUrl(publicUrl)) {
    return trimTrailingSlash(publicUrl);
  }

  return DEFAULT_INTERNAL_API_URL;
};

export const getRealtimeBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && isAbsoluteUrl(envUrl)) {
      return trimTrailingSlash(envUrl);
    }

    const { protocol, hostname, port } = window.location;
    const apiPort = port === '3000' || port === '' ? '3001' : port;
    return `${protocol}//${hostname}:${apiPort}`;
  }

  const internalUrl = process.env.INTERNAL_API_URL;
  if (internalUrl) {
    return trimTrailingSlash(internalUrl);
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl && isAbsoluteUrl(publicUrl)) {
    return trimTrailingSlash(publicUrl);
  }

  return DEFAULT_INTERNAL_API_URL;
};
