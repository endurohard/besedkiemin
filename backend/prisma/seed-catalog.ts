import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение каталога...');

  // Создание категорий
  const besedki = await prisma.catalogCategory.upsert({
    where: { slug: 'besedki' },
    update: {},
    create: { name: 'Беседки', slug: 'besedki', description: 'Красивые и прочные беседки', order: 1, isActive: true },
  });

  const arki = await prisma.catalogCategory.upsert({
    where: { slug: 'arki-i-navesy' },
    update: {},
    create: { name: 'Арки и навесы', slug: 'arki-i-navesy', description: 'Арки, перголы и навесы', order: 2, isActive: true },
  });

  const kacheli = await prisma.catalogCategory.upsert({
    where: { slug: 'kacheli' },
    update: {},
    create: { name: 'Качели', slug: 'kacheli', description: 'Парковые качели', order: 3, isActive: true },
  });

  const mebel = await prisma.catalogCategory.upsert({
    where: { slug: 'mebel' },
    update: {},
    create: { name: 'Мебель', slug: 'mebel', description: 'Садовая мебель', order: 4, isActive: true },
  });

  const vazony = await prisma.catalogCategory.upsert({
    where: { slug: 'vazony' },
    update: {},
    create: { name: 'Вазоны', slug: 'vazony', description: 'Декоративные вазоны', order: 5, isActive: true },
  });

  console.log('✅ Категории созданы');

  // Создание товаров
  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-vosmigrannik' },
    update: {},
    create: { name: 'Беседка восьмигранник', slug: 'besedka-vosmigrannik', description: 'Классическая восьмигранная беседка. Размер 3.5x3.5 м.', price: 285000, categoryId: besedki.id, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'], isActive: true, isFeatured: true, order: 1 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-standartnaya' },
    update: {},
    create: { name: 'Беседка стандартная', slug: 'besedka-standartnaya', description: 'Просторная беседка. Размер 3x4 м.', price: 195000, categoryId: besedki.id, images: ['https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800'], isActive: true, order: 2 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-s-mangalnoy-zonoy' },
    update: {},
    create: { name: 'Беседка с мангальной зоной', slug: 'besedka-s-mangalnoy-zonoy', description: 'Беседка с зоной для шашлыка. Размер 4x5 м.', price: 345000, categoryId: besedki.id, images: ['https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800'], isActive: true, isFeatured: true, order: 3 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'arka-sadovaya' },
    update: {},
    create: { name: 'Арка садовая', slug: 'arka-sadovaya', description: 'Декоративная арка. Размер 2.5x1.2 м.', price: 35000, categoryId: arki.id, images: ['https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800'], isActive: true, order: 1 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'pergola' },
    update: {},
    create: { name: 'Пергола', slug: 'pergola', description: 'Элегантная пергола. Размер 3x3 м.', price: 125000, categoryId: arki.id, images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'], isActive: true, order: 2 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'naves-dlya-avtomobilya' },
    update: {},
    create: { name: 'Навес для автомобиля', slug: 'naves-dlya-avtomobilya', description: 'Прочный навес. Размер 6x3 м.', price: 185000, categoryId: arki.id, images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800'], isActive: true, order: 3 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'kachelya-lavochka' },
    update: {},
    create: { name: 'Качеля-лавочка', slug: 'kachelya-lavochka', description: 'Парковые качели на 3 человека. Размер 2x1.5 м.', price: 45000, categoryId: kacheli.id, images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800'], isActive: true, isFeatured: true, order: 1 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'tahta-sadovaya' },
    update: {},
    create: { name: 'Тахта садовая', slug: 'tahta-sadovaya', description: 'Удобная тахта. Размер 180x80 см.', price: 28500, categoryId: mebel.id, images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'], isActive: true, order: 1 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'kreslo-kachalka-lord' },
    update: {},
    create: { name: 'Кресло-качалка Лорд', slug: 'kreslo-kachalka-lord', description: 'Классическое кресло-качалка. Размер 70x90 см.', price: 18500, categoryId: mebel.id, images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'], isActive: true, order: 2 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'stol-kafelnyy' },
    update: {},
    create: { name: 'Стол кафельный', slug: 'stol-kafelnyy', description: 'Прочный стол с плиткой. Размер 120x80 см.', price: 22000, categoryId: mebel.id, images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'], isActive: true, order: 3 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'lezhak-parkovyy' },
    update: {},
    create: { name: 'Лежак парковый', slug: 'lezhak-parkovyy', description: 'Комфортный лежак. Размер 180x60 см.', price: 15900, categoryId: mebel.id, images: ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'], isActive: true, order: 4 },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'vazon-sadovyy' },
    update: {},
    create: { name: 'Вазон садовый', slug: 'vazon-sadovyy', description: 'Декоративный вазон. Размер 50x50 см.', price: 8500, categoryId: vazony.id, images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'], isActive: true, order: 1 },
  });

  console.log('✅ Товары созданы (12 шт)');
  console.log('\n🎉 Каталог заполнен!');
}

main().catch((e) => { console.error('❌ Ошибка:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
