import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  // Хэшируем пароль
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'owner@example.com',
      password: hashedPassword,
      firstName: 'Владелец',
      lastName: 'Системы',
      role: UserRole.OWNER,
      isActive: true,
    },
    {
      email: 'manager@example.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Менеджеров',
      role: UserRole.MANAGER,
      isActive: true,
    },
    {
      email: 'designer@example.com',
      password: hashedPassword,
      firstName: 'Петр',
      lastName: 'Проектировщиков',
      role: UserRole.DESIGNER,
      isActive: true,
    },
    {
      email: 'preparer@example.com',
      password: hashedPassword,
      firstName: 'Сергей',
      lastName: 'Заготовщиков',
      role: UserRole.PREPARER,
      isActive: true,
    },
    {
      email: 'painter@example.com',
      password: hashedPassword,
      firstName: 'Алексей',
      lastName: 'Маляров',
      role: UserRole.PAINTER,
      isActive: true,
    },
    {
      email: 'warehouse@example.com',
      password: hashedPassword,
      firstName: 'Дмитрий',
      lastName: 'Складистов',
      role: UserRole.WAREHOUSE,
      isActive: true,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: userData,
      });
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`⏭️  User already exists: ${userData.email}`);
    }
  }

  console.log('✨ Seeding completed!');
  console.log('\n📝 Test credentials:');
  console.log('Email: owner@example.com | Password: password123');
  console.log('Email: manager@example.com | Password: password123');
  console.log('Email: designer@example.com | Password: password123');
  console.log('Email: preparer@example.com | Password: password123');
  console.log('Email: painter@example.com | Password: password123');
  console.log('Email: warehouse@example.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
