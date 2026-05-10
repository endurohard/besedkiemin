import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#C5A55A] hover:text-[#D4AF37] mb-8 transition-colors">
          <ArrowLeft size={16} /> На главную
        </Link>
        <h1 className="text-3xl font-bold text-[#C5A55A] mb-2">Политика конфиденциальности</h1>
        <p className="text-gray-500 text-sm mb-8">Последнее обновление: 10 мая 2025 г.</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Общие положения</h2>
            <p>Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сайта <strong className="text-[#C5A55A]">besedkiemin.ru</strong>.</p>
            <p className="mt-2">Оператор персональных данных: Общество с ограниченной ответственностью «Беседки Эмин», ИНН 0548013990, ОГРН 1220500011621, юридический адрес: 368501, Республика Дагестан, г. Избербаш, ул. Муса Манарова, д. 62.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Какие данные мы собираем</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Имя (при заполнении формы заказа или обратной связи)</li>
              <li>Номер телефона</li>
              <li>Сообщения, переданные через форму обратной связи или чат</li>
              <li>Технические данные: IP-адрес, тип браузера, cookies сессии</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Цели обработки</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Обработка заявок и оформление заказов</li>
              <li>Связь с клиентом по вопросам заказа</li>
              <li>Обеспечение работы сайта и его безопасности</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Правовые основания</h2>
            <p className="text-gray-400">Обработка осуществляется на основании согласия субъекта персональных данных (ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»), а также в целях исполнения договора, стороной которого является субъект.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Cookies</h2>
            <p className="text-gray-400">Сайт использует файлы cookies для обеспечения корректной работы. Cookies не содержат персональных данных. Вы можете отключить cookies в настройках браузера, однако это может повлиять на функциональность сайта.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Хранение и защита данных</h2>
            <p className="text-gray-400">Персональные данные хранятся на серверах, расположенных на территории Российской Федерации. Применяются технические и организационные меры для защиты от несанкционированного доступа.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Срок хранения</h2>
            <p className="text-gray-400">Персональные данные хранятся в течение срока, необходимого для достижения целей обработки, или до отзыва согласия субъектом, но не более 3 лет.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Права субъекта персональных данных</h2>
            <p className="text-gray-400">Вы вправе: получить сведения об обработке ваших данных; потребовать уточнения, блокирования или уничтожения данных; отозвать согласие на обработку. Для реализации прав обратитесь по электронной почте.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Передача третьим лицам</h2>
            <p className="text-gray-400">Персональные данные не передаются третьим лицам без согласия субъекта, за исключением случаев, предусмотренных законодательством РФ.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Контакты</h2>
            <p className="text-gray-400">ООО «Беседки Эмин»<br />Email: besedkiemin.ru@yandex.ru<br />Тел.: +7 (964) 377-77-76</p>
          </section>
        </div>
      </div>
    </div>
  );
}
