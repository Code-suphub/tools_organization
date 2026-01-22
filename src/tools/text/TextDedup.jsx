import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Checkbox,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import ToolCard from '../../components/ToolCard';

/**
 * 排序模式定义
 */
const SORT_MODES = [
    { value: 'none', label: '不排序' },
    { value: 'asc', label: '升序 A→Z' },
    { value: 'desc', label: '降序 Z→A' },
    { value: 'asc-num', label: '数字升序' },
    { value: 'desc-num', label: '数字降序' },
    { value: 'length-asc', label: '长度升序' },
    { value: 'length-desc', label: '长度降序' },
];

/**
 * 自然排序比较函数（支持数字和字母混合）
 */
const naturalCompare = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * 文本去重排序工具
 *
 * 功能：
 * - 按行去重
 * - 多种排序模式
 * - 忽略大小写
 * - 去除空行
 * - 去除首尾空格
 * - 实时统计
 */
function TextDedup() {
    const theme = useTheme();

    // 输入状态
    const [input, setInput] = useState('');

    // 配置选项
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [sortMode, setSortMode] = useState('none');
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [removeEmptyLines, setRemoveEmptyLines] = useState(true);
    const [trimLines, setTrimLines] = useState(true);
    const [customSeparator, setCustomSeparator] = useState('');

    // 复制状态
    const [copied, setCopied] = useState(false);

    /**
     * 处理文本
     */
    const { output, stats } = useMemo(() => {
        if (!input.trim()) {
            return {
                output: '',
                stats: {
                    inputLines: 0,
                    outputLines: 0,
                    duplicatesRemoved: 0
                }
            };
        }

        // 使用换行符或自定义分隔符分割
        const separator = customSeparator || '\n';
        let lines = input.split(separator);
        const inputLines = lines.length;

        // 去除首尾空格
        if (trimLines) {
            lines = lines.map(line => line.trim());
        }

        // 去除空行
        if (removeEmptyLines) {
            lines = lines.filter(line => line.length > 0);
        }

        // 去重
        let duplicatesRemoved = 0;
        if (removeDuplicates) {
            const seen = new Set();
            const uniqueLines = [];

            for (const line of lines) {
                const key = ignoreCase ? line.toLowerCase() : line;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueLines.push(line);
                } else {
                    duplicatesRemoved++;
                }
            }
            lines = uniqueLines;
        }

        // 排序
        if (sortMode !== 'none') {
            const sortFn = (a, b) => {
                let compareA = ignoreCase ? a.toLowerCase() : a;
                let compareB = ignoreCase ? b.toLowerCase() : b;

                switch (sortMode) {
                    case 'asc':
                        return compareA.localeCompare(compareB);
                    case 'desc':
                        return compareB.localeCompare(compareA);
                    case 'asc-num':
                        return naturalCompare(compareA, compareB);
                    case 'desc-num':
                        return naturalCompare(compareB, compareA);
                    case 'length-asc':
                        return a.length - b.length || compareA.localeCompare(compareB);
                    case 'length-desc':
                        return b.length - a.length || compareA.localeCompare(compareB);
                    default:
                        return 0;
                }
            };
            lines.sort(sortFn);
        }

        return {
            output: lines.join('\n'),
            stats: {
                inputLines,
                outputLines: lines.length,
                duplicatesRemoved,
            },
        };
    }, [input, removeDuplicates, sortMode, ignoreCase, removeEmptyLines, trimLines, customSeparator]);

    /**
     * 清空输入
     */
    const handleClear = useCallback(() => {
        setInput('');
    }, []);

    /**
     * 复制输出
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

    /**
     * 切换排序模式
     */
    const handleSortChange = (_, newMode) => {
        if (newMode !== null) {
            setSortMode(newMode);
        }
    };

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
            title="文本去重排序"
            description="按行去除重复内容，支持多种排序方式和自定义选项"
            actions={actions}
            copyContent={output}
        >
            {/* 配置选项区 */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    {/* 去重选项 */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={removeDuplicates}
                                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                                    size="small"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FilterListIcon fontSize="small" />
                                    <Typography variant="body2">去除重复行</Typography>
                                </Box>
                            }
                        />
                    </Grid>

                    {/* 忽略大小写 */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ignoreCase}
                                    onChange={(e) => setIgnoreCase(e.target.checked)}
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">忽略大小写</Typography>}
                        />
                    </Grid>

                    {/* 去除空行 */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={removeEmptyLines}
                                    onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">去除空行</Typography>}
                        />
                    </Grid>

                    {/* 去除首尾空格 */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={trimLines}
                                    onChange={(e) => setTrimLines(e.target.checked)}
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">去除首尾空格</Typography>}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* 排序模式 */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SortIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            排序方式:
                        </Typography>
                    </Box>
                    <ToggleButtonGroup
                        value={sortMode}
                        exclusive
                        onChange={handleSortChange}
                        size="small"
                        sx={{ flexWrap: 'wrap' }}
                    >
                        {SORT_MODES.map(mode => (
                            <ToggleButton
                                key={mode.value}
                                value={mode.value}
                                sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                }}
                            >
                                {mode.label}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                {/* 自定义分隔符（可选） */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        自定义分隔符:
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="默认为换行符"
                        value={customSeparator}
                        onChange={(e) => setCustomSeparator(e.target.value)}
                        sx={{ width: 150 }}
                        inputProps={{ style: { fontSize: '0.875rem' } }}
                    />
                    <Typography variant="caption" color="text.disabled">
                        （留空则按行分隔）
                    </Typography>
                </Box>
            </Paper>

            {/* 统计信息 */}
            {input && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                        size="small"
                        label={`输入: ${stats.inputLines} 行`}
                        sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                    />
                    <Chip
                        size="small"
                        label={`输出: ${stats.outputLines} 行`}
                        color="primary"
                        variant="outlined"
                    />
                    {stats.duplicatesRemoved > 0 && (
                        <Chip
                            size="small"
                            label={`去除重复: ${stats.duplicatesRemoved} 行`}
                            color="success"
                        />
                    )}
                </Box>
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
                                输入文本
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={15}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`每行一个内容，例如：
apple
banana
apple
cherry
banana
date`}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    p: 2,
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                    alignItems: 'flex-start',
                                },
                            }}
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
                                处理结果
                            </Typography>
                            <Tooltip title={copied ? '已复制!' : '复制结果'}>
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
                        <TextField
                            fullWidth
                            multiline
                            rows={15}
                            value={output}
                            placeholder="处理结果将实时显示在这里..."
                            variant="standard"
                            InputProps={{
                                readOnly: true,
                                disableUnderline: true,
                                sx: {
                                    p: 2,
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                    alignItems: 'flex-start',
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.01)'
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
                    💡 <strong>提示：</strong>
                    输入的每一行作为一个条目处理。支持<strong>去重</strong>（移除重复行）、
                    <strong>排序</strong>（字母/数字/长度升降序）、<strong>忽略大小写</strong>、
                    <strong>去除空行</strong>和<strong>首尾空格</strong>。
                    也可以自定义分隔符来处理逗号分隔等格式。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default TextDedup;
