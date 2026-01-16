import React, { useState, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert } from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON 格式化工具
 * 
 * 功能：
 * - JSON 美化（格式化）
 * - JSON 压缩（最小化）
 * - JSON 语法校验
 * - 实时错误提示
 */
function JsonFormat() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(null);

    /**
     * 格式化 JSON（美化）
     */
    const handleFormat = useCallback(() => {
        if (!input.trim()) {
            setError('请输入 JSON 内容');
            setIsValid(false);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError(`JSON 语法错误: ${err.message}`);
            setIsValid(false);
            setOutput('');
        }
    }, [input]);

    /**
     * 压缩 JSON（最小化）
     */
    const handleMinify = useCallback(() => {
        if (!input.trim()) {
            setError('请输入 JSON 内容');
            setIsValid(false);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError(`JSON 语法错误: ${err.message}`);
            setIsValid(false);
            setOutput('');
        }
    }, [input]);

    /**
     * 校验 JSON
     */
    const handleValidate = useCallback(() => {
        if (!input.trim()) {
            setError('请输入 JSON 内容');
            setIsValid(false);
            return;
        }

        try {
            JSON.parse(input);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError(`JSON 语法错误: ${err.message}`);
            setIsValid(false);
        }
    }, [input]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
        setIsValid(null);
    }, []);

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Format',
            icon: <FormatAlignLeftIcon fontSize="small" />,
            onClick: handleFormat,
        },
        {
            label: 'Minify',
            icon: <CompressIcon fontSize="small" />,
            onClick: handleMinify,
        },
        {
            label: 'Validate',
            icon: <CheckCircleIcon fontSize="small" />,
            onClick: handleValidate,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="JSON 格式化"
            description="美化、压缩和校验 JSON 数据，支持语法高亮和实时错误检测"
            actions={actions}
            copyContent={output}
        >
            {/* 错误/成功提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {isValid === true && !error && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    ✓ JSON 语法正确
                </Alert>
            )}

            {/* 双栏编辑器 */}
            <Grid container spacing={2}>
                {/* 输入区域 */}
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
                                输入 JSON
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language="json"
                            placeholder='在此粘贴或输入 JSON，例如：
{
  "name": "DevTools",
  "version": "1.0.0",
  "features": ["format", "minify", "validate"]
}'
                            height="400px"
                        />
                    </Paper>
                </Grid>

                {/* 输出区域 */}
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
                                输出结果
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={output}
                            language="json"
                            placeholder="格式化后的 JSON 将显示在这里..."
                            height="400px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default JsonFormat;
