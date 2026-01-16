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
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';

/**
 * URL 编码/解码工具
 * 
 * 功能：
 * - URL 参数编码（encodeURIComponent）
 * - URL 解码（decodeURIComponent）
 * - 完整 URL 编码（encodeURI）
 * - 实时转换
 */
function UrlEncode() {
    const theme = useTheme();

    // 状态管理
    const [mode, setMode] = useState('encode'); // encode | decode
    const [encodeType, setEncodeType] = useState('component'); // component | uri
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    /**
     * 执行编码
     */
    const encode = useCallback((text, type) => {
        try {
            const result = type === 'component'
                ? encodeURIComponent(text)
                : encodeURI(text);
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
    const decode = useCallback((text, type) => {
        try {
            const result = type === 'component'
                ? decodeURIComponent(text)
                : decodeURI(text);
            setOutput(result);
            setError(null);
        } catch (err) {
            setError('解码失败: 请确保输入的是有效的 URL 编码字符串');
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
            encode(value, encodeType);
        } else {
            decode(value, encodeType);
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
     * 切换编码类型
     */
    const handleEncodeTypeChange = (_, newType) => {
        if (newType !== null) {
            setEncodeType(newType);
            if (input) {
                if (mode === 'encode') {
                    encode(input, newType);
                } else {
                    decode(input, newType);
                }
            }
        }
    };

    /**
     * 交换输入输出
     */
    const handleSwap = () => {
        setInput(output);
        setMode(mode === 'encode' ? 'decode' : 'encode');

        if (output) {
            if (mode === 'encode') {
                decode(output, encodeType);
            } else {
                encode(output, encodeType);
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
            title="URL 编码/解码"
            description="对 URL 参数或完整 URL 进行编码和解码，支持中文和特殊字符"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="编码模式"
                    size="small"
                >
                    <ToggleButton value="encode" aria-label="编码">
                        <LinkIcon sx={{ mr: 1 }} fontSize="small" />
                        编码 (Encode)
                    </ToggleButton>
                    <ToggleButton value="decode" aria-label="解码">
                        <LinkOffIcon sx={{ mr: 1 }} fontSize="small" />
                        解码 (Decode)
                    </ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                    value={encodeType}
                    exclusive
                    onChange={handleEncodeTypeChange}
                    aria-label="编码类型"
                    size="small"
                >
                    <ToggleButton value="component" aria-label="参数编码">
                        参数 (Component)
                    </ToggleButton>
                    <ToggleButton value="uri" aria-label="完整URL">
                        完整URL (URI)
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
                                {mode === 'encode' ? '原始文本' : 'URL 编码字符串'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={mode === 'encode'
                                ? '输入要编码的文本，例如：hello world 你好&name=test'
                                : '输入 URL 编码字符串，例如：hello%20world%20%E4%BD%A0%E5%A5%BD'
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
                                {mode === 'encode' ? 'URL 编码结果' : '解码后的文本'}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
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
                <Typography variant="body2" color="text.secondary" paragraph>
                    💡 <strong>编码类型说明：</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 3 }}>
                    <li><strong>参数 (Component)：</strong>对 URL 参数值进行编码，会编码所有特殊字符（包括 =, &, /, ? 等）。适用于 URL 查询参数。</li>
                    <li><strong>完整 URL (URI)：</strong>对完整 URL 进行编码，保留 URL 结构字符（如 /, ?, #, & 等）。适用于编码整个 URL。</li>
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default UrlEncode;
