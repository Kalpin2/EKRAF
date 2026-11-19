import 'dotenv/config';
import { reminderQueue, scheduleContractReminders, startReminderWorker } from './reminder';

async function bootstrap() {
  const worker = startReminderWorker();
  // Daily scan at 00:00 (Asia/Jakarta) + initial scan on boot.
  await reminderQueue.upsertJobScheduler(
    'daily-contract-scan',
    { pattern: '0 0 * * *', tz: 'Asia/Jakarta' },
    { name: 'scan', opts: { attempts: 3 } },
  );
  const count = await scheduleContractReminders();
  console.log(`[workers] Contract reminder worker aktif. ${count} reminder dijadwalkan.`);

  const shutdown = async () => {
    await worker.close();
    await reminderQueue.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((e) => { console.error(e); process.exit(1); });
