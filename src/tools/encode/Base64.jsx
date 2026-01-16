import React, { useState, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';

/**
 * Base64 编码/解码工具
 * 
 * 功能：
 * - 文本 Base64 编码
 * - Base64 解码为文本
 * - 实时转换
 * - 错误处理
 */
function Base64Tool() {
    const theme = useTheme();

    // 状态管理
    const [mode, setMode] = useState('encode'); // encode | decode
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    /**
     * 执行编码
     */
    const encode = useCallback((text) => {
        try {
            // 使用 TextEncoder 支持 UTF-8 中文
            const encoder = new TextEncoder();
            const bytes = encoder.encode(text);
            const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            const result = btoa(binString);
            setOutput(result);
            setError(null);
        } catch (err) {
            setError('编码失败: ' + err.message);
            setOutput('');
        }
    }, []);

    /**
     * 执行解码
     */
    const decode = useCallback((text) => {
        try {
            const binString = atob(text);
            const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0));
            const decoder = new TextDecoder();
            const result = decoder.decode(bytes);
            setOutput(result);
            setError(null);
        } catch (err) {
            setError('解码失败: 请确保输入的是有效的 Base64 字符串');
            setOutput('');
        }
    }, []);

    /**
     * 处理输入变化
     */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);

        if (!value.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        if (mode === 'encode') {
            encode(value);
        } else {
            decode(value);
        }
    };

    /**
     * 切换编码/解码模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            setInput('');
            setOutput('');
            setError(null);
        }
    };

    /**
     * 交换输入输出
     */
    const handleSwap = () => {
        setInput(output);
        setMode(mode === 'encode' ? 'decode' : 'encode');

        // 重新转换
        if (output) {
            if (mode === 'encode') {
                decode(output);
            } else {
                encode(output);
            }
        }
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setInput('');
        setOutput('');
        setError(null);
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Swap',
            icon: <SwapVertIcon fontSize="small" />,
            onClick: handleSwap,
            disabled: !output,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="Base64 编码/解码"
            description="将文本转换为 Base64 编码，或将 Base64 解码为原始文本，完全支持中文字符"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="编码模式"
                >
                    <ToggleButton value="encode" aria-label="编码">
                        <LockIcon sx={{ mr: 1 }} fontSize="small" />
                        编码 (Encode)
                    </ToggleButton>
                    <ToggleButton value="decode" aria-label="解码">
                        <LockOpenIcon sx={{ mr: 1 }} fontSize="small" />
                        解码 (Decode)
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 输入输出区域 */}
            <Grid container spacing={3}>
                {/* 输入 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
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
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                {mode === 'encode' ? '原始文本' : 'Base64 字符串'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={mode === 'encode'
                                ? '输入要编码的文本，例如：Hello World 你好世界'
                                : '输入 Base64 字符串，例如：SGVsbG8gV29ybGQ='
                            }
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    p: 2,
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                },
                            }}
                        />
                    </Paper>
                </Grid>

                {/* 输出 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
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
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                {mode === 'encode' ? 'Base64 编码结果' : '解码后的文本'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            value={output}
                            placeholder="转换结果将显示在这里..."
                            variant="standard"
                            InputProps={{
                                readOnly: true,
                                disableUnderline: true,
                                sx: {
                                    p: 2,
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.02)'
                                        : 'rgba(0,0,0,0.01)',
                                },
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>Base64 是一种将二进制数据编码为 ASCII 字符串的方法，常用于在文本协议中传输二进制数据（如图片、文件）。
                    本工具完全支持 UTF-8 编码的中文字符。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default Base64Tool;
