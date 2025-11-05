const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Удаление всех старых задач...');
  const result = await prisma.task.deleteMany({});
  console.log(`Удалено ${result.count} задач`);
  
  console.log('\n✅ Готово! Теперь создайте новый заказ через браузер для тестирования');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
