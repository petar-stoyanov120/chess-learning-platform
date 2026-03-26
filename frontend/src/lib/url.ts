import { API_URL } from './constants';

export function getBaseUrl(): string {
  try {
    const url = new URL(API_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return API_URL.replace(/\/api\/v\d+$/, '');
  }
}
