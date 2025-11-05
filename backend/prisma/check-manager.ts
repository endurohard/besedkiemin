import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const manager = await prisma.user.findFirst({
    where: {
      email: 'manager@example.com'
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      sipServer: true,
      sipUser: true,
      sipPassword: true,
      sipPort: true,
      sipWsPort: true
    }
  });

  console.log('📋 Данные менеджера в базе:');
  console.log(JSON.stringify(manager, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
