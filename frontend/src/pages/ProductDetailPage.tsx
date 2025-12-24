import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { featureFlagsApi } from '../lib/api';
import { CatalogProduct, FeatureFlagsMap } from '../types';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Check if catalog is enabled
  const { data: featureFlags, isLoading: flagsLoading } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags-public'],
    queryFn: featureFlagsApi.getPublic,
    staleTime: 60000,
  });

  useEffect(() => {
    if (slug) {
      fetchProduct(slug);
    }
  }, [slug]);

  // Redirect to login if catalog is disabled
  if (!flagsLoading && featureFlags?.catalog === false) {
    return <Navigate to="/app/login" replace />;
  }

  const fetchProduct = async (slug: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/catalog-products/slug/${slug}`);
      setProduct(response.data);
    } catch (err) {
      console.error('Ошибка загрузки товара:', err);
      setError('Товар не найден');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'Товар не найден'}</div>
        <button onClick={() => navigate('/catalog')} style={styles.backButton}>
          Вернуться в каталог
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Хедер */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>Беседки Эмин</h1>
          <nav style={styles.nav}>
            <a href="/" style={styles.navLink}>
              На главную
            </a>
            <a href="/catalog" style={styles.navLink}>
              Каталог
            </a>
            <a href="#contact" style={styles.navLink}>
              Контакты
            </a>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          <button onClick={() => navigate('/catalog')} style={styles.backLink}>
            ← Вернуться в каталог
          </button>

          <div style={styles.productLayout}>
            {/* Галерея изображений */}
            <div style={styles.gallery}>
              <div style={styles.mainImage}>
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>Нет фото</div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div style={styles.thumbnails}>
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      style={{
                        ...styles.thumbnail,
                        ...(selectedImage === index ? styles.thumbnailActive : {}),
                      }}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Информация о товаре */}
            <div style={styles.productInfo}>
              <h1 style={styles.productName}>{product.name}</h1>
              {product.category && (
                <p style={styles.category}>Категория: {product.category.name}</p>
              )}

              {product.shortDesc && (
                <p style={styles.shortDesc}>{product.shortDesc}</p>
              )}

              {/* Характеристики */}
              <div style={styles.specs}>
                {product.dimensions && (
                  <div style={styles.specRow}>
                    <span style={styles.specLabel}>Размеры:</span>
                    <span style={styles.specValue}>{product.dimensions}</span>
                  </div>
                )}
                {product.material && (
                  <div style={styles.specRow}>
                    <span style={styles.specLabel}>Материал:</span>
                    <span style={styles.specValue}>{product.material}</span>
                  </div>
                )}
              </div>

              {/* Цена */}
              <div style={styles.priceSection}>
                {product.price ? (
                  <p style={styles.price}>{product.price.toLocaleString()} руб.</p>
                ) : (
                  product.priceNote && <p style={styles.priceNote}>{product.priceNote}</p>
                )}
              </div>

              {/* Кнопки действий */}
              <div style={styles.actions}>
                <button
                  onClick={() => setShowOrderModal(true)}
                  style={styles.orderButton}
                >
                  Заказать
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  style={styles.contactButton}
                >
                  Задать вопрос
                </button>
              </div>

              {/* Полное описание */}
              {product.description && (
                <div style={styles.description}>
                  <h2 style={styles.descriptionTitle}>Описание</h2>
                  <p style={styles.descriptionText}>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p>&copy; 2025 Беседки Эмин. Все права защищены.</p>
          <div style={styles.footerLinks}>
            <a href="tel:+79999999999" style={styles.footerLink}>
              +7 (999) 999-99-99
            </a>
            <a href="mailto:info@besedkiemin.ru" style={styles.footerLink}>
              info@besedkiemin.ru
            </a>
          </div>
        </div>
      </footer>

      {/* Модальные окна */}
      {showOrderModal && (
        <OrderModal
          product={product}
          onClose={() => setShowOrderModal(false)}
        />
      )}
      {showContactModal && (
        <ContactModal
          product={product}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
};

// Модальное окно заказа
const OrderModal: React.FC<{
  product: CatalogProduct;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    comment: '',
    deliveryAddress: '',
    quantity: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/catalog-orders', {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        comment: formData.comment || undefined,
        deliveryAddress: formData.deliveryAddress || undefined,
        items: [
          {
            productId: product.id,
            quantity: formData.quantity,
          },
        ],
      });

      alert('Заказ успешно отправлен! Мы свяжемся с вами в ближайшее время.');
      onClose();
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      alert('Не удалось отправить заказ. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Заказать: {product.name}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ваше имя *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Телефон *</label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Количество</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Адрес доставки</label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              rows={2}
              style={styles.textarea}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Комментарий</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
              style={styles.textarea}
            />
          </div>
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" style={styles.submitButton} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно обратной связи
const ContactModal: React.FC<{
  product: CatalogProduct;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/contact-requests', {
        ...formData,
        productId: product.id,
        email: formData.email || undefined,
      });

      alert('Ваш вопрос отправлен! Мы свяжемся с вами в ближайшее время.');
      onClose();
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      alert('Не удалось отправить запрос. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Задать вопрос о: {product.name}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ваше имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Телефон *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ваш вопрос *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
              style={styles.textarea}
            />
          </div>
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" style={styles.submitButton} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e7e7e7',
    fontFamily: '"Source Serif 4", "PT Serif", serif',
  },
  header: {
    backgroundColor: '#080000',
    color: '#ffffff',
    padding: '20px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f49f0f',
    margin: 0,
  },
  nav: {
    display: 'flex',
    gap: '30px',
  },
  navLink: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'color 0.3s',
  },
  main: {
    flex: 1,
    padding: '40px 0',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#ffeeee',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '30px',
    color: '#f49f0f',
    textDecoration: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  productLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
  },
  gallery: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  mainImage: {
    width: '100%',
    height: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '18px',
  },
  thumbnails: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  thumbnail: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '5px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'border-color 0.3s',
  },
  thumbnailActive: {
    borderColor: '#f49f0f',
  },
  productInfo: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '10px',
  },
  productName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#080000',
    marginBottom: '10px',
  },
  category: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  shortDesc: {
    fontSize: '18px',
    color: '#374151',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  specs: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  specLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  specValue: {
    color: '#6b7280',
  },
  priceSection: {
    marginBottom: '30px',
  },
  price: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#f49f0f',
  },
  priceNote: {
    fontSize: '24px',
    color: '#f49f0f',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginBottom: '40px',
  },
  orderButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f49f0f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  contactButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#080000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  description: {
    paddingTop: '30px',
    borderTop: '1px solid #e5e7eb',
  },
  descriptionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#080000',
  },
  descriptionText: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#374151',
  },
  footer: {
    backgroundColor: '#080000',
    color: '#ffffff',
    padding: '30px 0',
    marginTop: 'auto',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLinks: {
    display: 'flex',
    gap: '20px',
  },
  footerLink: {
    color: '#f49f0f',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#080000',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    fontSize: '16px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f49f0f',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default ProductDetailPage;
