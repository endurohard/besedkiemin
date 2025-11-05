import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      sipServer: {
        not: null
      }
    },
    select: {
      id: true,
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

  console.log('Users with SIP settings:\n');
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`SIP Server: ${user.sipServer}`);
    console.log(`SIP User: ${user.sipUser}`);
    console.log(`SIP Password: ${user.sipPassword}`);
    console.log(`SIP Port: ${user.sipPort}`);
    console.log(`WebSocket Port: ${user.sipWsPort}`);
    console.log(`\nFull WebSocket URL: wss://${user.sipServer}:${user.sipWsPort}/ws`);
    console.log(`SIP URI: sip:${user.sipUser}@${user.sipServer}`);
    console.log('---\n');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
