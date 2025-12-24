import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CatalogHeader } from '../components/CatalogHeader';
import { CustomerChatWidget } from '../components/chat/CustomerChatWidget';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import api, { featureFlagsApi } from '../lib/api';
import { CatalogCategory, CatalogProduct, CompanySettings, FeatureFlagsMap } from '../types';

// Образцы товаров с изображениями
const sampleProducts = [
  {
    id: '1',
    name: 'Беседка восьмигранник',
    description: 'Классическая восьмигранная беседка из натурального дерева',
    price: '285000',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    category: 'Беседки',
    dimensions: '3.5x3.5 м',
  },
  {
    id: '2',
    name: 'Беседка стандартная',
    description: 'Просторная беседка для семейного отдыха',
    price: '195000',
    image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800',
    category: 'Беседки',
    dimensions: '3x4 м',
  },
  {
    id: '3',
    name: 'Беседка с мангальной зоной',
    description: 'Беседка с встроенной зоной для приготовления шашлыка',
    price: '345000',
    image: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800',
    category: 'Беседки',
    dimensions: '4x5 м',
  },
  {
    id: '4',
    name: 'Арка садовая',
    description: 'Декоративная арка для сада из массива дерева',
    price: '35000',
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800',
    category: 'Арки и навесы',
    dimensions: '2.5x1.2 м',
  },
  {
    id: '5',
    name: 'Пергола',
    description: 'Элегантная пергола для создания тени',
    price: '125000',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    category: 'Арки и навесы',
    dimensions: '3x3 м',
  },
  {
    id: '6',
    name: 'Качеля-лавочка',
    description: 'Удобные парковые качели на 3 человека',
    price: '45000',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
    category: 'Качели',
    dimensions: '2x1.5 м',
  },
  {
    id: '7',
    name: 'Тахта садовая',
    description: 'Удобная тахта для отдыха на свежем воздухе',
    price: '28500',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    category: 'Мебель',
    dimensions: '180x80 см',
  },
  {
    id: '8',
    name: 'Кресло-качалка Лорд',
    description: 'Классическое кресло-качалка из массива',
    price: '18500',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    category: 'Мебель',
    dimensions: '70x90 см',
  },
  {
    id: '9',
    name: 'Стол кафельный',
    description: 'Прочный стол с керамической плиткой',
    price: '22000',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
    category: 'Мебель',
    dimensions: '120x80 см',
  },
  {
    id: '10',
    name: 'Вазон садовый',
    description: 'Декоративный вазон для цветов из дерева',
    price: '8500',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
    category: 'Вазоны',
    dimensions: '50x50 см',
  },
  {
    id: '11',
    name: 'Навес для автомобиля',
    description: 'Прочный деревянный навес для машины',
    price: '185000',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
    category: 'Арки и навесы',
    dimensions: '6x3 м',
  },
  {
    id: '12',
    name: 'Лежак парковый',
    description: 'Комфортный лежак для отдыха у бассейна',
    price: '15900',
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
    category: 'Мебель',
    dimensions: '180x60 см',
  },
];

