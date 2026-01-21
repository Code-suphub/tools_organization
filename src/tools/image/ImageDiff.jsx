import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    ToggleButtonGroup,
    ToggleButton,
    Slider,
    IconButton,
    Tooltip,
    Chip,
    Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CompareIcon from '@mui/icons-material/Compare';
import FlipIcon from '@mui/icons-material/Flip';
import LayersIcon from '@mui/icons-material/Layers';
import DifferenceIcon from '@mui/icons-material/Difference';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import ToolCard from '../../components/ToolCard';

/**
 * 对比模式定义
 */
const COMPARE_MODES = [
    { value: 'sideBySide', label: '并排', icon: <ViewColumnIcon fontSize="small" /> },
    { value: 'slider', label: '滑动', icon: <CompareIcon fontSize="small" /> },
    { value: 'toggle', label: '切换', icon: <FlipIcon fontSize="small" /> },
    { value: 'overlay', label: '叠加', icon: <LayersIcon fontSize="small" /> },
    { value: 'diff', label: '差异', icon: <DifferenceIcon fontSize="small" /> },
];

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 图片上传区域组件
 */
const ImageUploadZone = ({ image, onImageChange, label, isDark }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isHoveredRef = useRef(false);

    // 使用 ref 来追踪 hover 状态，避免 useEffect 依赖问题
    useEffect(() => {
        isHoveredRef.current = isHovered;
    }, [isHovered]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                onImageChange({
                    src: e.target.result,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    name: file.name,
                    type: file.type,
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }, [onImageChange]);

    // 支持粘贴 - 只有当鼠标在该区域悬停时才处理
    useEffect(() => {
        const handlePaste = (e) => {
            // 只有当鼠标悬停在此区域时才处理粘贴
            if (!isHoveredRef.current) return;

            const items = e.clipboardData?.items;
            if (items) {
                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            e.preventDefault(); // 阻止其他监听器处理
                            e.stopPropagation();
                            processFile(file);
                            break;
                        }
                    }
                }
            }
        };

        // 使用 capture 阶段来确保优先处理
        window.addEventListener('paste', handlePaste, true);
        return () => window.removeEventListener('paste', handlePaste, true);
    }, [processFile]);

    return (
        <Box
            onClick={() => !image && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                width: '100%',
                height: image ? 'auto' : 200,
                minHeight: 200,
                border: `2px dashed ${isDragging ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: image ? 'default' : 'pointer',
                backgroundColor: isDragging
                    ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                    : 'transparent',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    borderColor: image ? undefined : '#6366f1',
                },
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {image ? (
                <>
                    <img
                        src={image.src}
                        alt={label}
                        style={{
                            maxWidth: '100%',
                            maxHeight: 400,
                            objectFit: 'contain',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="重新上传">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                sx={{
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                                    '&:hover': {
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,1)',
                                    },
                                }}
                            >
                                <CloudUploadIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageChange(null);
                                }}
                                sx={{
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                                    '&:hover': {
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,1)',
                                    },
                                }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                        }}
                    >
                        {image.width}×{image.height} | {formatFileSize(image.size)}
                    </Typography>
                </>
            ) : (
                <>
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        拖拽、点击上传或 Ctrl+V 粘贴
                    </Typography>
                </>
            )}
        </Box>
    );
};

/**
 * 图片对比工具
 *
 * 功能：
 * - 并排对比
 * - 滑动对比 (Slider)
 * - 切换对比 (Toggle)
 * - 叠加对比 (Overlay)
 * - 像素差异检测
 */
function ImageDiff() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // 状态管理
    const [imageA, setImageA] = useState(null);
    const [imageB, setImageB] = useState(null);
    const [compareMode, setCompareMode] = useState('sideBySide');
    const [sliderPosition, setSliderPosition] = useState(50);
    const [overlayOpacity, setOverlayOpacity] = useState(50);
    const [toggleState, setToggleState] = useState('A'); // 'A' | 'B'
    const [diffImage, setDiffImage] = useState(null);
    const [diffStats, setDiffStats] = useState(null);
    const [zoom, setZoom] = useState(100);

    const diffCanvasRef = useRef(null);
    const containerRef = useRef(null);

    /**
     * 计算像素差异
     */
    const calculateDiff = useCallback(() => {
        if (!imageA || !imageB) {
            setDiffImage(null);
            setDiffStats(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 使用较大的尺寸
        const width = Math.max(imageA.width, imageB.width);
        const height = Math.max(imageA.height, imageB.height);
        canvas.width = width;
        canvas.height = height;

        // 创建临时 canvas 获取图片数据
        const getImageData = (imgSrc, w, h) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext('2d');
            const img = new Image();
            img.src = imgSrc;
            tempCtx.drawImage(img, 0, 0, w, h);
            return tempCtx.getImageData(0, 0, w, h);
        };

        const imgA = new Image();
        const imgB = new Image();

        imgA.onload = () => {
            imgB.onload = () => {
                // 绘制图片A
                const canvasA = document.createElement('canvas');
                canvasA.width = width;
                canvasA.height = height;
                const ctxA = canvasA.getContext('2d');
                ctxA.drawImage(imgA, 0, 0, width, height);
                const dataA = ctxA.getImageData(0, 0, width, height);

                // 绘制图片B
                const canvasB = document.createElement('canvas');
                canvasB.width = width;
                canvasB.height = height;
                const ctxB = canvasB.getContext('2d');
                ctxB.drawImage(imgB, 0, 0, width, height);
                const dataB = ctxB.getImageData(0, 0, width, height);

                // 创建差异图
                const diffData = ctx.createImageData(width, height);
                let diffCount = 0;
                const threshold = 30; // 差异阈值

                for (let i = 0; i < dataA.data.length; i += 4) {
                    const rDiff = Math.abs(dataA.data[i] - dataB.data[i]);
                    const gDiff = Math.abs(dataA.data[i + 1] - dataB.data[i + 1]);
                    const bDiff = Math.abs(dataA.data[i + 2] - dataB.data[i + 2]);
                    const maxDiff = Math.max(rDiff, gDiff, bDiff);

                    if (maxDiff > threshold) {
                        // 差异区域用红色高亮
                        diffData.data[i] = 255;     // R
                        diffData.data[i + 1] = 0;   // G
                        diffData.data[i + 2] = 0;   // B
                        diffData.data[i + 3] = 200; // A
                        diffCount++;
                    } else {
                        // 相同区域用灰度显示
                        const gray = (dataA.data[i] + dataA.data[i + 1] + dataA.data[i + 2]) / 3;
                        diffData.data[i] = gray;
                        diffData.data[i + 1] = gray;
                        diffData.data[i + 2] = gray;
                        diffData.data[i + 3] = 128;
                    }
                }

                ctx.putImageData(diffData, 0, 0);

                const totalPixels = width * height;
                const diffPercentage = ((diffCount / totalPixels) * 100).toFixed(2);

                setDiffImage(canvas.toDataURL());
                setDiffStats({
                    totalPixels,
                    diffPixels: diffCount,
                    percentage: diffPercentage,
                });
            };
            imgB.src = imageB.src;
        };
        imgA.src = imageA.src;
    }, [imageA, imageB]);

    // 当图片变化时重新计算差异
    useEffect(() => {
        if (compareMode === 'diff') {
            calculateDiff();
        }
    }, [imageA, imageB, compareMode, calculateDiff]);

    /**
     * 切换对比模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setCompareMode(newMode);
            if (newMode === 'diff') {
                calculateDiff();
            }
        }
    };

    /**
     * 清空所有图片
     */
    const handleClear = useCallback(() => {
        setImageA(null);
        setImageB(null);
        setDiffImage(null);
        setDiffStats(null);
    }, []);

    /**
     * 交换图片
     */
    const handleSwap = useCallback(() => {
        const temp = imageA;
        setImageA(imageB);
        setImageB(temp);
    }, [imageA, imageB]);

    /**
     * 切换显示图片（Toggle 模式）
     */
    const handleToggle = useCallback(() => {
        setToggleState(prev => prev === 'A' ? 'B' : 'A');
    }, []);

    // 工具栏按钮
    const actions = [
        {
            label: 'Swap',
            icon: <SwapHorizIcon fontSize="small" />,
            onClick: handleSwap,
            disabled: !imageA || !imageB,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    /**
     * 渲染对比视图
     */
    const renderCompareView = () => {
        if (!imageA && !imageB) {
            return (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.disabled">
                        请上传两张图片进行对比
                    </Typography>
                </Box>
            );
        }

        if (!imageA || !imageB) {
            return (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.disabled">
                        请上传第二张图片
                    </Typography>
                </Box>
            );
        }

        const containerStyle = {
            position: 'relative',
            width: '100%',
            maxWidth: 800,
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
        };

        const imgStyle = {
            width: '100%',
            display: 'block',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
        };

        switch (compareMode) {
            case 'sideBySide':
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    图片 A
                                </Typography>
                                <img src={imageA.src} alt="Image A" style={{ ...imgStyle, maxHeight: 400, objectFit: 'contain' }} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    图片 B
                                </Typography>
                                <img src={imageB.src} alt="Image B" style={{ ...imgStyle, maxHeight: 400, objectFit: 'contain' }} />
                            </Paper>
                        </Grid>
                    </Grid>
                );

            case 'slider':
                return (
                    <Box sx={containerStyle}>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                            {/* 底层图片 B */}
                            <img src={imageB.src} alt="Image B" style={imgStyle} />

                            {/* 上层图片 A，使用 clip-path 裁剪 */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                                    overflow: 'hidden',
                                }}
                            >
                                <img src={imageA.src} alt="Image A" style={imgStyle} />
                            </Box>

                            {/* 滑动条 */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: `${sliderPosition}%`,
                                    width: 4,
                                    backgroundColor: '#6366f1',
                                    cursor: 'ew-resize',
                                    transform: 'translateX(-50%)',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                        border: '3px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    },
                                }}
                                onMouseDown={(e) => {
                                    const container = e.currentTarget.parentElement;
                                    const rect = container.getBoundingClientRect();

                                    const handleMouseMove = (moveEvent) => {
                                        const x = moveEvent.clientX - rect.left;
                                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                        setSliderPosition(percentage);
                                    };

                                    const handleMouseUp = () => {
                                        document.removeEventListener('mousemove', handleMouseMove);
                                        document.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                }}
                            />

                            {/* 标签 */}
                            <Chip
                                label="A"
                                size="small"
                                sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                            />
                            <Chip
                                label="B"
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                            />
                        </Box>
                    </Box>
                );

            case 'toggle':
                return (
                    <Box sx={containerStyle} onClick={handleToggle} style={{ cursor: 'pointer' }}>
                        <img
                            src={toggleState === 'A' ? imageA.src : imageB.src}
                            alt={`Image ${toggleState}`}
                            style={imgStyle}
                        />
                        <Chip
                            label={`显示: 图片 ${toggleState} (点击切换)`}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                            }}
                        />
                    </Box>
                );

            case 'overlay':
                return (
                    <Box>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                透明度: {overlayOpacity}%
                            </Typography>
                            <Slider
                                value={overlayOpacity}
                                onChange={(_, value) => setOverlayOpacity(value)}
                                min={0}
                                max={100}
                                sx={{ maxWidth: 300 }}
                            />
                        </Box>
                        <Box sx={containerStyle}>
                            {/* 底层图片 A */}
                            <img src={imageA.src} alt="Image A" style={imgStyle} />

                            {/* 上层图片 B，带透明度 */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: overlayOpacity / 100,
                                }}
                            >
                                <img src={imageB.src} alt="Image B" style={imgStyle} />
                            </Box>

                            {/* 标签 */}
                            <Chip
                                label={`A: ${100 - overlayOpacity}%`}
                                size="small"
                                sx={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                            />
                            <Chip
                                label={`B: ${overlayOpacity}%`}
                                size="small"
                                sx={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                            />
                        </Box>
                    </Box>
                );

            case 'diff':
                return (
                    <Box>
                        {diffStats && (
                            <Alert
                                severity={diffStats.percentage > 5 ? 'warning' : 'success'}
                                sx={{ mb: 2 }}
                            >
                                差异分析：共 {diffStats.totalPixels.toLocaleString()} 像素，
                                发现 {diffStats.diffPixels.toLocaleString()} 个差异像素
                                ({diffStats.percentage}%)
                                {diffStats.percentage === '0.00' && ' - 两张图片完全相同！'}
                            </Alert>
                        )}
                        <Box sx={containerStyle}>
                            {diffImage ? (
                                <img src={diffImage} alt="Difference" style={imgStyle} />
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center' }}>
                                    <Typography color="text.disabled">
                                        正在计算差异...
                                    </Typography>
                                </Box>
                            )}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    display: 'flex',
                                    gap: 1,
                                }}
                            >
                                <Chip
                                    label="红色区域 = 差异"
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white' }}
                                />
                                <Chip
                                    label="灰色区域 = 相同"
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(128, 128, 128, 0.9)', color: 'white' }}
                                />
                            </Box>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <ToolCard
            title="图片对比"
            description="多种模式对比两张图片：并排、滑动、切换、叠加、像素差异检测"
            actions={actions}
        >
            {/* 对比模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <ToggleButtonGroup
                    value={compareMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="对比模式"
                    size="small"
                >
                    {COMPARE_MODES.map(mode => (
                        <ToggleButton key={mode.value} value={mode.value} aria-label={mode.label}>
                            {mode.icon}
                            <Typography variant="body2" sx={{ ml: 0.5 }}>{mode.label}</Typography>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                {/* 缩放控制 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="缩小">
                        <IconButton
                            size="small"
                            onClick={() => setZoom(prev => Math.max(25, prev - 25))}
                            disabled={zoom <= 25}
                        >
                            <ZoomOutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
                        {zoom}%
                    </Typography>
                    <Tooltip title="放大">
                        <IconButton
                            size="small"
                            onClick={() => setZoom(prev => Math.min(200, prev + 25))}
                            disabled={zoom >= 200}
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 图片上传区域 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                            图片 A（原始）
                        </Typography>
                        <ImageUploadZone
                            image={imageA}
                            onImageChange={setImageA}
                            label="上传图片 A"
                            isDark={isDark}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                            图片 B（修改后）
                        </Typography>
                        <ImageUploadZone
                            image={imageB}
                            onImageChange={setImageB}
                            label="上传图片 B"
                            isDark={isDark}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 对比结果区域 */}
            {(imageA || imageB) && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 2 }}>
                        对比结果 - {COMPARE_MODES.find(m => m.value === compareMode)?.label}模式
                    </Typography>
                    {renderCompareView()}
                </Paper>
            )}

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    上传两张图片后选择对比模式。<strong>滑动模式</strong>可拖动分隔线；
                    <strong>切换模式</strong>点击图片切换；
                    <strong>叠加模式</strong>调整透明度；
                    <strong>差异模式</strong>自动检测像素差异并用红色高亮。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default ImageDiff;
