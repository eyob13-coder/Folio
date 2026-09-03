import { calculateSha256 } from './hashing.utils';

describe('calculateSha256', () => {
  it('should generate consistent SHA-256 hex string for given text buffer', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('Folio Offline Digital Library');
    const hash = await calculateSha256(data.buffer);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
    expect(typeof hash).toBe('string');
  });

  it('should produce distinct hashes for different file contents', async () => {
    const encoder = new TextEncoder();
    const hash1 = await calculateSha256(encoder.encode('Book A content').buffer);
    const hash2 = await calculateSha256(encoder.encode('Book B content').buffer);

    expect(hash1).not.toEqual(hash2);
  });
});
