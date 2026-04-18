const XLSX = require('xlsx');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/besedki_emin'
});

// Маппинг типов продуктов
const typeMapping = {
  'Стул': '511c7ad6-6466-4a5f-9648-212302d36add',
  'Столешница': 'type-stoleshn',
  'Кресло-качалка': 'type-kreslo-kach',
  'Кресло': 'f09e98ac-882f-49bc-b9e6-b88200f02bdb',
  'Табуретка': 'type-tabur',
  'Диван': 'type-divan',
  'Кровать': 'type-krovat',
  'Тумба': 'type-tumba',
  'Скамья': 'type-skamya',
  'Лежак': 'type-lezhak',
  'Качеля': 'type-kachel',
  'Шкаф': 'type-shkaf',
  'Люстра': 'type-lustra',
  'Буфет': 'type-bufet',
  'Тахта': 'type-tahta',
  'Вешалка': 'type-veshalka',
  'Обувница': 'type-obuvnitsa',
  'Мангальные': 'type-mangal',
  'Ножки': 'type-nozhki',
};

// Этапы для расценок
const stages = ['PREPARATION', 'ASSEMBLY', 'PAINTING'];

async function importCatalog() {
  await client.connect();

  const workbook = XLSX.readFile('uploads/Каталог изделий 2.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();
    const color = row[1] ? String(row[1]).trim() : null;
    const sku = row[2] ? String(row[2]).trim() : null;

    if (!name || !sku) {
      skipped++;
      continue;
    }

    // Определяем тип продукта
    let productTypeId = null;
    const nameLower = name.toLowerCase();
    if (nameLower.includes('стул')) productTypeId = typeMapping['Стул'];
    else if (nameLower.includes('столешница')) productTypeId = typeMapping['Столешница'];
    else if (nameLower.includes('кресло-качалка') || nameLower.includes('качалка кресло')) productTypeId = typeMapping['Кресло-качалка'];
    else if (nameLower.includes('кресло')) productTypeId = typeMapping['Кресло'];
    else if (nameLower.includes('табуретка')) productTypeId = typeMapping['Табуретка'];
    else if (nameLower.includes('диван')) productTypeId = typeMapping['Диван'];
    else if (nameLower.includes('кровать')) productTypeId = typeMapping['Кровать'];
    else if (nameLower.includes('тумба')) productTypeId = typeMapping['Тумба'];
    else if (nameLower.includes('скамья') || nameLower.includes('скамейка') || nameLower.includes('лавочка')) productTypeId = typeMapping['Скамья'];
    else if (nameLower.includes('лежак')) productTypeId = typeMapping['Лежак'];
    else if (nameLower.includes('качеля') || nameLower.includes('качели')) productTypeId = typeMapping['Качеля'];
    else if (nameLower.includes('шкаф')) productTypeId = typeMapping['Шкаф'];
    else if (nameLower.includes('люстра')) productTypeId = typeMapping['Люстра'];
    else if (nameLower.includes('буфет')) productTypeId = typeMapping['Буфет'];
    else if (nameLower.includes('тахта')) productTypeId = typeMapping['Тахта'];
    else if (nameLower.includes('вешалка')) productTypeId = typeMapping['Вешалка'];
    else if (nameLower.includes('обувница')) productTypeId = typeMapping['Обувница'];
    else if (nameLower.includes('мангальные')) productTypeId = typeMapping['Мангальные'];
    else if (nameLower.includes('ножки')) productTypeId = typeMapping['Ножки'];

    if (!productTypeId) {
      console.log(`Неизвестный тип: ${name}`);
      skipped++;
      continue;
    }

    try {
      // Вставляем номенклатуру
      const nomResult = await client.query(`
        INSERT INTO nomenclatures (id, name, sku, color, product_type_id, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (sku) DO UPDATE SET name = $1, color = $3, updated_at = NOW()
        RETURNING id
      `, [name, sku, color, productTypeId]);

      const nomenclatureId = nomResult.rows[0].id;

      // Создаём расценки для каждого этапа
      for (const stage of stages) {
        await client.query(`
          INSERT INTO work_rates (id, nomenclature_id, stage, price_per_unit, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, 100, NOW(), NOW())
          ON CONFLICT (nomenclature_id, stage) DO UPDATE SET price_per_unit = 100, updated_at = NOW()
        `, [nomenclatureId, stage]);
      }

      imported++;
    } catch (err) {
      console.error(`Ошибка: ${name} (${sku}):`, err.message);
      skipped++;
    }
  }

  console.log(`\nИмпорт завершён:`);
  console.log(`- Импортировано: ${imported}`);
  console.log(`- Пропущено: ${skipped}`);

  // Статистика
  const nomCount = await client.query('SELECT COUNT(*) FROM nomenclatures');
  const rateCount = await client.query('SELECT COUNT(*) FROM work_rates WHERE nomenclature_id IS NOT NULL');

  console.log(`\nВ базе:`);
  console.log(`- Номенклатура: ${nomCount.rows[0].count}`);
  console.log(`- Расценок по изделиям: ${rateCount.rows[0].count}`);

  await client.end();
}

importCatalog().catch(console.error);
