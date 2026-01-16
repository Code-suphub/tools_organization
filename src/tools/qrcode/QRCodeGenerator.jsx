import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Slider,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import QRCode from 'qrcode';

import ToolCard from '../../components/ToolCard';

/**
 * 二维码错误纠正级别
 */
const errorCorrectionLevels = [
    { value: 'L', label: 'L - 低 (7%)' },
    { value: 'M', label: 'M - 中 (15%)' },
    { value: 'Q', label: 'Q - 较高 (25%)' },
    { value: 'H', label: 'H - 高 (30%)' },
];

/**
 * 二维码生成器
 * 
 * 功能：
 * - 根据文本生成二维码
 * - 可调节尺寸和纠错级别
 * - 支持下载 PNG 图片
 */
function QRCodeGenerator() {
    const theme = useTheme();
    const canvasRef = useRef(null);

    // 状态管理
    const [text, setText] = useState('https://devtools.example.com');
    const [size, setSize] = useState(256);
    const [errorLevel, setErrorLevel] = useState('M');
    const [foregroundColor, setForegroundColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');

    /**
     * 生成二维码
     */
    const generateQRCode = useCallback(async () => {
        if (!text || !canvasRef.current) return;

        try {
            await QRCode.toCanvas(canvasRef.current, text, {
                width: size,
                margin: 2,
                errorCorrectionLevel: errorLevel,
                color: {
                    dark: foregroundColor,
                    light: backgroundColor,
                },
            });
        } catch (err) {
            console.error('生成二维码失败:', err);
        }
    }, [text, size, errorLevel, foregroundColor, backgroundColor]);

    // 监听配置变化，重新生成
    useEffect(() => {
        generateQRCode();
    }, [generateQRCode]);

    /**
     * 下载二维码图片
     */
    const handleDownload = () => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setText('');
    };

    return (
        <ToolCard
            title="二维码生成器"
            description="根据文本或 URL 生成二维码图片，支持自定义尺寸、颜色和纠错级别"
            onClear={handleClear}
        >
            <Grid container spacing={3}>
                {/* 配置区域 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            配置选项
                        </Typography>

                        {/* 文本输入 */}
                        <TextField
                            fullWidth
                            label="文本或 URL"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="输入要生成二维码的内容..."
                            multiline
                            rows={3}
                            sx={{ mb: 3 }}
                        />

                        {/* 尺寸调节 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                尺寸: {size}px × {size}px
                            </Typography>
                            <Slider
                                value={size}
                                onChange={(_, value) => setSize(value)}
                                min={128}
                                max={512}
                                step={32}
                                marks={[
                                    { value: 128, label: '128' },
                                    { value: 256, label: '256' },
                                    { value: 512, label: '512' },
                                ]}
                            />
                        </Box>

                        {/* 纠错级别 */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>纠错级别</InputLabel>
                            <Select
                                value={errorLevel}
                                label="纠错级别"
                                onChange={(e) => setErrorLevel(e.target.value)}
                            >
                                {errorCorrectionLevels.map((level) => (
                                    <MenuItem key={level.value} value={level.value}>
                                        {level.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 颜色选择 */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    前景色
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                        type="color"
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    背景色
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>

                        {/* 下载按钮 */}
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                            fullWidth
                            disabled={!text}
                        >
                            下载 PNG 图片
                        </Button>
                    </Paper>
                </Grid>

                {/* 预览区域 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 400,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            预览
                        </Typography>

                        {text ? (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: backgroundColor,
                                    boxShadow: theme.palette.mode === 'dark'
                                        ? '0 4px 20px rgba(0,0,0,0.4)'
                                        : '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                            >
                                <canvas ref={canvasRef} />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    width: size,
                                    height: size,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 2,
                                    border: `2px dashed ${theme.palette.divider}`,
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    输入内容后预览二维码
                                </Typography>
                            </Box>
                        )}

                        {text && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 2, textAlign: 'center', maxWidth: 300 }}
                            >
                                扫描此二维码可访问：
                                <br />
                                <strong style={{ wordBreak: 'break-all' }}>
                                    {text.length > 50 ? text.substring(0, 50) + '...' : text}
                                </strong>
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* 说明 */}
                <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                        💡 <strong>纠错级别说明：</strong>
                        纠错级别越高，二维码越密集，但即使部分损坏也能被正确识别。
                        L 级别适合清晰环境，H 级别适合在二维码上添加 Logo 或在恶劣条件下使用。
                    </Typography>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default QRCodeGenerator;
