import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import yaml from 'js-yaml';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON ↔ YAML 转换工具
 * 
 * 功能：
 * - 实时 JSON 转 YAML
 * - 实时 YAML 转 JSON
 * - 一键交换输入输出
 * - 语法高亮显示
 */
function JsonYaml() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('json2yaml'); // 'json2yaml' | 'yaml2json'
    const [copied, setCopied] = useState(false);

    /**
     * 实时转换
     */
    useEffect(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            if (mode === 'json2yaml') {
                // JSON → YAML
                const parsed = JSON.parse(input);
                const result = yaml.dump(parsed, {
                    indent: 2,
                    lineWidth: -1, // 不自动换行
                    noRefs: true, // 不使用引用
                    sortKeys: false, // 保持原始顺序
                });
                setOutput(result);
                setError(null);
            } else {
                // YAML → JSON
                const parsed = yaml.load(input);
                const result = JSON.stringify(parsed, null, 2);
                setOutput(result);
                setError(null);
            }
        } catch (err) {
            const errorType = mode === 'json2yaml' ? 'JSON' : 'YAML';
            setError(`${errorType} 语法错误: ${err.message}`);
            setOutput('');
        }
    }, [input, mode]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            // 切换模式时，清空内容以避免混淆
            setInput('');
            setOutput('');
            setError(null);
        }
    };

    /**
     * 交换输入和输出
     * 将输出内容设置为输入，并切换转换方向
     */
    const handleSwap = useCallback(() => {
        if (!output.trim()) return;

        setInput(output);
        setMode(prevMode => prevMode === 'json2yaml' ? 'yaml2json' : 'json2yaml');
    }, [output]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
    }, []);

    /**
     * 复制输出内容
     */
    const handleCopy = useCallback(async () => {
        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }, [output]);

    // 获取输入和输出的语言类型
    const inputLanguage = mode === 'json2yaml' ? 'json' : 'yaml';
    const outputLanguage = mode === 'json2yaml' ? 'yaml' : 'json';

    // 输入占位符
    const inputPlaceholder = mode === 'json2yaml'
        ? `在此粘贴或输入 JSON，例如：
{
  "name": "DevTools",
  "version": "1.0.0",
  "features": ["format", "convert", "validate"]
}`
        : `在此粘贴或输入 YAML，例如：
name: DevTools
version: 1.0.0
features:
  - format
  - convert
  - validate`;

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
            title="JSON ↔ YAML"
            description="JSON 与 YAML 格式实时互转，支持语法高亮"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="转换模式"
                    size="small"
                >
                    <ToggleButton value="json2yaml" aria-label="JSON 转 YAML">
                        JSON → YAML
                    </ToggleButton>
                    <ToggleButton value="yaml2json" aria-label="YAML 转 JSON">
                        YAML → JSON
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* 交换按钮 */}
                <Tooltip title="交换输入输出">
                    <IconButton
                        onClick={handleSwap}
                        disabled={!output.trim()}
                        size="small"
                        sx={{
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'rgba(0,0,0,0.08)',
                            },
                        }}
                    >
                        <SwapHorizIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输入 ({inputLanguage.toUpperCase()})
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language={inputLanguage}
                            placeholder={inputPlaceholder}
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输出 ({outputLanguage.toUpperCase()})
                            </Typography>
                            <Tooltip title={copied ? '已复制!' : '复制'}>
                                <IconButton
                                    onClick={handleCopy}
                                    disabled={!output}
                                    size="small"
                                    color={copied ? 'success' : 'default'}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <CodeEditor
                            value={output}
                            language={outputLanguage}
                            placeholder={`输入 ${inputLanguage.toUpperCase()} 后将实时显示 ${outputLanguage.toUpperCase()} 结果...`}
                            height="400px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 功能说明 */}
            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    💡 使用提示
                </Typography>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2, m: 0 }}>
                    <li>JSON → YAML：将 JSON 数据转换为 YAML 格式，便于配置文件编写</li>
                    <li>YAML → JSON：将 YAML 配置转换为 JSON 格式，便于程序处理</li>
                    <li>点击 <SwapHorizIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> 可快速交换输入输出内容</li>
                    <li>支持实时转换，输入内容后自动显示转换结果</li>
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default JsonYaml;
