import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Обновление SIP настроек для локального Asterisk...\n');

  // Обновляем менеджера
  const manager = await prisma.user.update({
    where: { email: 'manager@example.com' },
    data: {
      sipServer: 'localhost',
      sipUser: '7779',
      sipPassword: '90PQchO8DxW',
      sipPort: 5060,
      sipWsPort: 8088,
    },
  });

  console.log(`✓ Обновлен менеджер: ${manager.email}`);
  console.log(`  SIP URI: sip:${manager.sipUser}@${manager.sipServer}`);
  console.log(`  WebSocket: ws://${manager.sipServer}:${manager.sipWsPort}`);

  // Обновляем складиста если есть
  try {
    const warehouse = await prisma.user.update({
      where: { email: 'warehouse@example.com' },
      data: {
        sipServer: 'localhost',
        sipUser: '7781',
        sipPassword: 'password123',
        sipPort: 5060,
        sipWsPort: 8088,
      },
    });

    console.log(`\n✓ Обновлен складист: ${warehouse.email}`);
    console.log(`  SIP URI: sip:${warehouse.sipUser}@${warehouse.sipServer}`);
    console.log(`  WebSocket: ws://${warehouse.sipServer}:${warehouse.sipWsPort}`);
  } catch (error) {
    console.log('\n⚠ Складист не найден, пропускаем');
  }

  console.log('\n✅ Готово! Теперь можно использовать локальный Asterisk');
  console.log('\nКоманды для запуска:');
  console.log('1. docker-compose up -d asterisk');
  console.log('2. Перезапустите frontend для применения изменений');
  console.log('\nДля проверки Asterisk:');
  console.log('docker exec -it besedki_asterisk asterisk -rvvv');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
