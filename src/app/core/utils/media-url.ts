import { environment } from '../../../environments/environment';

/**
 * Images (clinic logo, doctor photos) are stored by the API as `/api/v1/public/media/<id>`. The API is served at a
 * different address per environment (e.g. `/cliniva/api/v1` on staging), so the path is resolved against it.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const prefix = '/api/v1/';
  return path.startsWith(prefix) ? `${environment.apiUrl}/${path.slice(prefix.length)}` : path;
}
