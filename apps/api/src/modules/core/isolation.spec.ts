import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CoreService } from './core.module';

function setup(userResult: any = null) {
  const prisma: any = {
    divisionMember: { findMany: vi.fn().mockResolvedValue([]), upsert: vi.fn().mockResolvedValue({ id: 'm1' }), findFirst: vi.fn().mockResolvedValue({ id: 'm1' }), update: vi.fn() },
    user: { findFirst: vi.fn().mockResolvedValue(userResult) },
    division: { create: vi.fn() },
  };
  const audit: any = { log: vi.fn() };
  return { service: new CoreService(prisma, audit), prisma, audit };
}

describe('Isolasi data lintas organisasi/divisi', () => {
  it('memfilter members berdasarkan orgId dan divisionId', async () => {
    const { service, prisma } = setup();
    await service.members('org-A', 'div-1');
    expect(prisma.divisionMember.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ divisionId: 'div-1', user: { orgId: 'org-A' } }),
    }));
  });

  it('menolak penambahan user dari organisasi lain', async () => {
    const { service } = setup(null);
    await expect(service.addMember('org-A', { userId: 'foreign', divisionId: 'div-1' }, { id: 'actor' }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('mencatat perubahan roster ke audit log', async () => {
    const { service, prisma, audit } = setup({ id: 'u1' });
    await service.addMember('org-A', { userId: 'u1', divisionId: 'div-1' }, { id: 'actor' });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ actionType: 'ROSTER_CHANGE', orgId: 'org-A' }));
    expect(prisma.divisionMember.upsert).toHaveBeenCalled();
  });
});
