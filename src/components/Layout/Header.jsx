import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    InputBase,
    Box,
    useTheme,
    alpha,
    Tooltip,
    Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useThemeMode } from '../../App';
import { searchTools } from '../../config/tools';

/**
 * 顶部导航栏组件
 * 
 * 功能：
 * - Logo 和品牌名称
 * - 全局搜索框
 * - 主题切换按钮
 * - 移动端菜单按钮
 * 
 * @param {Object} props
 * @param {Function} props.onDrawerToggle - 移动端侧边栏切换函数
 * @param {number} props.drawerWidth - 侧边栏宽度
 */
function Header({ onDrawerToggle, drawerWidth }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { mode, toggleMode } = useThemeMode();
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // 处理搜索输入
    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchValue(value);

        if (value.trim()) {
            const results = searchTools(value);
            setSearchResults(results.slice(0, 5)); // 最多显示 5 个结果
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    // 处理搜索结果点击
    const handleResultClick = (path) => {
        navigate(path);
        setSearchValue('');
        setShowResults(false);
    };

    // 处理 Logo 点击
    const handleLogoClick = () => {
        navigate('/');
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* 移动端菜单按钮 */}
                <IconButton
                    color="inherit"
                    aria-label="打开菜单"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{
                        mr: 2,
                        display: { sm: 'none' },
                        color: theme.palette.text.primary,
                    }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Logo（移动端显示） */}
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    onClick={handleLogoClick}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                    }}
                >
                    DevTools
                </Typography>

                {/* 搜索框 */}
                <Box sx={{ position: 'relative', flexGrow: 1, maxWidth: 480, mx: { xs: 2, sm: 0 } }}>
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.04),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.06),
                            },
                            width: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                padding: '0 16px',
                                height: '100%',
                                position: 'absolute',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                        </Box>
                        <InputBase
                            placeholder="搜索工具... (Ctrl+K)"
                            value={searchValue}
                            onChange={handleSearchChange}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            sx={{
                                color: theme.palette.text.primary,
                                width: '100%',
                                '& .MuiInputBase-input': {
                                    padding: '12px 12px 12px 48px',
                                    width: '100%',
                                    fontSize: '0.875rem',
                                },
                            }}
                            inputProps={{ 'aria-label': '搜索工具' }}
                        />
                    </Box>

                    {/* 搜索结果下拉框 */}
                    {showResults && searchResults.length > 0 && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                mt: 1,
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 2,
                                boxShadow: theme.shadows[8],
                                zIndex: 1000,
                                overflow: 'hidden',
                            }}
                        >
                            {searchResults.map((tool) => (
                                <Box
                                    key={tool.id}
                                    onClick={() => handleResultClick(tool.path)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        },
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        '&:last-child': {
                                            borderBottom: 'none',
                                        },
                                    }}
                                >
                                    <Typography variant="body2" fontWeight={500}>
                                        {tool.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {tool.description}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* 右侧操作按钮 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* GitHub 链接 */}
                    <Tooltip title="GitHub">
                        <IconButton
                            size="small"
                            sx={{ color: theme.palette.text.secondary }}
                            href="https://github.com"
                            target="_blank"
                        >
                            <GitHubIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {/* 主题切换 */}
                    <Tooltip title={mode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}>
                        <IconButton
                            size="small"
                            onClick={toggleMode}
                            sx={{ color: theme.palette.text.secondary }}
                        >
                            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    {/* CTA 按钮 */}
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{
                            ml: 1,
                            display: { xs: 'none', md: 'inline-flex' },
                        }}
                    >
                        开始使用
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
