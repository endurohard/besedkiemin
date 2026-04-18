/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
        // Figma "Sales Management Dashboard" — статичные токены для прямого использования
        // Используются внутри .admin-theme для хардкод-замен
        figma: {
          bg:       "#21222d",   // основной фон
          sidebar:  "#171821",   // сайдбар
          surface:  "#21222d",   // карточки
          elevated: "#2b2b36",   // приподнятые элементы
          primary:  "#a9dfd8",   // бирюза (активный пункт меню)
          accent:   "#20aef3",   // синий акцент
          warning:  "#feb95a",   // янтарный
          danger:   "#f2786a",   // красный
          pink:     "#f2c8ed",   // розовый
          muted:    "#87888c",   // приглушённый текст
          dim:      "#a0a0a0",   // более светлый muted
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
