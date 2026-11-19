import 'dotenv/config';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@nexus/db';
import { CONTRACT_REMINDER_TIERS } from '@nexus/shared';
import { connection } from './connection';

export const prisma = new PrismaClient();
export const reminderQueue = new Queue('contract-reminders', { connection });

const DAY = 86_400_000;

/** Scan all contracts and enqueue one reminder per active alert tier (H-90/60/30/14). */
export async function scheduleContractReminders() {
  const contracts = await prisma.contract.findMany({
    where: { endDate: { gte: new Date(Date.now() - DAY) } },
    include: { user: { select: { orgId: true, ign: true } } },
  });
  let enqueued = 0;
  for (const c of contracts) {
    const daysLeft = Math.ceil((c.endDate.getTime() - Date.now()) / DAY);
    for (const tier of CONTRACT_REMINDER_TIERS) {
      if (daysLeft > tier) continue;
      const jobId = `contract-${c.id}-h${tier}`;
      const exists = await reminderQueue.getJob(jobId);
      if (exists) continue;
      await reminderQueue.add(
        'reminder',
        { contractId: c.id, userId: c.userId, orgId: c.user.orgId, ign: c.user.ign, tier, daysLeft, endDate: c.endDate.toISOString() },
        { jobId, delay: daysLeft === tier ? 0 : Math.max(0, (daysLeft - tier) * DAY), attempts: 3, removeOnComplete: 200 },
      );
      enqueued += 1;
    }
  }
  return enqueued;
}

async function processJob(job: Job) {
  if (job.name === 'scan') {
    return { enqueued: await scheduleContractReminders() };
  }
  const { contractId, userId, orgId, ign, tier, endDate } = job.data as any;
  await prisma.notification.create({
    data: {
      orgId, userId, type: 'CONTRACT',
      title: `Kontrak berakhir dalam ${tier} hari`,
      body: `Kontrak ${ign} akan berakhir pada ${new Date(endDate).toLocaleDateString('id-ID')}. Segera proses perpanjangan.`,
    },
  });
  await prisma.auditLog.create({
    data: {
      orgId, actorUserId: userId, actionType: 'CONTRACT_REMINDER',
      targetResource: contractId, metadata: { tier, scheduledBy: 'bullmq' },
    },
  });
  return { notified: userId, tier };
}

export function startReminderWorker() {
  const worker = new Worker('contract-reminders', processJob, { connection, concurrency: 5 });
  worker.on('failed', (job, err) => console.error(`[worker] ${job?.name} gagal:`, err.message));
  worker.on('completed', (job) => console.log(`[worker] ${job.name} selesai`, job.returnvalue));
  return worker;
}
