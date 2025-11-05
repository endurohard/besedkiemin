import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Обновляем порт WebSocket для всех пользователей с SIP настройками
  const result = await prisma.user.updateMany({
    where: {
      sipServer: {
        not: null
      }
    },
    data: {
      sipWsPort: 8088
    }
  });

  console.log(`Updated ${result.count} users with WebSocket port 8088`);

  // Показываем обновленные данные
  const users = await prisma.user.findMany({
    where: {
      sipServer: {
        not: null
      }
    },
    select: {
      email: true,
      sipServer: true,
      sipUser: true,
      sipPort: true,
      sipWsPort: true
    }
  });

  console.log('\nUsers with SIP settings:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
