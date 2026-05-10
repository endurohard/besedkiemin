import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function OfertaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#C5A55A] hover:text-[#D4AF37] mb-8 transition-colors">
          <ArrowLeft size={16} /> На главную
        </Link>
        <h1 className="text-3xl font-bold text-[#C5A55A] mb-2">Публичная оферта</h1>
        <p className="text-gray-500 text-sm mb-8">Последнее обновление: 10 мая 2025 г.</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Общие положения</h2>
            <p>Настоящий документ является публичной офертой Общества с ограниченной ответственностью «Беседки Эмин» (ИНН 0548013990, ОГРН 1220500011621, юридический адрес: 368501, Республика Дагестан, г. Избербаш, ул. Муса Манарова, д. 62) в соответствии со ст. 437 ГК РФ.</p>
            <p className="mt-2 text-gray-400">Акцептом настоящей оферты является факт оформления заказа на сайте <strong className="text-[#C5A55A]">besedkiemin.ru</strong> или посредством обращения по контактным данным, указанным на сайте.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Предмет договора</h2>
            <p className="text-gray-400">Продавец обязуется передать в собственность Покупателя изделия из дерева (беседки, мебель и иные изделия), а Покупатель обязуется принять и оплатить товар на условиях настоящей оферты.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Порядок оформления заказа</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Покупатель выбирает товар в каталоге на сайте и оставляет заявку.</li>
              <li>Менеджер связывается с Покупателем для уточнения деталей, подтверждения наличия и стоимости.</li>
              <li>Договор считается заключённым с момента подтверждения заказа Продавцом.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Цена и оплата</h2>
            <p className="text-gray-400">Цены на товары указаны в российских рублях, включая НДС (если применимо). Оплата производится способами, согласованными с менеджером: наличными, банковским переводом или иным удобным способом. Цена фиксируется на момент подтверждения заказа.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Доставка</h2>
            <p className="text-gray-400">Условия, стоимость и сроки доставки согласовываются индивидуально с менеджером при оформлении заказа. Доставка осуществляется транспортными компаниями или собственным транспортом Продавца.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Изготовление на заказ</h2>
            <p className="text-gray-400">Товары могут изготавливаться по индивидуальным размерам и параметрам. Сроки изготовления согласовываются отдельно. При заказе изготовления возможна предоплата.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Гарантия</h2>
            <p className="text-gray-400">На все изделия предоставляется гарантия качества в соответствии с законодательством РФ. Гарантийный срок составляет 12 месяцев со дня передачи товара Покупателю.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Ответственность сторон</h2>
            <p className="text-gray-400">Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязательств в соответствии с законодательством РФ. Продавец не несёт ответственности за ненадлежащее использование товара Покупателем.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Разрешение споров</h2>
            <p className="text-gray-400">Все споры разрешаются путём переговоров. При недостижении соглашения — в судебном порядке по месту нахождения Продавца.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Реквизиты продавца</h2>
            <p className="text-gray-400">
              ООО «Беседки Эмин»<br />
              ИНН: 0548013990 | КПП: 054801001 | ОГРН: 1220500011621<br />
              Адрес: 368501, Республика Дагестан, г. Избербаш, ул. Муса Манарова, д. 62<br />
              Тел.: +7 (964) 377-77-76<br />
              Email: besedkiemin.ru@yandex.ru
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
