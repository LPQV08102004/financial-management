// src/types/config.ts

export interface ApiConfig {
  baseUrl: string;
  port: string;
  prefix: string;
}

// Nếu sau này bạn có thêm các cấu hình khác như Timeout, 
// Retry... bạn cũng sẽ định nghĩa ở đây.