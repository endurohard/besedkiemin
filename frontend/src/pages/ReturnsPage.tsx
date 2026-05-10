import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#C5A55A] hover:text-[#D4AF37] mb-8 transition-colors">
          <ArrowLeft size={16} /> На главную
        </Link>
        <h1 className="text-3xl font-bold text-[#C5A55A] mb-2">Правила возврата и обмена</h1>
        <p className="text-gray-500 text-sm mb-8">Последнее обновление: 10 мая 2025 г.</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Общие положения</h2>
            <p className="text-gray-400">Возврат и обмен товаров осуществляется в соответствии с Законом РФ от 07.02.1992 № 2300-1 «О защите прав потребителей» (ст. 26.1) и Гражданским кодексом РФ.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Возврат товара надлежащего качества</h2>
            <p className="text-gray-400">Покупатель вправе отказаться от товара надлежащего качества в течение <strong className="text-white">7 дней</strong> с момента его получения (при дистанционной продаже) при условии:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>Товар не был в употреблении</li>
              <li>Сохранены товарный вид, потребительские свойства и упаковка</li>
              <li>Имеются документы, подтверждающие факт покупки</li>
            </ul>
            <p className="mt-2 text-gray-500 text-xs">Товары, изготовленные по индивидуальным параметрам покупателя, возврату и обмену надлежащего качества не подлежат (ст. 26.1 ЗОЗПП).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Возврат товара ненадлежащего качества</h2>
            <p className="text-gray-400">При обнаружении недостатков товара Покупатель вправе по своему выбору:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>Потребовать замены на товар аналогичного качества</li>
              <li>Потребовать соразмерного уменьшения покупной цены</li>
              <li>Потребовать безвозмездного устранения недостатков</li>
              <li>Отказаться от исполнения договора и потребовать возврат денежных средств</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Порядок возврата</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Свяжитесь с нами по телефону или email, указав причину возврата</li>
              <li>Согласуйте способ и адрес возврата</li>
              <li>Передайте товар вместе с документами, подтверждающими покупку</li>
              <li>Денежные средства возвращаются в течение 10 рабочих дней после получения товара</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Расходы на доставку при возврате</h2>
            <p className="text-gray-400">При возврате товара надлежащего качества расходы на доставку несёт Покупатель. При возврате товара ненадлежащего качества расходы на доставку несёт Продавец.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Контакты для возврата</h2>
            <p className="text-gray-400">
              ООО «Беседки Эмин»<br />
              Тел.: +7 (964) 377-77-76<br />
              Email: besedkiemin.ru@yandex.ru<br />
              Адрес: 368501, Республика Дагестан, г. Избербаш, ул. Муса Манарова, д. 62
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
