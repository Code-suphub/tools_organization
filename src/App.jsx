import React, { useState, useMemo, createContext, useContext, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { getTheme } from './theme';

// 布局组件
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// 页面组件 - 懒加载
const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));

// 工具组件 - 懒加载
const JsonFormat = lazy(() => import('./tools/json/JsonFormat'));
const JsonDiff = lazy(() => import('./tools/json/JsonDiff'));
const TimestampConverter = lazy(() => import('./tools/time/TimestampConverter'));
const Base64Tool = lazy(() => import('./tools/encode/Base64'));
const UrlEncode = lazy(() => import('./tools/encode/UrlEncode'));
const HashGenerator = lazy(() => import('./tools/hash/HashGenerator'));
const TextDiff = lazy(() => import('./tools/text/TextDiff'));
const UuidGenerator = lazy(() => import('./tools/uuid/UuidGenerator'));
const QRCodeGenerator = lazy(() => import('./tools/qrcode/QRCodeGenerator'));

/**
 * 主题上下文 - 用于全局主题切换
 */
const ThemeModeContext = createContext({
    mode: 'light',
    toggleMode: () => { },
});

export const useThemeMode = () => useContext(ThemeModeContext);

/**
 * 加载中占位组件
 */
const LoadingFallback = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: 'background.default',
        }}
    >
        <CircularProgress color="primary" />
    </Box>
);

/**
 * 侧边栏宽度常量
 */
const DRAWER_WIDTH = 280;

/**
 * 主应用组件
 * 
 * 功能：
 * - 主题管理（深色/浅色模式切换）
 * - 路由配置
 * - 全局布局（Header + Sidebar + Main）
 */
function App() {
    // 主题模式状态 - 从 localStorage 读取，默认浅色
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    // 移动端侧边栏状态
    const [mobileOpen, setMobileOpen] = useState(false);

    // 主题切换函数
    const toggleMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // 侧边栏切换（移动端）
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // 创建 MUI 主题
    const theme = useMemo(() => getTheme(mode), [mode]);

    // 上下文值
    const themeModeValue = useMemo(() => ({ mode, toggleMode }), [mode]);

    // 同步 body 类名用于 Tailwind 深色模式
    useEffect(() => {
        if (mode === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [mode]);

    return (
        <ThemeModeContext.Provider value={themeModeValue}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                        {/* 顶部导航 */}
                        <Header
                            onDrawerToggle={handleDrawerToggle}
                            drawerWidth={DRAWER_WIDTH}
                        />

                        {/* 侧边栏导航 */}
                        <Sidebar
                            mobileOpen={mobileOpen}
                            onDrawerToggle={handleDrawerToggle}
                            drawerWidth={DRAWER_WIDTH}
                        />

                        {/* 主内容区域 */}
                        <Box
                            component="main"
                            sx={{
                                flexGrow: 1,
                                p: 3,
                                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                                ml: { sm: `${DRAWER_WIDTH}px` },
                                mt: '64px', // Header 高度
                                backgroundColor: 'background.default',
                                minHeight: 'calc(100vh - 64px)',
                            }}
                        >
                            <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                    {/* 首页 */}
                                    <Route path="/" element={<Home />} />

                                    {/* JSON 工具 */}
                                    <Route path="/tools/json/format" element={<JsonFormat />} />
                                    <Route path="/tools/json/diff" element={<JsonDiff />} />

                                    {/* 时间工具 */}
                                    <Route path="/tools/time/timestamp" element={<TimestampConverter />} />

                                    {/* 编码工具 */}
                                    <Route path="/tools/encode/base64" element={<Base64Tool />} />
                                    <Route path="/tools/encode/url" element={<UrlEncode />} />

                                    {/* 哈希工具 */}
                                    <Route path="/tools/hash/generator" element={<HashGenerator />} />

                                    {/* 文本工具 */}
                                    <Route path="/tools/text/diff" element={<TextDiff />} />

                                    {/* UUID 工具 */}
                                    <Route path="/tools/uuid/generator" element={<UuidGenerator />} />

                                    {/* 二维码工具 */}
                                    <Route path="/tools/qrcode/generate" element={<QRCodeGenerator />} />

                                    {/* 404 页面 */}
                                    <Route path="/404" element={<NotFound />} />
                                    <Route path="*" element={<Navigate to="/404" replace />} />
                                </Routes>
                            </Suspense>
                        </Box>
                    </Box>
                </Router>
            </ThemeProvider>
        </ThemeModeContext.Provider>
    );
}

export default App;
