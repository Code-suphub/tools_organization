import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON 格式化工具
 * 
 * 功能：
 * - 实时 JSON 美化（格式化）
 * - 实时 JSON 压缩（最小化）
 * - 实时语法校验
 */
function JsonFormat() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(null);
    const [mode, setMode] = useState('format'); // 'format' | 'minify'

    /**
     * 实时处理 JSON
     */
    useEffect(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            setIsValid(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const result = mode === 'format'
                ? JSON.stringify(parsed, null, 2)
                : JSON.stringify(parsed);
            setOutput(result);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError(`JSON 语法错误: ${err.message}`);
            setIsValid(false);
            setOutput('');
        }
    }, [input, mode]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

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
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="JSON 格式化"
            description="实时美化、压缩和校验 JSON 数据，支持语法高亮"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="输出模式"
                    size="small"
                >
                    <ToggleButton value="format" aria-label="格式化">
                        <FormatAlignLeftIcon sx={{ mr: 1 }} fontSize="small" />
                        格式化 (Format)
                    </ToggleButton>
                    <ToggleButton value="minify" aria-label="压缩">
                        <CompressIcon sx={{ mr: 1 }} fontSize="small" />
                        压缩 (Minify)
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

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
                                输出结果 ({mode === 'format' ? '格式化' : '压缩'})
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={output}
                            language="json"
                            placeholder="输入 JSON 后将实时显示结果..."
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