const CatalogPage: React.FC = () => {
  const [, setCategories] = useState<CatalogCategory[]>([]);
  const [, setProducts] = useState<CatalogProduct[]>([]);
  const [displayProducts, setDisplayProducts] = useState(sampleProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  // Check if catalog is enabled
  const { data: featureFlags, isLoading: flagsLoading } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags-public'],
    queryFn: featureFlagsApi.getPublic,
    staleTime: 60000,
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchCompanySettings();
  }, []);

  // Redirect to login if catalog is disabled
  if (!flagsLoading && featureFlags?.catalog === false) {
    return <Navigate to="/app/login" replace />;
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/catalog-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/catalog-products`);
      const data = await response.json();
      setProducts(data);
      // Если есть товары из базы, показываем их, иначе образцы
      if (data && data.length > 0) {
        // Преобразуем данные из API к формату sampleProducts
        const formattedProducts = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price?.toString() || '0',
          image: product.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
          category: product.category?.name || 'Разное',
          dimensions: '',
        }));
        setDisplayProducts(formattedProducts);
      }
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/company-settings/public`);
      const data = await response.json();
      setCompanySettings(data);
    } catch (err) {
      console.error('Ошибка загрузки настроек компании:', err);
    }
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setDisplayProducts(sampleProducts.filter(p => p.category === category));
    } else {
      setDisplayProducts(sampleProducts);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${api.defaults.baseURL}/catalog-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email || undefined,
          comment: formData.message || undefined,
          items: [], // Пустой массив товаров для быстрой заявки
        }),
      });

      if (response.ok) {
        alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
        setShowContactForm(false);
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        const error = await response.json();
        console.error('Ошибка создания заказа:', error);
        alert('Ошибка отправки формы. Пожалуйста, попробуйте позже.');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка отправки формы. Пожалуйста, попробуйте позже.');
    }
  };

  const categories_list = ['Все', 'Беседки', 'Арки и навесы', 'Качели', 'Мебель', 'Вазоны'];

  return (
    <div style={styles.container}>
      <CatalogHeader />

      {/* Hero секция */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>Садовая мебель и беседки<br />премиум-класса</h1>
            <p style={styles.heroSubtitle}>
              Производство качественной мебели из натуральных материалов<br />
              для вашего загородного дома
            </p>
            <div style={styles.heroButtons}>
              <a href="#catalog" style={styles.primaryButton}>
                Смотреть каталог
              </a>
              <button style={styles.secondaryButton} onClick={() => setShowContactForm(true)}>
                Получить консультацию
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* О компании */}
      <section id="about" style={styles.aboutSection}>
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>О компании</h2>
          <p style={styles.aboutText}>
            Компания "Besedki EMIN" специализируется на производстве высококачественной садовой мебели и беседок.
            Мы используем только натуральные материалы и современные технологии обработки древесины.
            Наша продукция отличается долговечностью, экологичностью и привлекательным внешним видом.
          </p>
          <p style={styles.aboutText}>
            С 2020 года мы создаем уникальные изделия, которые украшают загородные дома и участки по всей России.
            Индивидуальный подход к каждому клиенту и гарантия качества на все изделия.
          </p>
        </div>
      </section>

      {/* Преимущества */}
      <section id="advantages" style={styles.advantagesSection}>
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>Наши преимущества</h2>
          <div style={styles.advantagesGrid}>
            <div style={styles.advantageCard}>
              <div style={styles.advantageIcon}>🌲</div>
              <h3 style={styles.advantageTitle}>Натуральные материалы</h3>
              <p style={styles.advantageText}>
                Используем только качественную древесину: сосну, лиственницу, дуб. Экологически чистые покрытия.
              </p>
            </div>

            <div style={styles.advantageCard}>
              <div style={styles.advantageIcon}>⚡</div>
              <h3 style={styles.advantageTitle}>Быстрое производство</h3>
              <p style={styles.advantageText}>
                Изготовление изделий от 7 дней. Собственное производство позволяет контролировать сроки.
              </p>
            </div>

            <div style={styles.advantageCard}>
              <div style={styles.advantageIcon}>✓</div>
              <h3 style={styles.advantageTitle}>Гарантия качества</h3>
              <p style={styles.advantageText}>
                Предоставляем гарантию на все изделия. Контроль качества на каждом этапе производства.
              </p>
            </div>

            <div style={styles.advantageCard}>
              <div style={styles.advantageIcon}>🚚</div>
              <h3 style={styles.advantageTitle}>Доставка и монтаж</h3>
              <p style={styles.advantageText}>
                Доставка по всей России. Профессиональный монтаж нашими специалистами.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог товаров */}
      <section id="catalog" style={styles.catalogSection}>
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>Каталог продукции</h2>

          {/* Фильтры категорий */}
          <div style={styles.categoriesFilter}>
            {categories_list.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat === 'Все' ? null : cat)}
                style={{
                  ...styles.categoryButton,
                  ...((!selectedCategory && cat === 'Все') || selectedCategory === cat
                    ? styles.categoryButtonActive
                    : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Сетка товаров */}
          <div style={styles.productsGrid}>
            {displayProducts.map((product) => (
              <div key={product.id} style={styles.productCard}>
                <div style={styles.productImageWrapper}>
                  <img src={product.image} alt={product.name} style={styles.productImage} />
                  <div style={styles.productCategory}>{product.category}</div>
                </div>
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productDescription}>{product.description}</p>
                  <div style={styles.productDimensions}>Размер: {product.dimensions}</div>
                  <div style={styles.productFooter}>
                    <div style={styles.productPrice}>от {parseInt(product.price).toLocaleString('ru-RU')} ₽</div>
                    <button style={styles.productButton} onClick={() => setShowContactForm(true)}>
                      Заказать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Этапы работы */}
      <section id="production" style={styles.stepsSection}>
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>Как мы работаем</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Заявка</h3>
              <p style={styles.stepText}>
                Оставляете заявку на сайте или звоните нам. Консультируем по всем вопросам.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>Замер и расчет</h3>
              <p style={styles.stepText}>
                Выезжаем на объект, производим замеры, составляем смету.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Производство</h3>
              <p style={styles.stepText}>
                Изготавливаем изделие на собственном производстве с контролем качества.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>4</div>
              <h3 style={styles.stepTitle}>Доставка и монтаж</h3>
              <p style={styles.stepText}>
                Доставляем и устанавливаем готовое изделие. Проводим инструктаж по уходу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section id="contact" style={styles.contactSection}>
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>Контакты</h2>
          <div style={styles.contactGrid}>
            {/* Контактная информация */}
            <div style={styles.contactInfo}>
              <h3 style={styles.contactTitle}>Свяжитесь с нами</h3>
              <div style={styles.contactItem}>
                <Phone size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Телефон</div>
                  <a
                    href={`tel:${companySettings?.phone ? companySettings.phone.replace(/\D/g, '') : '+79643777776'}`}
                    style={styles.contactValue}
                  >
                    {companySettings?.phone || '+7 (964) 377-77-76'}
                  </a>
                </div>
              </div>
              <div style={styles.contactItem}>
                <Mail size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Email</div>
                  <a
                    href={`mailto:${companySettings?.email || 'besedkiemin.ru@yandex.ru'}`}
                    style={styles.contactValue}
                  >
                    {companySettings?.email || 'besedkiemin.ru@yandex.ru'}
                  </a>
                </div>
              </div>
              <div style={styles.contactItem}>
                <MapPin size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Адрес</div>
                  <div style={styles.contactValue}>
                    {companySettings?.address || 'Республика Дагестан, г. Избербаш'}
                  </div>
                </div>
              </div>
              {companySettings?.supportTelegram && (
                <div style={styles.contactItem}>
                  <MessageCircle size={20} style={styles.contactIcon} />
                  <div>
                    <div style={styles.contactLabel}>Telegram поддержка</div>
                    <a
                      href={
                        companySettings.supportTelegram.startsWith('http')
                          ? companySettings.supportTelegram
                          : companySettings.supportTelegram.startsWith('@')
                          ? `https://t.me/${companySettings.supportTelegram.slice(1)}`
                          : `https://t.me/${companySettings.supportTelegram}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.contactValue}
                    >
                      {companySettings.supportTelegram}
                    </a>
                  </div>
                </div>
              )}
              <div style={styles.contactItem}>
                <Clock size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Режим работы</div>
                  <div style={styles.contactValue}>Пн-Пт: 9:00 - 18:00<br />Сб-Вс: 10:00 - 16:00</div>
                </div>
              </div>
            </div>

            {/* Форма обратной связи */}
            <div style={styles.contactForm}>
              <h3 style={styles.contactTitle}>Оставить заявку</h3>
              <form onSubmit={handleSubmitForm} style={styles.form}>
                <input
                  type="text"
                  placeholder="Ваше имя *"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="tel"
                  placeholder="Телефон *"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
                <textarea
                  placeholder="Комментарий"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ ...styles.input, ...styles.textarea }}
                />
                <button type="submit" style={styles.submitButton}>
                  Отправить заявку
                </button>
                <p style={styles.formNote}>
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.content}>
          <div style={styles.footerGrid}>
            <div style={styles.footerCol}>
              <div style={styles.footerLogo}>
                <img src="/logo-besedkiemin.png" alt="Besedki EMIN" style={styles.footerLogoImage} />
                <div style={styles.footerLogoText}>Besedki EMIN</div>
              </div>
              <p style={styles.footerDescription}>
                Производство качественной садовой мебели и беседок с 2020 года
              </p>
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerTitle}>Навигация</h4>
              <a href="#about" style={styles.footerLink}>О нас</a>
              <a href="#production" style={styles.footerLink}>Производство</a>
              <a href="#catalog" style={styles.footerLink}>Каталог</a>
              <a href="#contact" style={styles.footerLink}>Контакты</a>
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerTitle}>Категории</h4>
              <a href="#catalog" style={styles.footerLink}>Беседки</a>
              <a href="#catalog" style={styles.footerLink}>Арки и навесы</a>
              <a href="#catalog" style={styles.footerLink}>Качели</a>
              <a href="#catalog" style={styles.footerLink}>Мебель</a>
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerTitle}>Контакты</h4>
              {companySettings?.phone && (
                <a href={`tel:${companySettings.phone.replace(/\D/g, '')}`} style={styles.footerLink}>
                  {companySettings.phone}
                </a>
              )}
              {!companySettings?.phone && (
                <a href="tel:+79643777776" style={styles.footerLink}>+7 (964) 377-77-76</a>
              )}
              {companySettings?.email && (
                <a href={`mailto:${companySettings.email}`} style={styles.footerLink}>
                  {companySettings.email}
                </a>
              )}
              {!companySettings?.email && (
                <a href="mailto:besedkiemin.ru@yandex.ru" style={styles.footerLink}>besedkiemin.ru@yandex.ru</a>
              )}
              {companySettings?.address && (
                <div style={styles.footerLink}>{companySettings.address}</div>
              )}
              {!companySettings?.address && (
                <div style={styles.footerLink}>Республика Дагестан, г. Избербаш</div>
              )}
              {companySettings?.supportTelegram && (
                <a
                  href={
                    companySettings.supportTelegram.startsWith('http')
                      ? companySettings.supportTelegram
                      : companySettings.supportTelegram.startsWith('@')
                      ? `https://t.me/${companySettings.supportTelegram.slice(1)}`
                      : `https://t.me/${companySettings.supportTelegram}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...styles.footerLink, display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <MessageCircle size={16} />
                  Telegram поддержка
                </a>
              )}
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerTitle}>Режим работы</h4>
              <div style={styles.footerLink}>Пн-Пт: 9:00 - 18:00</div>
              <div style={styles.footerLink}>Сб-Вс: 10:00 - 16:00</div>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p style={styles.copyright}>© 2024 Besedki EMIN. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Модальное окно */}
      {showContactForm && (
        <div style={styles.modal} onClick={() => setShowContactForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowContactForm(false)}>
              ×
            </button>
            <h3 style={styles.modalTitle}>Заказать обратный звонок</h3>
            <form onSubmit={handleSubmitForm} style={styles.form}>
              <input
                type="text"
                placeholder="Ваше имя *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
              />
              <input
                type="tel"
                placeholder="Телефон *"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Комментарий"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ ...styles.input, ...styles.textarea }}
              />
              <button type="submit" style={styles.submitButton}>
                Отправить
              </button>
              <p style={styles.formNote}>
                Мы свяжемся с вами в ближайшее время
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Виджет чата */}
      <CustomerChatWidget
        catalogOrderId={undefined}
        customerName="Посетитель"
        customerPhone=""
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
  },

  // Hero
  hero: {
    height: '600px',
    backgroundImage: 'linear-gradient(rgba(45, 80, 22, 0.7), rgba(45, 80, 22, 0.7)), url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroOverlay: {
    width: '100%',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 24px',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '24px',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#fff',
    marginBottom: '40px',
    lineHeight: 1.6,
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '16px 40px',
    backgroundColor: '#4a7c2f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.3s',
  },
  secondaryButton: {
    padding: '16px 40px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },

  // Sections
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
  },
  sectionTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '48px',
  },

  // About
  aboutSection: {
    padding: '80px 0',
    backgroundColor: '#f9fafb',
  },
  aboutText: {
    fontSize: '18px',
    lineHeight: 1.8,
    color: '#4b5563',
    textAlign: 'center',
    maxWidth: '900px',
    margin: '0 auto 24px',
  },

  // Advantages
  advantagesSection: {
    padding: '80px 0',
    backgroundColor: '#fff',
  },
  advantagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
  },
  advantageCard: {
    textAlign: 'center',
    padding: '40px 24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  advantageIcon: {
    fontSize: '56px',
    marginBottom: '20px',
  },
  advantageTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '16px',
  },
  advantageText: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: 1.6,
  },

  // Catalog
  catalogSection: {
    padding: '80px 0',
    backgroundColor: '#f9fafb',
  },
  categoriesFilter: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '48px',
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryButtonActive: {
    backgroundColor: '#2d5016',
    color: '#fff',
    borderColor: '#2d5016',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '32px',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  productImageWrapper: {
    position: 'relative',
    paddingTop: '75%',
    overflow: 'hidden',
  },
  productImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productCategory: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    backgroundColor: 'rgba(45, 80, 22, 0.9)',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  },
  productInfo: {
    padding: '24px',
  },
  productName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '12px',
  },
  productDescription: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: 1.5,
  },
  productDimensions: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '16px',
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  productPrice: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#2d5016',
  },
  productButton: {
    padding: '10px 24px',
    backgroundColor: '#2d5016',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  // Steps
  stepsSection: {
    padding: '80px 0',
    backgroundColor: '#fff',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '32px',
  },
  stepCard: {
    textAlign: 'center',
    padding: '32px 24px',
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    margin: '0 auto 24px',
    backgroundColor: '#2d5016',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '12px',
  },
  stepText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: 1.6,
  },

  // Contact
  contactSection: {
    padding: '80px 0',
    backgroundColor: '#f9fafb',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '48px',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  contactTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px',
  },
  contactItem: {
    display: 'flex',
    gap: '16px',
  },
  contactIcon: {
    color: '#2d5016',
    flexShrink: 0,
  },
  contactLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  contactValue: {
    fontSize: '16px',
    color: '#111827',
    textDecoration: 'none',
  },
  contactForm: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '14px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '100px',
  },
  submitButton: {
    padding: '14px 24px',
    backgroundColor: '#2d5016',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  formNote: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: 0,
  },

  // Footer
  footer: {
    backgroundColor: '#111827',
    color: '#d1d5db',
    padding: '60px 0 30px',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    marginBottom: '40px',
  },
  footerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  footerLogoImage: {
    height: '50px',
    width: 'auto',
    objectFit: 'contain',
  },
  footerLogoText: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#fff',
  },
  footerDescription: {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: 1.6,
    margin: 0,
  },
  footerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px',
  },
  footerLink: {
    color: '#d1d5db',
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'color 0.2s',
  },
  footerBottom: {
    paddingTop: '30px',
    borderTop: '1px solid #374151',
    textAlign: 'center',
  },
  copyright: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },

  // Modal
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '24px',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    fontSize: '32px',
    lineHeight: 1,
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '24px',
  },
};

export default CatalogPage;
