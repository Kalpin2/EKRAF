import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PlayerService } from './player.module';

const player = { id: 'u-1', orgId: 'org-A', globalRole: 'PLAYER', ign: 'FrostByte', fullName: 'Aditya' };
const member = { userId: 'u-1', divisionId: 'div-1', divisionRole: 'PLAYER', rosterStatus: 'STARTING', primaryRole: 'Duelist', agentPool: [], division: { id: 'div-1', gameTitle: 'Valorant' } };

function setup() {
  const prisma: any = {
    divisionMember: {
      findFirst: vi.fn().mockResolvedValue(member),
      update: vi.fn().mockResolvedValue(member),
    },
    playbook: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({ id: 'pb-1' }),
    },
    playbookReadReceipt: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ id: 'r1' }),
      upsert: vi.fn().mockResolvedValue({ id: 'r1' }),
    },
    actionItem: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    userDevice: { findMany: vi.fn().mockResolvedValue([]), upsert: vi.fn(), findFirst: vi.fn() },
    user: { update: vi.fn() },
  };
  const audit: any = { log: vi.fn() };
  return { service: new PlayerService(prisma, audit), prisma, audit };
}

describe('Player workspace — isolasi RBAC & divisi', () => {
  it('menolak akun non-player mengakses endpoint player', async () => {
    const { service } = setup();
    await expect(service.context({ ...player, globalRole: 'HEAD_COACH' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('memfilter keanggotaan berdasarkan userId dan orgId', async () => {
    const { service, prisma } = setup();
    const ctx = await service.context(player);
    expect(ctx.divisionId).toBe('div-1');
    expect(prisma.divisionMember.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'u-1', division: { orgId: 'org-A' }, divisionRole: 'PLAYER' }),
    }));
  });

  it('hanya mengambil playbook dari divisi pemain', async () => {
    const { service, prisma } = setup();
    await service.playbooks(player);
    expect(prisma.playbook.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ divisionId: 'div-1', isArchived: false }),
    }));
  });

  it('menolak konfirmasi baca tanpa receipt', async () => {
    const { service } = setup();
    await expect(service.acknowledge(player, 'pb-1', 30)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak update action item milik pemain lain', async () => {
    const { service } = setup();
    await expect(service.updateActionItem(player, 'act-9', 'DONE')).rejects.toBeInstanceOf(NotFoundException);
  });
});
