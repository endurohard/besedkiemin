import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем заполнение каталога демо-данными...');

  // Создаём категории
  const besedki = await prisma.catalogCategory.create({
    data: {
      name: 'Беседки',
      slug: 'besedki',
      description: 'Восьмигранные деревянные беседки для вашего участка',
      order: 1,
      isActive: true,
    },
  });

  const arki = await prisma.catalogCategory.create({
    data: {
      name: 'Арки и павильоны',
      slug: 'arki-pavilony',
      description: 'Декоративные арки, навесы и перголы',
      order: 2,
      isActive: true,
    },
  });

  const kacheli = await prisma.catalogCategory.create({
    data: {
      name: 'Парковые качели',
      slug: 'parkovye-kacheli',
      description: 'Комфортные качели для отдыха',
      order: 3,
      isActive: true,
    },
  });

  const mebel = await prisma.catalogCategory.create({
    data: {
      name: 'Садовая мебель',
      slug: 'sadovaya-mebel',
      description: 'Столы, стулья, кресла для сада',
      order: 4,
      isActive: true,
    },
  });

  console.log('Категории созданы!');

  // Создаём товары
  await prisma.catalogProduct.create({
    data: {
      name: 'Беседка восьмигранная "Классик"',
      slug: 'besedka-klassik',
      shortDesc: 'Классическая восьмигранная беседка из натурального дерева',
      description:
        'Восьмигранная беседка "Классик" изготовлена из качественной древесины. Идеально подходит для семейного отдыха и приема гостей. Вместительность до 12 человек.',
      dimensions: '4x4 м, высота 3.2 м',
      material: 'Сосна, ель',
      price: 85000,
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      ],
      categoryId: besedki.id,
      order: 1,
      isActive: true,
      isFeatured: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Беседка восьмигранная "Премиум"',
      slug: 'besedka-premium',
      shortDesc: 'Премиальная беседка с декоративными элементами',
      description:
        'Роскошная беседка с резными элементами и покрытием из битумной черепицы. Включает встроенные лавки и стол.',
      dimensions: '5x5 м, высота 3.5 м',
      material: 'Кедр',
      price: 145000,
      images: [
        'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
      ],
      categoryId: besedki.id,
      order: 2,
      isActive: true,
      isFeatured: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Арка садовая "Романтика"',
      slug: 'arka-romantika',
      shortDesc: 'Элегантная деревянная арка для сада',
      description:
        'Декоративная арка "Романтика" станет украшением вашего сада. Идеально подходит для вьющихся растений.',
      dimensions: '2x3 м',
      material: 'Сосна',
      price: 12000,
      images: [
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
      ],
      categoryId: arki.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Пергола с навесом',
      slug: 'pergola-s-navesom',
      shortDesc: 'Комфортная пергола для зоны отдыха',
      description:
        'Прочная деревянная пергола с тканевым навесом. Создаст уютную тень в жаркий день.',
      dimensions: '3x4 м, высота 2.5 м',
      material: 'Лиственница',
      price: 48000,
      images: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      ],
      categoryId: arki.id,
      order: 2,
      isActive: true,
      isFeatured: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Качели садовые "Релакс"',
      slug: 'kacheli-relaks',
      shortDesc: 'Удобные качели на 3 человека',
      description:
        'Комфортные качели "Релакс" с мягкими подушками. Каркас из металла с деревянными элементами.',
      dimensions: '2.2x1.5 м',
      material: 'Металл, дерево, ткань',
      price: 28000,
      images: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
      ],
      categoryId: kacheli.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Стол садовый "Семейный"',
      slug: 'stol-semejnyj',
      shortDesc: 'Большой стол для всей семьи',
      description:
        'Просторный деревянный стол для семейных обедов на свежем воздухе. Вмещает до 10 человек.',
      dimensions: '2.5x1 м, высота 0.75 м',
      material: 'Сосна',
      price: 22000,
      images: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      ],
      categoryId: mebel.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.catalogProduct.create({
    data: {
      name: 'Кресло-качалка садовое',
      slug: 'kreslo-kachalka',
      shortDesc: 'Уютное кресло для отдыха',
      description:
        'Классическое кресло-качалка из натурального дерева. Покрыто специальным составом для защиты от влаги.',
      dimensions: '0.8x1.2 м',
      material: 'Береза',
      price: 15000,
      images: [
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      ],
      categoryId: mebel.id,
      order: 2,
      isActive: true,
      isFeatured: true,
    },
  });

  console.log('Товары созданы!');
  console.log('Каталог успешно заполнен демо-данными!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
