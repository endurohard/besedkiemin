import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding product types...');

  const productTypes = [
    {
      name: 'Стол',
      description: 'Обеденные и кофейные столы',
      isActive: true,
    },
    {
      name: 'Стул',
      description: 'Стулья и табуреты',
      isActive: true,
    },
    {
      name: 'Шкаф',
      description: 'Шкафы и комоды',
      isActive: true,
    },
    {
      name: 'Полка',
      description: 'Полки и стеллажи',
      isActive: true,
    },
    {
      name: 'Кровать',
      description: 'Кровати и основания для матрасов',
      isActive: true,
    },
  ];

  for (const typeData of productTypes) {
    const existingType = await prisma.productType.findUnique({
      where: { name: typeData.name },
    });

    if (!existingType) {
      await prisma.productType.create({
        data: typeData,
      });
      console.log(`✅ Created product type: ${typeData.name}`);
    } else {
      console.log(`⏭️  Product type already exists: ${typeData.name}`);
    }
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
