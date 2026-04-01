const DEFAULT_INTERNAL_API_URL = 'http://localhost:3001';

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveSiblingApiPort = (port: string) => {
  if (!port || port === '3000') {
    return '3001';
  }

  if (port.endsWith('00')) {
    return `${Number(port) + 1}`;
  }

  return port;
};

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
  const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL;
  if (realtimeUrl) {
    return trimTrailingSlash(realtimeUrl);
  }

  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && isAbsoluteUrl(envUrl)) {
      return trimTrailingSlash(envUrl);
    }

    const { protocol, hostname, port } = window.location;
    const apiPort = resolveSiblingApiPort(port);
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

export const isRealtimeDisabled = () =>
  process.env.NEXT_PUBLIC_DISABLE_REALTIME === 'true';
