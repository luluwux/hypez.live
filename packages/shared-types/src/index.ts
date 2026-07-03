export * from './server.interface.js';
export * from './user.interface.js';
export * from './pagination.interface.js';
export * from './enums.js';
export * from './categories.js';

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
