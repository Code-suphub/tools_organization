import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    useTheme,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CodeIcon from '@mui/icons-material/Code';
import LockIcon from '@mui/icons-material/Lock';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CompareIcon from '@mui/icons-material/Compare';
import LinkIcon from '@mui/icons-material/Link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { getFeaturedTools } from '../config/tools';

/**
 * 图标映射
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
    Difference: CompareIcon,
};

/**
 * 获取图标组件
 */
const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || DataObjectIcon;
    return IconComponent;
};

/**
 * 首页组件
 * 
 * 显示内容：
 * - Hero 区域（标题和描述）
 * - 推荐工具网格
 */
function Home() {
    const theme = useTheme();
    const navigate = useNavigate();
    const featuredTools = getFeaturedTools();

    // 处理工具卡片点击
    const handleToolClick = (path) => {
        navigate(path);
    };

    return (
        <Box className="animate-fade-in">
            {/* Hero 区域 */}
            <Box
                sx={{
                    textAlign: 'center',
                    py: { xs: 4, md: 8 },
                    px: 2,
                }}
            >
                {/* NEW 标签 */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Chip
                        icon={
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                    ml: 1,
                                }}
                            />
                        }
                        label="NEW"
                        size="small"
                        variant="outlined"
                        sx={{
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                        }}
                    />
                </Box>

                {/* 主标题 */}
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 2,
                        lineHeight: 1.1,
                    }}
                >
                    开发更快，
                    <br />
                    交付更
                    <Box component="span" sx={{ color: theme.palette.primary.main }}>
                        智能
                    </Box>
                    。
                </Typography>

                {/* 副标题 */}
                <Typography
                    variant="body1"
                    sx={{
                        color: theme.palette.text.secondary,
                        maxWidth: 600,
                        mx: 'auto',
                        mb: 4,
                        fontSize: { xs: '1rem', md: '1.125rem' },
                        lineHeight: 1.6,
                    }}
                >
                    现代化开发者工具集合，助您高效完成 JSON 处理、编码转换、
                    时间计算等日常开发任务。开始免费使用。
                </Typography>
            </Box>

            {/* 工具网格 */}
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, md: 3 } }}>
                <Grid container spacing={3}>
                    {featuredTools.map((tool) => {
                        const IconComponent = getIcon(tool.icon);
                        return (
                            <Grid item xs={12} sm={6} lg={4} key={tool.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleToolClick(tool.path)}
                                        sx={{ height: '100%', p: 0 }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            {/* 图标 */}
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    backgroundColor: theme.palette.mode === 'dark'
                                                        ? 'rgba(255,255,255,0.1)'
                                                        : 'rgba(0,0,0,0.04)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 2,
                                                }}
                                            >
                                                <IconComponent
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: 24,
                                                    }}
                                                />
                                            </Box>

                                            {/* 标题 + NEW 标签 */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.primary,
                                                        fontSize: '1.1rem',
                                                    }}
                                                >
                                                    {tool.name}
                                                </Typography>
                                                {tool.isNew && (
                                                    <Chip
                                                        label="NEW"
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                            backgroundColor: theme.palette.primary.main,
                                                            color: '#fff',
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* 描述 */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    mb: 2,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {tool.description}
                                            </Typography>

                                            {/* 使用链接 */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: theme.palette.primary.main,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Use tool
                                                <ArrowForwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* 页脚 */}
            <Box
                sx={{
                    textAlign: 'center',
                    py: 6,
                    mt: 6,
                    borderTop: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    © 2024 DevTools Inc. · Privacy · Terms
                </Typography>
            </Box>
        </Box>
    );
}

export default Home;
