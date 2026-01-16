import React, { useState, useRef } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    useTheme,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import ToolCard from '../../components/ToolCard';

/**
 * 图片转 Base64 工具
 * 
 * 功能：
 * - 图片转 Base64 字符串
 * - Base64 字符串转图片
 * - 支持拖拽上传
 * - 支持复制 Base64
 */
function ImageBase64() {
    const theme = useTheme();

    // 状态管理
    const [activeTab, setActiveTab] = useState(0); // 0: Image -> Base64, 1: Base64 -> Image
    const [base64, setBase64] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [imageInfo, setImageInfo] = useState(null);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    /**
     * 处理文件选择
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    /**
     * 处理文件处理逻辑
     */
    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            setError('请选择有效的图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            setBase64(result);
            setPreviewUrl(result);
            setImageInfo({
                name: file.name,
                size: (file.size / 1024).toFixed(2) + ' KB',
                type: file.type,
            });
            setError(null);
        };
        reader.onerror = () => {
            setError('读取文件失败');
        };
        reader.readAsDataURL(file);
    };

    /**
     * 处理 Base64 输入
     */
    const handleBase64Change = (e) => {
        const value = e.target.value;
        setBase64(value);

        if (value.trim()) {
            // 尝试预览 Base64 图片
            if (value.startsWith('data:image/')) {
                setPreviewUrl(value);
            } else {
                // 如果没有前缀，尝试添加
                setPreviewUrl(`data:image/png;base64,${value}`);
            }
            setImageInfo(null);
        } else {
            setPreviewUrl('');
        }
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setBase64('');
        setPreviewUrl('');
        setImageInfo(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * 复制 Base64
     */
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(base64);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    /**
     * 切换 Tab
     */
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setError(null);
    };

    // 工具栏按钮
    const actions = [
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    if (activeTab === 0 && base64) {
        actions.unshift({
            label: 'Copy Base64',
            icon: <ContentCopyIcon fontSize="small" />,
            onClick: handleCopy,
            variant: 'contained',
            color: 'primary',
        });
    }

    return (
        <ToolCard
            title="图片 Base64 转换"
            description="将图片转换为 Base64 字符串，或者将 Base64 还原为图片"
            actions={actions}
        >
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 3 }}
            >
                <Tab label="图片转 Base64" />
                <Tab label="Base64 转图片" />
            </Tabs>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* 左侧：输入区域 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {activeTab === 0 ? (
                            // 图片上传
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `2px dashed ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    p: 4,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: theme.palette.mode === 'dark'
                                            ? 'rgba(0, 102, 255, 0.05)'
                                            : 'rgba(0, 102, 255, 0.02)',
                                    },
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" fontWeight={500} color="text.primary">
                                    点击上传图片
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    支持 PNG, JPG, GIF, SVG, WEBP
                                </Typography>
                            </Box>
                        ) : (
                            // Base64 输入
                            <TextField
                                fullWidth
                                multiline
                                rows={12}
                                value={base64}
                                onChange={handleBase64Change}
                                placeholder="在此粘贴 Base64 字符串..."
                                variant="outlined"
                                sx={{
                                    flex: 1,
                                    '& .MuiInputBase-root': {
                                        height: '100%',
                                        alignItems: 'flex-start',
                                        fontFamily: 'Fira Code, monospace',
                                        fontSize: '13px',
                                    },
                                }}
                            />
                        )}
                    </Paper>
                </Grid>

                {/* 右侧：预览和结果 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            {activeTab === 0 ? 'Base64 结果' : '图片预览'}
                        </Typography>

                        {activeTab === 0 ? (
                            // 显示转换后的 Base64
                            <>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    value={base64}
                                    placeholder="Base64 结果将显示在这里..."
                                    variant="outlined"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    sx={{
                                        mb: 2,
                                        flex: 1,
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'Fira Code, monospace',
                                            fontSize: '13px',
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? 'rgba(255,255,255,0.02)'
                                                : 'rgba(0,0,0,0.02)',
                                        },
                                    }}
                                />
                                {imageInfo && (
                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            文件名: {imageInfo.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            大小: {imageInfo.size}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            类型: {imageInfo.type}
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        ) : (
                            // 显示 Base64 还原的图片
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(0,0,0,0.2)'
                                        : 'rgba(0,0,0,0.05)',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    minHeight: 200,
                                }}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                        <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                        <Typography variant="body2">暂无预览</Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default ImageBase64;
