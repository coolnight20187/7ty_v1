// FILE: tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Thêm font Inter làm font chữ chính
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        // Thêm bo tròn 'card'
        'card': '12px',
      },
      boxShadow: {
        // Thêm bóng đổ 'card'
        'card': '0 4px 12px rgba(0,0,0,0.05)',
        'card-hover': '0 6px 16px rgba(0,0,0,0.08)',
      },
      colors: {
        // Tùy chỉnh màu sắc
        'bg-body': 'var(--color-bg-body)',
        'bg-card': 'var(--color-bg-card)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border-default': 'var(--color-border)',
      }
    },
  },
  plugins: [],
};
export default config;

