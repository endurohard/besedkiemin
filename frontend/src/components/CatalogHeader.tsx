import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';

export const CatalogHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainMenu = [
    { label: 'Каталог', href: '#catalog' },
    { label: 'Наше производство', href: '#production' },
    { label: 'Наши работы', href: '#gallery' },
    { label: 'О компании', href: '#about' },
    { label: 'Контакты', href: '#contact' },
  ];

  const secondaryMenu = [
    { label: 'Частным клиентам', href: '#private' },
    { label: 'Бизнесу', href: '#business' },
    { label: 'Застройщикам', href: '#developers' },
    { label: 'Дизайнерам', href: '#designers' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header style={styles.header}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.container}>
          <div style={styles.topBarContent}>
            {/* Secondary Menu - Desktop */}
            <nav style={styles.secondaryMenu}>
              {secondaryMenu.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  style={styles.secondaryLink}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Contact Info */}
            <div style={styles.topBarRight}>
              <a href="tel:+79643777776" style={styles.topBarLink}>
                <Phone size={14} style={{ marginRight: '6px' }} />
                +7 (964) 377-77-76
              </a>
              <a href="mailto:besedkiemin.ru@yandex.ru" style={styles.topBarLink}>
                <Mail size={14} style={{ marginRight: '6px' }} />
                besedkiemin.ru@yandex.ru
              </a>
              <Link to="/app" style={styles.loginLink}>
                Вход в систему
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div style={styles.mainHeader}>
        <div style={styles.container}>
          <div style={styles.mainHeaderContent}>
            {/* Logo */}
            <div style={styles.logoWrapper}>
              <a href="/" style={styles.logo}>
                <div style={styles.logoContainer}>
                  <img src="/logo-besedkiemin.png" alt="Besedki EMIN" style={styles.logoIcon} />
                  <div style={styles.logoSubtitle}>производство с 2020 года</div>
                </div>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav style={styles.mainNav}>
              {mainMenu.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  style={styles.mainNavLink}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div style={styles.ctaButtons}>
              <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} style={styles.catalogButton}>
                Запросить каталог
              </a>
              <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} style={styles.consultButton}>
                Консультация
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={styles.mobileMenuButton}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.container}>
            {/* Main Menu */}
            <nav style={styles.mobileMainNav}>
              {mainMenu.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  style={styles.mobileNavLink}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Secondary Menu */}
            <div style={styles.mobileSecondaryNav}>
              <div style={styles.mobileMenuTitle}>Клиентам</div>
              {secondaryMenu.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  style={styles.mobileSecondaryLink}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Mobile CTA */}
            <div style={styles.mobileCTA}>
              <a href="#contact" onClick={(e) => scrollToSection(e, '#contact')} style={styles.mobileCatalogButton}>
                Запросить каталог
              </a>
              <a href="tel:+79643777776" style={styles.mobilePhoneButton}>
                <Phone size={18} style={{ marginRight: '8px' }} />
                Позвонить
              </a>
            </div>

            {/* Mobile Contacts */}
            <div style={styles.mobileContacts}>
              <a href="tel:+79643777776" style={styles.mobileContact}>
                +7 (964) 377-77-76
              </a>
              <a href="mailto:besedkiemin.ru@yandex.ru" style={styles.mobileContact}>
                besedkiemin.ru@yandex.ru
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },

  // Top Bar
  topBar: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 0',
    fontSize: '13px',
  },
  topBarContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  secondaryMenu: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  secondaryLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  topBarRight: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  topBarLink: {
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s',
  },
  loginLink: {
    color: '#2d5016',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'color 0.2s',
  },

  // Main Header
  mainHeader: {
    padding: '16px 0',
    backgroundColor: '#fff',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
  },
  mainHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '32px',
  },

  // Logo
  logoWrapper: {
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#111827',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  logoIcon: {
    height: '60px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#2d5016',
    lineHeight: 1.2,
    fontWeight: 500,
    textAlign: 'center',
  },

  // Main Navigation
  mainNav: {
    display: 'flex',
    gap: '32px',
    flex: 1,
    justifyContent: 'center',
  },
  mainNavLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },

  // CTA Buttons
  ctaButtons: {
    display: 'flex',
    gap: '12px',
    flexShrink: 0,
  },
  catalogButton: {
    padding: '10px 20px',
    backgroundColor: '#2d5016',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  consultButton: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#2d5016',
    border: '2px solid #2d5016',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },

  // Mobile Menu Button
  mobileMenuButton: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    color: '#374151',
  },

  // Mobile Menu
  mobileMenu: {
    backgroundColor: '#fff',
    borderTop: '1px solid #e5e7eb',
    padding: '24px 0',
  },
  mobileMainNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  mobileNavLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 500,
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
  },
  mobileSecondaryNav: {
    marginBottom: '24px',
  },
  mobileMenuTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  mobileSecondaryLink: {
    display: 'block',
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 0',
    cursor: 'pointer',
  },
  mobileCTA: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  mobileCatalogButton: {
    padding: '14px 20px',
    backgroundColor: '#2d5016',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  mobilePhoneButton: {
    padding: '14px 20px',
    backgroundColor: '#fff',
    color: '#2d5016',
    border: '2px solid #2d5016',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'center',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  mobileContacts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  mobileContact: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '16px',
  },
};

// Media Query handling via JavaScript
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 1024px)');

  const handleMediaChange = () => {
    if (mediaQuery.matches) {
      // Hide desktop elements
      styles.mainNav = { ...styles.mainNav, display: 'none' };
      styles.ctaButtons = { ...styles.ctaButtons, display: 'none' };
      styles.secondaryMenu = { ...styles.secondaryMenu, display: 'none' };
      styles.topBarRight = { ...styles.topBarRight, display: 'none' };
      styles.mobileMenuButton = { ...styles.mobileMenuButton, display: 'block' };
    } else {
      // Show desktop elements
      styles.mainNav = { ...styles.mainNav, display: 'flex' };
      styles.ctaButtons = { ...styles.ctaButtons, display: 'flex' };
      styles.secondaryMenu = { ...styles.secondaryMenu, display: 'flex' };
      styles.topBarRight = { ...styles.topBarRight, display: 'flex' };
      styles.mobileMenuButton = { ...styles.mobileMenuButton, display: 'none' };
    }
  };

  mediaQuery.addListener(handleMediaChange);
  handleMediaChange();
}
