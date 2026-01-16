import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Tooltip,
    IconButton,
    useTheme,
    Snackbar,
    Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * 通用工具卡片容器组件
 * 
 * 提供统一的工具页面布局：
 * - 标题和描述
 * - 操作按钮区域
 * - 内容区域（children）
 * - 复制和清空功能
 * 
 * @param {Object} props
 * @param {string} props.title - 工具标题
 * @param {string} props.description - 工具描述
 * @param {React.ReactNode} props.children - 工具内容
 * @param {Array} props.actions - 自定义操作按钮配置
 * @param {string} props.copyContent - 一键复制的内容
 * @param {Function} props.onClear - 清空按钮回调
 * @param {boolean} props.showToolbar - 是否显示工具栏，默认 true
 */
function ToolCard({
    title,
    description,
    children,
    actions = [],
    copyContent,
    onClear,
    showToolbar = true,
}) {
    const theme = useTheme();
    const [snackbar, setSnackbar] = React.useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // 复制到剪贴板
    const handleCopy = async () => {
        if (!copyContent) return;

        try {
            await navigator.clipboard.writeText(copyContent);
            setSnackbar({
                open: true,
                message: '已复制到剪贴板',
                severity: 'success',
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: '复制失败，请手动复制',
                severity: 'error',
            });
        }
    };

    // 关闭提示
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <Box className="animate-fade-in">
            {/* 标题区域 */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1,
                    }}
                >
                    {title}
                </Typography>
                {description && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                        {description}
                    </Typography>
                )}
            </Box>

            {/* 工具栏 */}
            {showToolbar && (
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        p: 1.5,
                        mb: 2,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                    }}
                >
                    {/* 自定义操作按钮 */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || 'text'}
                                color={action.color || 'inherit'}
                                size="small"
                                startIcon={action.icon}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                sx={{
                                    color: action.variant === 'contained'
                                        ? undefined
                                        : theme.palette.text.secondary,
                                    '&:hover': {
                                        backgroundColor: action.variant === 'contained'
                                            ? undefined
                                            : theme.palette.action.hover,
                                    },
                                }}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </Box>

                    {/* 右侧通用操作 */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onClear && (
                            <Tooltip title="清空">
                                <IconButton
                                    size="small"
                                    onClick={onClear}
                                    sx={{ color: theme.palette.text.secondary }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {copyContent !== undefined && (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<ContentCopyIcon fontSize="small" />}
                                onClick={handleCopy}
                                disabled={!copyContent}
                            >
                                Copy
                            </Button>
                        )}
                    </Box>
                </Paper>
            )}

            {/* 内容区域 */}
            <Box>{children}</Box>

            {/* 提示条 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ToolCard;
