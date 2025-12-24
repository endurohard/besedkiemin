import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { CatalogCategory, CatalogProduct } from '../types';

const CatalogManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/catalog-categories?includeInactive=true');
      setCategories(response.data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      alert('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/catalog-products?includeInactive=true');
      setProducts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      alert('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await api.delete(`/catalog-categories/${id}`);
      fetchCategories();
      alert('Категория удалена');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления категории');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await api.delete(`/catalog-products/${id}`);
      fetchProducts();
      alert('Товар удалён');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления товара');
    }
  };

  const openCategoryModal = (category?: CatalogCategory) => {
    setEditingCategory(category || null);
    setShowCategoryModal(true);
  };

  const openProductModal = (product?: CatalogProduct) => {
    setEditingProduct(product || null);
    setShowProductModal(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        Витрина сайта
      </h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
        Управление публичным каталогом товаров на сайте
      </p>

      {/* Табы */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'categories' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'categories' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'categories' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          Категории
        </button>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'products' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'products' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'products' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          Товары
        </button>
      </div>

      {/* Категории */}
      {activeTab === 'categories' && (
        <div>
          <button
            onClick={() => openCategoryModal()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            + Добавить категорию
          </button>

          {loading ? (
            <p>Загрузка...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Название</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Slug</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Порядок</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Активна</th>
                  <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{category.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>{category.slug}</td>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {category.order}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {category.isActive ? '✅' : '❌'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <button
                        onClick={() => openCategoryModal(category)}
                        style={{
                          padding: '5px 10px',
                          marginRight: '5px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Товары */}
      {activeTab === 'products' && (
        <div>
          <button
            onClick={() => openProductModal()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            + Добавить товар
          </button>

          {loading ? (
            <p>Загрузка...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: 'white',
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{product.name}</h3>
                  {product.shortDesc && <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>{product.shortDesc}</p>}
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                    <strong>Категория:</strong> {product.category?.name}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
                    <strong>Цена:</strong> {product.price ? `${product.price} руб.` : product.priceNote || 'Не указана'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                    <strong>Статус:</strong> {product.isActive ? '✅ Активен' : '❌ Неактивен'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => openProductModal(product)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно категории */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            fetchCategories();
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Модальное окно товара */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories.filter((c) => c.isActive)}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            fetchProducts();
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

// Модальное окно для категории
const CategoryModal: React.FC<{
  category: CatalogCategory | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    order: category?.order || 0,
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (category) {
        await api.patch(`/catalog-categories/${category.id}`, formData);
        alert('Категория обновлена');
      } else {
        await api.post('/catalog-categories', formData);
        alert('Категория создана');
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка сохранения категории');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          {category ? 'Редактировать категорию' : 'Новая категория'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Slug (URL) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>URL изображения</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Порядок</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Активна</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно для товара
const ProductModal: React.FC<{
  product: CatalogProduct | null;
  categories: CatalogCategory[];
  onClose: () => void;
  onSave: () => void;
}> = ({ product, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDesc: product?.shortDesc || '',
    images: product?.images?.join(', ') || '',
    dimensions: product?.dimensions || '',
    material: product?.material || '',
    price: product?.price || 0,
    priceNote: product?.priceNote || '',
    order: product?.order || 0,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    categoryId: product?.categoryId || categories[0]?.id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        images: formData.images.split(',').map((s) => s.trim()).filter(Boolean),
        price: formData.price || undefined,
      };

      if (product) {
        await api.patch(`/catalog-products/${product.id}`, data);
        alert('Товар обновлён');
      } else {
        await api.post('/catalog-products', data);
        alert('Товар создан');
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка сохранения товара');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          {product ? 'Редактировать товар' : 'Новый товар'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Краткое описание</label>
            <input
              type="text"
              value={formData.shortDesc}
              onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Полное описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              URL изображений (через запятую)
            </label>
            <input
              type="text"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Размеры</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Материал</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Цена (руб)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Примечание к цене</label>
              <input
                type="text"
                value={formData.priceNote}
                onChange={(e) => setFormData({ ...formData, priceNote: e.target.value })}
                placeholder="от 50000 руб"
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Категория *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Порядок</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '5px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Активен</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Рекомендуемый</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogManagementPage;
