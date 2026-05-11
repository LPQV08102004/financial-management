
import { ApiConfig } from '../types/config';

const config: ApiConfig = {
  port: process.env.NEXT_PUBLIC_API_PORT || '8000',
  prefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1',
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || ''
};

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (config.baseUrl) {
    return sanitizeBaseUrl(config.baseUrl);
  }

  return `http://localhost:${config.port}${config.prefix}`;
}

export const API_BASE_URL: string = getApiBaseUrl();