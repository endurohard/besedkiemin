import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating manager SIP credentials...');

  const manager = await prisma.user.findFirst({
    where: {
      email: 'manager@example.com'
    }
  });

  if (!manager) {
    console.error('Manager not found!');
    return;
  }

  const updated = await prisma.user.update({
    where: {
      id: manager.id
    },
    data: {
      sipServer: 'www.it005.ru',
      sipUser: '7779',
      sipPassword: '90PQchO8DxW',
      sipPort: 5060,
      sipWsPort: 8089 // WebSocket порт для Yeastar S100
    }
  });

  console.log('✅ Manager SIP credentials updated:');
  console.log('   Server:', updated.sipServer);
  console.log('   User:', updated.sipUser);
  console.log('   SIP Port:', updated.sipPort);
  console.log('   WebSocket Port:', updated.sipWsPort);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
