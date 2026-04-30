// src/api/config.ts
import { ApiConfig } from '../types/config';

const config: ApiConfig = {
  port: process.env.NEXT_PUBLIC_API_PORT || '8000',
  prefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1',
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || ''
};

/**
 * Hàm làm sạch URL để đảm bảo không có dấu gạch chéo dư thừa ở cuối.
 */
function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Xác định Base URL cho toàn bộ ứng dụng.
 * Ưu tiên lấy từ biến môi trường, nếu không có sẽ mặc định về localhost của Docker Desktop.
 */
export function getApiBaseUrl(): string {
  if (config.baseUrl) {
    return sanitizeBaseUrl(config.baseUrl);
  }

  // Mặc định kết nối tới Docker Desktop thông qua localhost
  return `http://localhost:${config.port}${config.prefix}`;
}

export const API_BASE_URL: string = getApiBaseUrl();