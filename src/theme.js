import { createTheme } from '@mui/material/styles';

/**
 * 创建 MUI 主题配置
 * 设计风格：现代 SaaS 风格（Vercel/Linear/Stripe 美学）
 * 配色方案：黑白灰 + 蓝色强调色
 * 
 * @param {string} mode - 'light' 或 'dark' 模式
 * @returns {Object} MUI 主题对象
 */
export const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: '#0066FF', // 品牌蓝色（仅用于 CTA）
            light: '#3385FF',
            dark: '#0052CC',
            contrastText: '#ffffff',
        },
        secondary: {
            main: mode === 'dark' ? '#71717a' : '#52525b', // 中性灰
        },
        background: {
            // 浅色：纯白卡片 + 浅灰背景
            // 深色：Zinc-700 卡片 + Zinc-800 背景（调亮后的版本）
            default: mode === 'dark' ? '#27272a' : '#f5f5f7',
            paper: mode === 'dark' ? '#3f3f46' : '#ffffff',
        },
        text: {
            // 浅色：几乎黑色文字
            // 深色：几乎白色文字
            primary: mode === 'dark' ? '#fafafa' : '#18181b',
            secondary: mode === 'dark' ? '#a1a1aa' : '#71717a',
        },
        divider: mode === 'dark' ? '#52525b' : '#e4e4e7',
        success: {
            main: '#22c55e',
        },
        error: {
            main: '#ef4444',
        },
        warning: {
            main: '#f59e0b',
        },
        info: {
            main: '#0066FF',
        },
    },
    typography: {
        fontFamily: "'Inter', 'Noto Sans SC', 'system-ui', sans-serif",
        h1: {
            fontWeight: 700,
            fontSize: '3.5rem',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
        },
        h2: {
            fontWeight: 700,
            fontSize: '2.25rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.5rem',
            letterSpacing: '-0.01em',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.125rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.75,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
            letterSpacing: '0.01em',
        },
    },
    shape: {
        borderRadius: 12,
    },
    // 自定义阴影系统 - 极浅阴影
    shadows: [
        'none',
        '0 1px 2px rgba(0, 0, 0, 0.03)',
        '0 2px 4px rgba(0, 0, 0, 0.04)',
        '0 2px 8px rgba(0, 0, 0, 0.04)',
        '0 4px 8px rgba(0, 0, 0, 0.04)',
        '0 4px 12px rgba(0, 0, 0, 0.05)',
        '0 6px 12px rgba(0, 0, 0, 0.06)',
        '0 8px 16px rgba(0, 0, 0, 0.06)',
        '0 8px 20px rgba(0, 0, 0, 0.08)',
        '0 12px 24px rgba(0, 0, 0, 0.08)',
        ...Array(15).fill('0 16px 32px rgba(0, 0, 0, 0.1)'),
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: mode === 'dark' ? '#27272a' : '#f4f4f5',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: mode === 'dark' ? '#52525b' : '#d4d4d8',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: mode === 'dark' ? '#71717a' : '#a1a1aa',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20, // 大圆角
                    boxShadow: mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: mode === 'dark' ? '1px solid #52525b' : 'none',
                    backgroundColor: mode === 'dark' ? '#3f3f46' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: mode === 'dark'
                            ? '0 4px 16px rgba(0, 0, 0, 0.4)'
                            : '0 4px 12px rgba(0, 0, 0, 0.08)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                outlined: {
                    borderWidth: '1px',
                    borderColor: mode === 'dark' ? '#52525b' : '#e4e4e7',
                    '&:hover': {
                        borderWidth: '1px',
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    },
                },
                text: {
                    color: mode === 'dark' ? '#a1a1aa' : '#71717a',
                    '&:hover': {
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: mode === 'dark' ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '2px 8px',
                    '&.Mui-selected': {
                        backgroundColor: mode === 'dark' ? 'rgba(0, 102, 255, 0.15)' : 'rgba(0, 102, 255, 0.08)',
                        '&:hover': {
                            backgroundColor: mode === 'dark' ? 'rgba(0, 102, 255, 0.2)' : 'rgba(0, 102, 255, 0.12)',
                        },
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: mode === 'dark' ? '#52525b' : '#e4e4e7',
                        },
                        '&:hover fieldset': {
                            borderColor: mode === 'dark' ? '#71717a' : '#d4d4d8',
                        },
                    },
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: mode === 'dark' ? '#3f3f46' : '#e4e4e7',
                },
            },
        },
    },
});
