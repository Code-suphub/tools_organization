import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Collapse,
    Divider,
    useTheme,
    Chip,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CodeIcon from '@mui/icons-material/Code';
import LockIcon from '@mui/icons-material/Lock';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CompareIcon from '@mui/icons-material/Compare';
import LinkIcon from '@mui/icons-material/Link';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import StorageIcon from '@mui/icons-material/Storage';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import PaletteIcon from '@mui/icons-material/Palette';
import TimerIcon from '@mui/icons-material/Timer';
import ImageIcon from '@mui/icons-material/Image';
import TerminalIcon from '@mui/icons-material/Terminal';
import CalculateIcon from '@mui/icons-material/Calculate';

import { categories, getToolsByCategory } from '../../config/tools';

/**
 * 图标映射
 * 根据工具配置中的 icon 字符串获取实际的图标组件
 */
const iconMap = {
    DataObject: DataObjectIcon,
    Schedule: ScheduleIcon,
    Code: CodeIcon,
    Lock: LockIcon,
    TextFields: TextFieldsIcon,
    Fingerprint: FingerprintIcon,
    QrCode: QrCodeIcon,
    Compare: CompareIcon,
    Link: LinkIcon,
    Home: HomeIcon,
    FormatAlignLeft: FormatAlignLeftIcon,
    Storage: StorageIcon,
    FindReplace: FindReplaceIcon,
    Palette: PaletteIcon,
    Timer: TimerIcon,
    Image: ImageIcon,
    Terminal: TerminalIcon,
    Calculate: CalculateIcon,
};

/**
 * 获取图标组件
 * @param {string} iconName - 图标名称
 * @returns {React.Component} 图标组件
 */
const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || DataObjectIcon;
    return <IconComponent />;
};

/**
 * 侧边栏导航组件
 * 
 * 功能：
 * - Logo 和品牌名称
 * - 分类列表（可折叠）
 * - 工具导航链接
 * - 响应式设计（移动端抽屉）
 * 
 * @param {Object} props
 * @param {boolean} props.mobileOpen - 移动端侧边栏是否打开
 * @param {Function} props.onDrawerToggle - 移动端侧边栏切换函数
 * @param {number} props.drawerWidth - 侧边栏宽度
 */
function Sidebar({ mobileOpen, onDrawerToggle, drawerWidth }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // 展开状态 - 记录每个分类是否展开
    const [expanded, setExpanded] = useState(() => {
        // 默认展开当前路径对应的分类
        const path = location.pathname;
        const expandedState = {};
        categories.forEach(cat => {
            const categoryTools = getToolsByCategory(cat.id);
            const isActive = categoryTools.some(tool => tool.path === path);
            expandedState[cat.id] = isActive;
        });
        return expandedState;
    });

    // 切换分类展开状态
    const handleExpandClick = (categoryId) => {
        setExpanded(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    // 导航到工具页面
    const handleToolClick = (path) => {
        navigate(path);
        // 移动端关闭侧边栏
        if (mobileOpen) {
            onDrawerToggle();
        }
    };

    // 侧边栏内容
    const drawerContent = (
        <Box sx={{ overflow: 'auto', height: '100%' }}>
            {/* Logo 区域 */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    height: 64,
                    cursor: 'pointer',
                }}
                onClick={() => navigate('/')}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        backgroundColor: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        D
                    </Typography>
                </Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        letterSpacing: '-0.02em',
                    }}
                >
                    DevTools
                </Typography>
            </Box>

            <Divider />

            {/* 首页链接 */}
            <List sx={{ px: 1, py: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={location.pathname === '/'}
                        onClick={() => handleToolClick('/')}
                        sx={{ borderRadius: 2 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <HomeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="首页"
                            primaryTypographyProps={{
                                fontSize: '0.9rem',
                                fontWeight: location.pathname === '/' ? 600 : 400,
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            </List>

            <Divider sx={{ my: 1 }} />

            {/* 分类列表 */}
            <List sx={{ px: 1 }}>
                {categories.map((category) => {
                    const categoryTools = getToolsByCategory(category.id);
                    const isExpanded = expanded[category.id];
                    const hasActiveChild = categoryTools.some(tool => tool.path === location.pathname);

                    return (
                        <Box key={category.id}>
                            {/* 分类标题 */}
                            <ListItemButton
                                onClick={() => handleExpandClick(category.id)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    backgroundColor: hasActiveChild
                                        ? `${theme.palette.primary.main}08`
                                        : 'transparent',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: hasActiveChild ? theme.palette.primary.main : 'inherit' }}>
                                    {getIcon(category.icon)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={category.name}
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: hasActiveChild ? 600 : 500,
                                        color: hasActiveChild ? theme.palette.primary.main : theme.palette.text.primary,
                                    }}
                                />
                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </ListItemButton>

                            {/* 分类下的工具列表 */}
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding sx={{ pl: 2 }}>
                                    {categoryTools.map((tool) => {
                                        const isActive = location.pathname === tool.path;
                                        return (
                                            <ListItemButton
                                                key={tool.id}
                                                selected={isActive}
                                                onClick={() => handleToolClick(tool.path)}
                                                sx={{
                                                    borderRadius: 2,
                                                    mb: 0.5,
                                                    py: 0.75,
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: isActive ? 600 : 400,
                                                                    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                                                                }}
                                                            >
                                                                {tool.name}
                                                            </Typography>
                                                            {tool.isNew && (
                                                                <Chip
                                                                    label="NEW"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 600,
                                                                        backgroundColor: theme.palette.primary.main,
                                                                        color: '#fff',
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </ListItemButton>
                                        );
                                    })}
                                </List>
                            </Collapse>
                        </Box>
                    );
                })}
            </List>

            {/* 底部版权信息 */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    © 2024 DevTools Inc.
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="工具分类导航"
        >
            {/* 移动端抽屉 */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onDrawerToggle}
                ModalProps={{
                    keepMounted: true, // 提升移动端性能
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: theme.palette.background.paper,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* 桌面端固定侧边栏 */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: theme.palette.background.paper,
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}

export default Sidebar;
