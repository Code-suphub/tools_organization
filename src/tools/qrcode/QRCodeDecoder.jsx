import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    useTheme,
    Alert,
    IconButton,
    Tooltip,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import jsQR from 'jsqr';

import ToolCard from '../../components/ToolCard';

/**
 * 二维码解析器
 *
 * 功能：
 * - 上传图片解析二维码
 * - 粘贴图片解析二维码（支持 Ctrl+V）
 * - 拖拽上传
 * - 显示解析结果
 * - 复制结果
 */
function QRCodeDecoder() {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // 状态管理
    const [imageData, setImageData] = useState(null); // Base64 图片数据
    const [imageName, setImageName] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pasteHint, setPasteHint] = useState(false); // 显示粘贴快捷键提示

    /**
     * 解析图片中的二维码
     */
    const decodeQRCode = useCallback(async (imageSrc) => {
        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = imageSrc;
            });

            // 创建 canvas 获取图片数据
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                setResult(code.data);
            } else {
                setError('未检测到二维码，请确保图片中包含清晰的二维码');
            }
        } catch (err) {
            setError('解析失败：' + err.message);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * 处理文件选择
     */
    const handleFileSelect = useCallback((file) => {
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            setError('请选择图片文件');
            return;
        }

        // 检查文件大小（最大 10MB）
        if (file.size > 10 * 1024 * 1024) {
            setError('图片大小不能超过 10MB');
            return;
        }

        setImageName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setImageData(base64);
            decodeQRCode(base64);
        };
        reader.onerror = () => {
            setError('读取文件失败');
        };
        reader.readAsDataURL(file);
    }, [decodeQRCode]);

    /**
     * 处理文件上传
     */
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // 重置 input 以便重复选择同一文件
        e.target.value = '';
    };

    /**
     * 处理粘贴事件（来自 ClipboardEvent）
     * 这是最可靠的方式，直接从 paste 事件获取剪贴板数据
     */
    const handlePasteEvent = useCallback((e) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        // 查找图片类型的数据
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const blob = item.getAsFile();
                if (blob) {
                    const file = new File([blob], 'pasted-image.png', { type: item.type });
                    handleFileSelect(file);
                    return;
                }
            }
        }

        // 也检查 files
        const files = clipboardData.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.startsWith('image/')) {
                    e.preventDefault();
                    handleFileSelect(files[i]);
                    return;
                }
            }
        }
    }, [handleFileSelect]);

    /**
     * 监听全局 paste 事件，支持 Ctrl+V 粘贴
     */
    useEffect(() => {
        const handleGlobalPaste = (e) => {
            // 如果焦点在输入框中，不处理（避免干扰正常输入）
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            )) {
                return;
            }

            handlePasteEvent(e);
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => {
            document.removeEventListener('paste', handleGlobalPaste);
        };
    }, [handlePasteEvent]);

    /**
     * 按钮点击粘贴 - 使用 Clipboard API 作为备选
     */
    const handlePasteClick = useCallback(async () => {
        try {
            // 方法1：尝试使用 Clipboard API 读取
            if (navigator.clipboard && navigator.clipboard.read) {
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const item of clipboardItems) {
                        const imageType = item.types.find(type => type.startsWith('image/'));
                        if (imageType) {
                            const blob = await item.getType(imageType);
                            const file = new File([blob], 'pasted-image.png', { type: imageType });
                            handleFileSelect(file);
                            return;
                        }
                    }
                } catch (clipboardError) {
                    // Clipboard API 可能需要权限或不支持，继续尝试其他方法
                    console.log('Clipboard API 读取失败，提示用户使用快捷键', clipboardError);
                }
            }

            // 如果 Clipboard API 不可用或失败，提示用户使用 Ctrl+V
            setPasteHint(true);
            setTimeout(() => setPasteHint(false), 5000);

        } catch (err) {
            setError('无法读取剪贴板，请直接按 Ctrl+V (或 Cmd+V) 粘贴图片');
        }
    }, [handleFileSelect]);

    /**
     * 处理拖拽进入
     */
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    /**
     * 处理拖拽离开
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    /**
     * 处理拖拽悬停
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * 处理放置
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setImageData(null);
        setImageName('');
        setResult(null);
        setError(null);
        setCopied(false);
        setPasteHint(false);
    };

    /**
     * 复制结果
     */
    const handleCopy = async () => {
        if (result) {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    /**
     * 打开链接（如果结果是 URL）
     */
    const handleOpenLink = () => {
        if (result && isValidUrl(result)) {
            window.open(result, '_blank', 'noopener,noreferrer');
        }
    };

    /**
     * 检查是否是有效的 URL
     */
    const isValidUrl = (str) => {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Paste',
            icon: <ContentPasteIcon fontSize="small" />,
            onClick: handlePasteClick,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="二维码解析"
            description="上传或粘贴包含二维码的图片，解析二维码内容"
            actions={actions}
            copyContent={result || ''}
        >
            {/* 粘贴快捷键提示 */}
            {pasteHint && (
                <Alert
                    severity="info"
                    icon={<KeyboardIcon />}
                    sx={{ mb: 2 }}
                    onClose={() => setPasteHint(false)}
                >
                    请直接按 <strong>Ctrl+V</strong>（Mac 用户按 <strong>Cmd+V</strong>）粘贴图片，
                    这种方式更加可靠！
                </Alert>
            )}

            {/* 上传区域 */}
            <Paper
                ref={dropZoneRef}
                elevation={0}
                tabIndex={0}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onPaste={handlePasteEvent}
                sx={{
                    p: 4,
                    backgroundColor: isDragging
                        ? (theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                        : theme.palette.background.paper,
                    border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.05)'
                            : 'rgba(99, 102, 241, 0.02)',
                    },
                    '&:focus': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                    },
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />

                {imageData ? (
                    // 显示已上传的图片
                    <Box sx={{ textAlign: 'center' }}>
                        <Box
                            component="img"
                            src={imageData}
                            alt="上传的图片"
                            sx={{
                                maxWidth: '100%',
                                maxHeight: 300,
                                borderRadius: 1,
                                mb: 2,
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '0 4px 20px rgba(0,0,0,0.4)'
                                    : '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {imageName}
                        </Typography>
                    </Box>
                ) : (
                    // 上传提示
                    <>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(99, 102, 241, 0.1)'
                                    : 'rgba(99, 102, 241, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                            }}
                        >
                            <ImageIcon
                                sx={{
                                    fontSize: 40,
                                    color: theme.palette.primary.main,
                                }}
                            />
                        </Box>
                        <Typography variant="h6" fontWeight={500} sx={{ mb: 1 }}>
                            {isDragging ? '释放以上传图片' : '拖拽图片到此处'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            或点击上传，支持 PNG、JPG、GIF 等格式
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                color: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            <KeyboardIcon fontSize="small" />
                            可直接按 Ctrl+V (Cmd+V) 粘贴图片
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                选择文件
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ContentPasteIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePasteClick();
                                }}
                            >
                                粘贴图片
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>

            {/* 处理中提示 */}
            {isProcessing && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    正在解析二维码...
                </Alert>
            )}

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 解析结果 */}
            {result && (
                <Paper
                    elevation={0}
                    sx={{
                        mt: 3,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 1,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon fontSize="small" color="success" />
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                解析结果
                            </Typography>
                            {isValidUrl(result) && (
                                <Chip
                                    size="small"
                                    label="URL"
                                    color="primary"
                                    sx={{ height: 20, fontSize: 11 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {isValidUrl(result) && (
                                <Tooltip title="打开链接" arrow>
                                    <IconButton size="small" onClick={handleOpenLink}>
                                        <LinkIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title={copied ? '已复制!' : '复制结果'} arrow>
                                <IconButton size="small" onClick={handleCopy}>
                                    <ContentCopyIcon fontSize="small" color={copied ? 'success' : 'inherit'} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <Typography
                            sx={{
                                fontFamily: 'Fira Code, monospace',
                                fontSize: 14,
                                wordBreak: 'break-all',
                                color: theme.palette.text.primary,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {result}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    支持三种方式：① 拖拽图片到此处 ② 点击选择文件 ③ 直接按 <strong>Ctrl+V</strong>（Mac 按 <strong>Cmd+V</strong>）粘贴剪贴板中的图片。
                    推荐使用快捷键粘贴，更加快捷方便！
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default QRCodeDecoder;
