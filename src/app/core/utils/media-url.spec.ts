import { mediaUrl } from './media-url';
import { environment } from '../../../environments/environment';

describe('mediaUrl', () => {
  it('resolves a stored API path against this environment\'s API address', () => {
    expect(mediaUrl('/api/v1/public/media/abc')).toBe(`${environment.apiUrl}/public/media/abc`);
  });

  it('leaves full addresses and empty values alone', () => {
    expect(mediaUrl('https://cdn.example.com/x.png')).toBe('https://cdn.example.com/x.png');
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });
});
