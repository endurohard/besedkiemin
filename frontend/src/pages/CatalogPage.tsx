import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { CatalogCategory, CatalogProduct } from '../types';

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory);
    } else {
      fetchProducts();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/catalog-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      setError('Не удалось загрузить категории');
    }
  };

  const fetchProducts = async (categoryId?: string) => {
    try {
      setLoading(true);
      const url = categoryId
        ? `${api.defaults.baseURL}/catalog-products?categoryId=${categoryId}`
        : `${api.defaults.baseURL}/catalog-products`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Главный контент */}
      <main style={styles.main}>
        <div style={styles.content}>
          <h1 style={styles.title}>Каталог товаров</h1>

          {/* Фильтр по категориям */}
          <div style={styles.categoriesFilter}>
            <button
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === null ? styles.categoryButtonActive : {}),
              }}
              onClick={() => setSelectedCategory(null)}
            >
              Все категории
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === category.id ? styles.categoryButtonActive : {}),
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Ошибка */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Загрузка */}
          {loading && <div style={styles.loading}>Загрузка...</div>}

          {/* Товары */}
          {!loading && !error && (
            <div style={styles.productsGrid}>
              {products.length === 0 ? (
                <p style={styles.noProducts}>Товары не найдены</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} style={styles.productCard}>
                    {/* Изображение */}
                    <div style={styles.productImageContainer}>
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.productImagePlaceholder}>Нет фото</div>
                      )}
                    </div>

                    {/* Информация */}
                    <div style={styles.productInfo}>
                      <h3 style={styles.productName}>{product.name}</h3>
                      {product.shortDesc && (
                        <p style={styles.productDesc}>{product.shortDesc}</p>
                      )}
                      {product.dimensions && (
                        <p style={styles.productDimensions}>Размеры: {product.dimensions}</p>
                      )}
                      {product.price ? (
                        <p style={styles.productPrice}>{product.price.toLocaleString()} руб.</p>
                      ) : (
                        product.priceNote && (
                          <p style={styles.productPriceNote}>{product.priceNote}</p>
                        )
                      )}

                      {/* Кнопки */}
                      <div style={styles.productActions}>
                        <button
                          style={styles.detailsButton}
                          onClick={() => navigate(`/catalog/${product.slug}`)}
                        >
                          Подробнее
                        </button>
                        <button
                          style={styles.orderButton}
                          onClick={() => navigate(`/catalog/${product.slug}`)}
                        >
                          Заказать
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
    </div>
  );
};

// Стили в духе сайта besedkiemin.tilda.ws
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
  title: {
    fontSize: '40px',
    color: '#f49f0f',
    textAlign: 'center',
    marginBottom: '40px',
    fontFamily: '"PT Serif", serif',
  },
  categoriesFilter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  categoryButton: {
    padding: '10px 20px',
    border: '2px solid #080000',
    backgroundColor: '#ffffff',
    color: '#080000',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    borderRadius: '5px',
  },
  categoryButtonActive: {
    backgroundColor: '#f49f0f',
    borderColor: '#f49f0f',
    color: '#ffffff',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#ffeeee',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '30px',
  },
  noProducts: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  productImageContainer: {
    width: '100%',
    height: '250px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '18px',
  },
  productInfo: {
    padding: '20px',
  },
  productName: {
    fontSize: '22px',
    color: '#080000',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  productDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    lineHeight: '1.5',
  },
  productDimensions: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '10px',
  },
  productPrice: {
    fontSize: '24px',
    color: '#f49f0f',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  productPriceNote: {
    fontSize: '16px',
    color: '#f49f0f',
    fontStyle: 'italic',
    marginBottom: '15px',
  },
  productActions: {
    display: 'flex',
    gap: '10px',
  },
  detailsButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #080000',
    backgroundColor: '#ffffff',
    color: '#080000',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'all 0.3s',
  },
  orderButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: '#f49f0f',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'all 0.3s',
    fontWeight: 'bold',
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
};

export default CatalogPage;
