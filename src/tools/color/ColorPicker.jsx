import React, { useState, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    IconButton,
    Tooltip,
    useTheme,
    Slider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

import ToolCard from '../../components/ToolCard';

/**
 * 预设颜色调色板
 */
const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#0f172a',
];

/**
 * 颜色选择器工具
 * 
 * 功能：
 * - 颜色选择
 * - HEX / RGB / HSL 格式互转
 * - 预设颜色调色板
 * - 一键复制
 */
function ColorPicker() {
    const theme = useTheme();

    // 状态管理
    const [hex, setHex] = useState('#0066FF');
    const [rgb, setRgb] = useState({ r: 0, g: 102, b: 255 });
    const [hsl, setHsl] = useState({ h: 216, s: 100, l: 50 });

    /**
     * HEX 转 RGB
     */
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            };
        }
        return null;
    };

    /**
     * RGB 转 HEX
     */
    const rgbToHex = (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    };

    /**
     * RGB 转 HSL
     */
    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
                default:
                    h = 0;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    };

    /**
     * HSL 转 RGB
     */
    const hslToRgb = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    };

    /**
     * 更新所有颜色格式（从 HEX）
     */
    const updateFromHex = useCallback((newHex) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(newHex)) return;

        setHex(newHex);
        const newRgb = hexToRgb(newHex);
        if (newRgb) {
            setRgb(newRgb);
            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        }
    }, []);

    /**
     * 更新所有颜色格式（从 RGB）
     */
    const updateFromRgb = useCallback((newRgb) => {
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }, []);

    /**
     * 更新所有颜色格式（从 HSL）
     */
    const updateFromHsl = useCallback((newHsl) => {
        setHsl(newHsl);
        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }, []);

    /**
     * 生成随机颜色
     */
    const generateRandomColor = () => {
        const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        updateFromHex(randomHex);
    };

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    // 格式化的颜色值
    const hexValue = hex.toUpperCase();
    const rgbValue = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslValue = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    return (
        <ToolCard
            title="颜色选择器"
            description="选择颜色并在 HEX、RGB、HSL 格式之间互相转换"
            showToolbar={false}
        >
            <Grid container spacing={3}>
                {/* 颜色预览和选择器 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            颜色预览
                        </Typography>

                        {/* 颜色预览块 */}
                        <Box
                            sx={{
                                width: '100%',
                                height: 160,
                                backgroundColor: hex,
                                borderRadius: 2,
                                mb: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: `0 4px 20px ${hex}40`,
                            }}
                        />

                        {/* 颜色选择器 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <input
                                type="color"
                                value={hex}
                                onChange={(e) => updateFromHex(e.target.value)}
                                style={{
                                    width: 60,
                                    height: 40,
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                }}
                            />
                            <TextField
                                fullWidth
                                label="HEX"
                                value={hex}
                                onChange={(e) => updateFromHex(e.target.value)}
                                size="small"
                                sx={{ fontFamily: 'Fira Code, monospace' }}
                            />
                            <Tooltip title="随机颜色">
                                <IconButton onClick={generateRandomColor}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {/* 预设颜色 */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            预设颜色
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {presetColors.map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => updateFromHex(color)}
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        backgroundColor: color,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        border: hex.toLowerCase() === color.toLowerCase()
                                            ? '2px solid white'
                                            : '1px solid transparent',
                                        boxShadow: hex.toLowerCase() === color.toLowerCase()
                                            ? `0 0 0 2px ${color}`
                                            : 'none',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                        },
                                        transition: 'transform 0.15s ease',
                                    }}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* 颜色格式 */}
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
                            颜色格式
                        </Typography>

                        {/* HEX */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                HEX
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.03)'
                                        : 'rgba(0,0,0,0.02)',
                                }}
                            >
                                <Typography sx={{ flex: 1, fontFamily: 'Fira Code, monospace' }}>
                                    {hexValue}
                                </Typography>
                                <Tooltip title="复制">
                                    <IconButton size="small" onClick={() => copyToClipboard(hexValue)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* RGB */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                RGB
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.03)'
                                        : 'rgba(0,0,0,0.02)',
                                    mb: 1,
                                }}
                            >
                                <Typography sx={{ flex: 1, fontFamily: 'Fira Code, monospace' }}>
                                    {rgbValue}
                                </Typography>
                                <Tooltip title="复制">
                                    <IconButton size="small" onClick={() => copyToClipboard(rgbValue)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <TextField
                                        label="R"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={rgb.r}
                                        onChange={(e) => updateFromRgb({ ...rgb, r: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                                        inputProps={{ min: 0, max: 255 }}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="G"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={rgb.g}
                                        onChange={(e) => updateFromRgb({ ...rgb, g: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                                        inputProps={{ min: 0, max: 255 }}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="B"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={rgb.b}
                                        onChange={(e) => updateFromRgb({ ...rgb, b: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) })}
                                        inputProps={{ min: 0, max: 255 }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* HSL */}
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                HSL
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.03)'
                                        : 'rgba(0,0,0,0.02)',
                                    mb: 1,
                                }}
                            >
                                <Typography sx={{ flex: 1, fontFamily: 'Fira Code, monospace' }}>
                                    {hslValue}
                                </Typography>
                                <Tooltip title="复制">
                                    <IconButton size="small" onClick={() => copyToClipboard(hslValue)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ px: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    色相 (H): {hsl.h}°
                                </Typography>
                                <Slider
                                    value={hsl.h}
                                    onChange={(_, value) => updateFromHsl({ ...hsl, h: value })}
                                    min={0}
                                    max={360}
                                    sx={{
                                        '& .MuiSlider-track': {
                                            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                                        },
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    饱和度 (S): {hsl.s}%
                                </Typography>
                                <Slider
                                    value={hsl.s}
                                    onChange={(_, value) => updateFromHsl({ ...hsl, s: value })}
                                    min={0}
                                    max={100}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    亮度 (L): {hsl.l}%
                                </Typography>
                                <Slider
                                    value={hsl.l}
                                    onChange={(_, value) => updateFromHsl({ ...hsl, l: value })}
                                    min={0}
                                    max={100}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default ColorPicker;
