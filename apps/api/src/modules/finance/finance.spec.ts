import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../common/crypto.util';
import { prizePoolSplit, CONTRACT_REMINDER_TIERS } from '@nexus/shared';

describe('Enkripsi AES-256-GCM', () => {
  it('mengenkripsi dan mendekripsi nilai kembali dengan benar', () => {
    const secret = '48000000';
    const sealed = encrypt(secret);
    expect(sealed.encrypted).not.toBe(secret);
    expect(sealed.iv).toHaveLength(24);
    expect(decrypt(sealed.encrypted, sealed.iv, sealed.authTag)).toBe(secret);
  });

  it('menghasilkan IV berbeda untuk plaintext sama', () => {
    const a = encrypt('same');
    const b = encrypt('same');
    expect(a.iv).not.toBe(b.iv);
  });
});

describe('Kalkulator Prize Pool', () => {
  it('menghitung pajak dan pembagian sesuai persentase', () => {
    const result = prizePoolSplit(100_000_000, 10, { players: 70, staff: 15, org: 15, playerCount: 5 });
    expect(result.tax).toBe(10_000_000);
    expect(result.net).toBe(90_000_000);
    expect(result.playerPool).toBe(63_000_000);
    expect(result.perPlayer).toBe(12_600_000);
  });
});

describe('Tier pengingat kontrak', () => {
  it('mencakup H-90, H-60, H-30, H-14', () => {
    expect(CONTRACT_REMINDER_TIERS).toEqual([90, 60, 30, 14]);
  });
});
