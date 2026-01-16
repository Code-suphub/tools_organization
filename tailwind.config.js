/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    // 重要：禁用 preflight 以避免与 MUI 的样式冲突
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                // 品牌蓝色（仅用于 CTA 按钮）
                brand: '#0066FF',
                'brand-hover': '#0052CC',

                // Zinc 色板（黑白灰主色调 - SaaS 风格）
                zinc: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
                'sm': '0 2px 4px rgba(0, 0, 0, 0.04)',
                'base': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
                'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
                'dark-card': '0 2px 8px rgba(0, 0, 0, 0.3)',
                'dark-card-hover': '0 4px 16px rgba(0, 0, 0, 0.4)',
            },
            borderRadius: {
                'card': '20px',
                'button': '8px',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
        },
    },
    plugins: [],
}
