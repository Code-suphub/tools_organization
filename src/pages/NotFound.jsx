import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

/**
 * 404 页面组件
 * 
 * 当用户访问不存在的路径时显示
 */
function NotFound() {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Box
            className="animate-fade-in"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 200px)',
                textAlign: 'center',
                px: 2,
            }}
        >
            {/* 404 数字 */}
            <Typography
                variant="h1"
                sx={{
                    fontSize: { xs: '6rem', md: '10rem' },
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#3f3f46' : '#e4e4e7',
                    lineHeight: 1,
                    mb: 2,
                }}
            >
                404
            </Typography>

            {/* 标题 */}
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                }}
            >
                页面未找到
            </Typography>

            {/* 描述 */}
            <Typography
                variant="body1"
                sx={{
                    color: theme.palette.text.secondary,
                    maxWidth: 400,
                    mb: 4,
                }}
            >
                抱歉，您访问的页面不存在或已被移除。
                请检查 URL 是否正确，或返回首页浏览其他工具。
            </Typography>

            {/* 返回首页按钮 */}
            <Button
                variant="contained"
                color="primary"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{ px: 4, py: 1.5 }}
            >
                返回首页
            </Button>
        </Box>
    );
}

export default NotFound;
