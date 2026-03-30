import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CustomerChatWidget } from '../components/chat/CustomerChatWidget';
import {
  TreePine, Hammer, Award, HeartHandshake, ArrowRight,
  Phone, Mail, MapPin, X, Truck, PenTool, Factory,
  Instagram, Menu as MenuIcon, ChevronDown,
} from 'lucide-react';
import api, { featureFlagsApi } from '../lib/api';
import { FeatureFlagsMap } from '../types';

const sampleProducts = [
  { id: '1', name: 'Беседка восьмигранник', description: 'Классическая восьмигранная беседка из натурального дерева', price: 285000, image: '/uploads/catalog/besedka_8.jpg', category: 'Беседки', dimensions: '3.5x3.5 м' },
  { id: '2', name: 'Беседка стандартная', description: 'Просторная беседка для семейного отдыха', price: 195000, image: '/uploads/catalog/besedka_std.jpg', category: 'Беседки', dimensions: '3x4 м' },
  { id: '3', name: 'Беседка с мангальной зоной', description: 'Беседка с встроенной зоной для приготовления шашлыка', price: 345000, image: '/uploads/catalog/besedka_mangal.jpg', category: 'Беседки', dimensions: '4x5 м' },
  { id: '4', name: 'Арка садовая', description: 'Декоративная арка для сада из массива дерева', price: 35000, image: '/uploads/catalog/arka.jpg', category: 'Арки и навесы', dimensions: '2.5x1.2 м' },
  { id: '5', name: 'Пергола', description: 'Элегантная пергола для создания тени', price: 125000, image: '/uploads/catalog/pergola.jpg', category: 'Арки и навесы', dimensions: '3x3 м' },
  { id: '6', name: 'Качеля-лавочка', description: 'Удобные парковые качели на 3 человека', price: 45000, image: '/uploads/catalog/kacheli.jpg', category: 'Качели', dimensions: '2x1.5 м' },
  { id: '7', name: 'Тахта садовая', description: 'Удобная тахта для отдыха на свежем воздухе', price: 28500, image: '/uploads/catalog/tahta.jpg', category: 'Мебель', dimensions: '180x80 см' },
  { id: '8', name: 'Кресло-качалка Лорд', description: 'Классическое кресло-качалка из массива', price: 18500, image: '/uploads/catalog/kreslo.jpg', category: 'Мебель', dimensions: '70x90 см' },
  { id: '9', name: 'Стол кафельный', description: 'Прочный стол с керамической плиткой', price: 22000, image: '/uploads/catalog/stol.jpg', category: 'Мебель', dimensions: '120x80 см' },
  { id: '10', name: 'Вазон садовый', description: 'Декоративный вазон для цветов из дерева', price: 8500, image: '/uploads/catalog/vazon.jpg', category: 'Вазоны', dimensions: '50x50 см' },
  { id: '11', name: 'Навес для автомобиля', description: 'Прочный деревянный навес для машины', price: 185000, image: '/uploads/catalog/naves.jpg', category: 'Арки и навесы', dimensions: '6x3 м' },
  { id: '12', name: 'Лежак парковый', description: 'Комфортный лежак для отдыха у бассейна', price: 15900, image: '/uploads/catalog/lezhak.jpg', category: 'Мебель', dimensions: '180x60 см' },
];

const CATEGORIES = ['Все', 'Беседки', 'Арки и навесы', 'Качели', 'Мебель', 'Вазоны'];

// Brand colors

