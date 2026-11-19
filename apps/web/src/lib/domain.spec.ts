import { describe, it, expect } from 'vitest';
import { prizePoolSplit, hasPermission, GlobalRole, PERMISSIONS, daysUntil } from '@nexus/shared';

describe('Domain helpers (shared)', () => {
  it('menghitung prize pool bersih dan per pemain', () => {
    const r = prizePoolSplit(200_000_000, 10, { players: 70, staff: 15, org: 15, playerCount: 5 });
    expect(r.net).toBe(180_000_000);
    expect(r.perPlayer).toBe(25_200_000);
  });

  it('memberikan permission RBAC yang benar', () => {
    expect(hasPermission(GlobalRole.PLAYER, PERMISSIONS.PLAYBOOK_ACK)).toBe(true);
    expect(hasPermission(GlobalRole.PLAYER, PERMISSIONS.PLAYBOOK_CREATE)).toBe(false);
    expect(hasPermission(GlobalRole.ORG_ADMIN, PERMISSIONS.FINANCE_MANAGE)).toBe(true);
  });

  it('menghitung hari hingga kontrak', () => {
    const soon = new Date(Date.now() + 14 * 86_400_000);
    expect(daysUntil(soon)).toBeGreaterThanOrEqual(13);
    expect(daysUntil(soon)).toBeLessThanOrEqual(14);
  });
});