const CatalogPage: React.FC = () => {
  const [displayProducts, setDisplayProducts] = useState(sampleProducts);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof sampleProducts[0] | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [formSuccess, setFormSuccess] = useState(false);

  const { data: featureFlags, isLoading: flagsLoading } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags-public'],
    queryFn: featureFlagsApi.getPublic,
    staleTime: 60000,
  });

  useEffect(() => {
    fetch(`${api.defaults.baseURL}/catalog-products`)
      .then(r => r.json())
      .then(data => {
        if (data?.length > 0) {
          setDisplayProducts(data.map((p: any) => ({
            id: p.id, name: p.name, description: p.description || '', price: p.price || 0,
            image: p.images?.[0] || sampleProducts[0].image,
            category: p.category?.name || 'Разное', dimensions: '',
          })));
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDisplayProducts(selectedCategory === 'Все' ? sampleProducts : sampleProducts.filter(p => p.category === selectedCategory));
  }, [selectedCategory]);

  if (!flagsLoading && featureFlags?.catalog === false) return <Navigate to="/app/login" replace />;

  const scrollTo = (id: string) => { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false); };

  const openModal = (product: typeof sampleProducts[0] | null) => { setSelectedProduct(product); setIsModalOpen(true); setFormSuccess(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await fetch(`${api.defaults.baseURL}/catalog-orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: formData.name, customerPhone: formData.phone, customerEmail: formData.email || undefined, comment: formData.message || (selectedProduct ? `Интересует: ${selectedProduct.name}` : undefined), items: [] }),
      });
      if (r.ok) { setFormSuccess(true); setFormData({ name: '', phone: '', email: '', message: '' }); setTimeout(() => { setIsModalOpen(false); setFormSuccess(false); }, 3000); }
    } catch { /* */ }
  };

  const nav = [
    { label: 'Каталог', id: '#catalog' },
    { label: 'Производство', id: '#production' },
    { label: 'О компании', id: '#about' },
    { label: 'Контакты', id: '#contact' },
  ];

  return (
    <div className="text-white bg-[#111]" style={{ fontFamily: "'Raleway', sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes goldShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .anim-up{animation:fadeUp .7s ease-out forwards;opacity:0}
        .anim-scale{animation:fadeScale .3s ease-out forwards;opacity:0}
        .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}
        .d5{animation-delay:.5s}.d6{animation-delay:.6s}.d7{animation-delay:.7s}.d8{animation-delay:.8s}
        .gold-border{border:1px solid rgba(197,165,90,.3)}
        .gold-border-b{border-bottom:1px solid rgba(197,165,90,.2)}
        .gold-glow:hover{box-shadow:0 0 20px rgba(197,165,90,.15)}
        .font-serif-brand{font-family:"Cormorant Garamond",Georgia,serif}
        .shimmer{background:linear-gradient(90deg,#C5A55A 0%,#D4AF37 50%,#C5A55A 100%);background-size:200% 100%;animation:goldShimmer 3s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      `}</style>

      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#111]/95 backdrop-blur-md shadow-[0_1px_0_rgba(197,165,90,.2)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-besedkiemin.png" alt="BE" className="h-10 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-xl font-light tracking-[.3em] text-[#C5A55A]" style={{ fontFamily: "'Raleway', sans-serif" }}>BESEDKI EMIN</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {nav.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="text-sm tracking-wider text-gray-400 hover:text-[#C5A55A] transition-colors uppercase">
                {n.label}
              </button>
            ))}
            <a href="tel:+79643777776" className="flex items-center gap-2 text-[#C5A55A] font-medium">
              <Phone size={15} /> +7 (964) 377-77-76
            </a>
            <Link to="/app" className="px-5 py-2 border border-[#C5A55A] text-[#C5A55A] text-sm tracking-wider rounded hover:bg-[#C5A55A] hover:text-[#111] transition-all">
              ВХОД
            </Link>
          </nav>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-[#C5A55A]">
            {mobileMenu ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#1A1A1A] border-t border-[#C5A55A]/20 p-4 space-y-3">
            {nav.map(n => (<button key={n.id} onClick={() => scrollTo(n.id)} className="block w-full text-left py-2 text-gray-300 hover:text-[#C5A55A] uppercase tracking-wider text-sm">{n.label}</button>))}
            <a href="tel:+79643777776" className="flex items-center gap-2 py-2 text-[#C5A55A]"><Phone size={15} /> +7 (964) 377-77-76</a>
            <Link to="/app" className="block text-center py-2 border border-[#C5A55A] text-[#C5A55A] rounded">ВХОД В СИСТЕМУ</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/uploads/catalog/hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111]/80 via-[#111]/60 to-[#111]" />
        {/* Decorative gold lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C5A55A]/20 to-transparent" />
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C5A55A]/20 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="mb-6 anim-up">
            <span className="inline-block px-6 py-2 border border-[#C5A55A]/40 text-[#C5A55A] text-xs tracking-[.3em] uppercase font-light">Премиум-качество с 2020 года</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight anim-up d2 font-serif-brand">
            <span className="shimmer">Садовая мебель</span>
            <br />
            <span className="text-white">и беседки из массива</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 anim-up d4">
            Производство высококачественной мебели из натуральных материалов<br className="hidden md:block" /> для вашего загородного дома
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 anim-up d6">
            <button onClick={() => scrollTo('#catalog')} className="px-8 py-4 bg-[#C5A55A] text-[#111] text-lg font-semibold hover:bg-[#D4AF37] transition-all shadow-[0_0_30px_rgba(197,165,90,.2)] hover:shadow-[0_0_40px_rgba(197,165,90,.3)]">
              СМОТРЕТЬ КАТАЛОГ
            </button>
            <button onClick={() => openModal(null)} className="px-8 py-4 border border-white/30 text-white text-lg hover:border-[#C5A55A] hover:text-[#C5A55A] transition-all">
              ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ
            </button>
          </div>
        </div>
        <button onClick={() => scrollTo('#about')} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#C5A55A] animate-bounce">
          <ChevronDown size={32} />
        </button>
      </section>

      {/* About */}
      <section id="about" className="py-24 max-w-5xl mx-auto px-4">
        <div className="text-center mb-4 anim-up">
          <span className="text-[#C5A55A] text-xs tracking-[.3em] uppercase">О компании</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 anim-up d1 font-serif-brand">
          <span className="text-[#C5A55A]">BESEDKI</span> EMIN
        </h2>
        <div className="gold-border rounded-lg p-8 md:p-12 bg-[#1A1A1A] anim-up d2">
          <div className="text-lg text-gray-400 leading-relaxed space-y-4 text-center">
            <p>Компания <span className="text-[#C5A55A]">BESEDKI EMIN</span> специализируется на производстве высококачественной садовой мебели и беседок. Мы используем только натуральные материалы и современные технологии обработки древесины.</p>
            <p>С 2020 года мы создаем уникальные изделия, которые украшают загородные дома и участки по всей России. Индивидуальный подход к каждому клиенту и гарантия качества на все изделия.</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-[#C5A55A]/30 to-transparent" /></div>

      {/* Advantages */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-4 anim-up"><span className="text-[#C5A55A] text-xs tracking-[.3em] uppercase">Почему мы</span></div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 anim-up d1 font-serif-brand">Наши преимущества</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: TreePine, title: 'Натуральные материалы', text: 'Только массив дерева высшего сорта и экологически чистые покрытия' },
            { icon: Hammer, title: 'Ручная работа', text: 'Каждое изделие создается с душой опытными мастерами' },
            { icon: Award, title: 'Гарантия качества', text: 'Полная гарантия на все изделия, контроль каждого этапа' },
            { icon: HeartHandshake, title: 'Индивидуальный подход', text: 'Уникальные проекты по вашим эскизам и пожеланиям' },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`group gold-border rounded-lg p-6 bg-[#1A1A1A] hover:bg-[#1E1E1E] transition-all gold-glow anim-up`} style={{ animationDelay: `${200 + i * 150}ms` }}>
              <div className="w-14 h-14 flex items-center justify-center rounded-full border border-[#C5A55A]/30 text-[#C5A55A] mb-4 group-hover:bg-[#C5A55A] group-hover:text-[#111] transition-all">
                <Icon size={26} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-serif-brand">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-[#C5A55A]/30 to-transparent" /></div>

      {/* Catalog */}
      <section id="catalog" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-4 anim-up"><span className="text-[#C5A55A] text-xs tracking-[.3em] uppercase">Продукция</span></div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 anim-up d1 font-serif-brand">Наш каталог</h2>
        <div className="flex flex-wrap justify-center gap-2 mb-12 anim-up d2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 text-sm tracking-wider transition-all border ${selectedCategory === cat ? 'bg-[#C5A55A] text-[#111] border-[#C5A55A] font-semibold' : 'border-[#333] text-gray-400 hover:border-[#C5A55A] hover:text-[#C5A55A]'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((p, i) => (
            <div key={p.id} className="group gold-border rounded-lg overflow-hidden bg-[#1A1A1A] hover:bg-[#1E1E1E] transition-all gold-glow anim-up" style={{ animationDelay: `${100 + i * 80}ms` }}>
              <div className="relative overflow-hidden h-56">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-[#111]/80 border border-[#C5A55A]/30 text-[#C5A55A] text-xs tracking-wider">{p.category}</span>
                {p.dimensions && <span className="absolute top-3 right-3 px-2 py-1 bg-[#111]/80 text-gray-400 text-xs">{p.dimensions}</span>}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#C5A55A] transition-colors font-serif-brand">{p.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{p.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-[#C5A55A]" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>{p.price.toLocaleString('ru-RU')} <span className="text-base">₽</span></span>
                  <button onClick={() => openModal(p)} className="flex items-center gap-1 px-4 py-2 border border-[#C5A55A] text-[#C5A55A] text-sm hover:bg-[#C5A55A] hover:text-[#111] transition-all">
                    Заказать <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-[#C5A55A]/30 to-transparent" /></div>

      {/* Production */}
      <section id="production" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-4 anim-up"><span className="text-[#C5A55A] text-xs tracking-[.3em] uppercase">Процесс</span></div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 anim-up d1 font-serif-brand">Наше производство</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: PenTool, step: '01', title: 'Проектирование', text: 'От идеи до детального чертежа. Разрабатываем уникальные решения с учётом ваших пожеланий.' },
            { icon: Factory, step: '02', title: 'Изготовление', text: 'Мастера вручную обрабатывают дерево, собирая каждое изделие с высочайшей точностью.' },
            { icon: Truck, step: '03', title: 'Доставка и монтаж', text: 'Тщательный контроль качества, бережная доставка и профессиональная установка.' },
          ].map(({ icon: Icon, step, title, text }, i) => (
            <div key={step} className={`gold-border rounded-lg p-8 bg-[#1A1A1A] text-center anim-up`} style={{ animationDelay: `${200 + i * 200}ms` }}>
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 flex items-center justify-center rounded-full border border-[#C5A55A]/30 text-[#C5A55A]">
                  <Icon size={36} />
                </div>
                <span className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center bg-[#C5A55A] text-[#111] text-xs font-bold rounded-full">{step}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 font-serif-brand">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4"><div className="h-px bg-gradient-to-r from-transparent via-[#C5A55A]/30 to-transparent" /></div>

      {/* Contact */}
      <section id="contact" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-4 anim-up"><span className="text-[#C5A55A] text-xs tracking-[.3em] uppercase">Связь</span></div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 anim-up d1 font-serif-brand">Свяжитесь с нами</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6 anim-up d2">
            {[
              { icon: Phone, label: 'Телефон', value: '+7 (964) 377-77-76', href: 'tel:+79643777776' },
              { icon: Mail, label: 'Email', value: 'besedkiemin.ru@yandex.ru', href: 'mailto:besedkiemin.ru@yandex.ru' },
              { icon: Instagram, label: 'Instagram', value: '@besedki_emin', href: 'https://instagram.com/besedki_emin' },
              { icon: MapPin, label: 'Адрес', value: 'Дагестан, г. Избербаш, ул. Дербентская 29/6' },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full border border-[#C5A55A]/30 text-[#C5A55A] shrink-0"><Icon size={20} /></div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider">{label}</h3>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#C5A55A] transition-colors">{value}</a> : <p className="text-white">{value}</p>}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="gold-border rounded-lg bg-[#1A1A1A] p-6 space-y-4 anim-up d3">
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ваше имя" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none transition-colors" />
            <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Телефон" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none transition-colors" />
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email (необязательно)" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none transition-colors" />
            <textarea rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Сообщение" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none transition-colors resize-none" />
            <button type="submit" className="w-full py-3 bg-[#C5A55A] text-[#111] font-semibold tracking-wider hover:bg-[#D4AF37] transition-colors">ОТПРАВИТЬ ЗАЯВКУ</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#C5A55A]/20 bg-[#0A0A0A] py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-[#C5A55A] tracking-wider mb-3">BESEDKI EMIN</h3>
            <p className="text-sm text-gray-500">Изысканная мебель из натурального дерева для вашего дома и сада.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#C5A55A] tracking-wider mb-3 uppercase">Навигация</h3>
            <ul className="space-y-1.5 text-sm">
              {nav.map(n => (<li key={n.id}><button onClick={() => scrollTo(n.id)} className="text-gray-500 hover:text-[#C5A55A] transition-colors">{n.label}</button></li>))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#C5A55A] tracking-wider mb-3 uppercase">Контакты</h3>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li className="flex items-center gap-2"><Phone size={13} />+7 (964) 377-77-76</li>
              <li className="flex items-center gap-2"><Mail size={13} />besedkiemin.ru@yandex.ru</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#C5A55A] tracking-wider mb-3 uppercase">Соцсети</h3>
            <a href="https://instagram.com/besedki_emin" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#C5A55A] transition-colors"><Instagram size={22} /></a>
          </div>
        </div>
        <div className="text-center text-gray-600 text-xs mt-8 border-t border-[#C5A55A]/10 pt-6 max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} BESEDKI EMIN. Все права защищены.
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="bg-[#1A1A1A] gold-border rounded-lg p-6 max-w-md w-full relative anim-scale">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-[#C5A55A]"><X size={20} /></button>
            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 border border-[#C5A55A]/30 rounded-full flex items-center justify-center"><Award className="text-[#C5A55A]" size={32} /></div>
                <h3 className="text-xl font-bold text-[#C5A55A] mb-2">Заявка отправлена!</h3>
                <p className="text-gray-400">Мы свяжемся с вами в ближайшее время</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-[#C5A55A] mb-4 text-center tracking-wider">
                  {selectedProduct ? selectedProduct.name : 'ЗАКАЗАТЬ КОНСУЛЬТАЦИЮ'}
                </h3>
                {selectedProduct && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-[#111] rounded-lg border border-[#333]">
                    <img src={selectedProduct.image} alt="" className="w-16 h-16 rounded object-cover" />
                    <div>
                      <p className="text-white text-sm font-medium">{selectedProduct.name}</p>
                      <p className="text-[#C5A55A] font-bold">{selectedProduct.price.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ваше имя" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none" />
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Телефон" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none" />
                  <textarea rows={2} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Комментарий" className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none resize-none" />
                  <button type="submit" className="w-full py-3 bg-[#C5A55A] text-[#111] font-semibold tracking-wider hover:bg-[#D4AF37] transition-colors">ОТПРАВИТЬ</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <CustomerChatWidget />
    </div>
  );
};

export default CatalogPage;
