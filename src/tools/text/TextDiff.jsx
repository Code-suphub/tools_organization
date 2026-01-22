import React, { useState, useMemo, useCallback } from 'react';
import { Box, Grid, Paper, Typography, TextField, useTheme, Chip, ToggleButtonGroup, ToggleButton, Button, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';
import AbcIcon from '@mui/icons-material/Abc';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import { diffLines, diffWords, diffChars } from 'diff';

import ToolCard from '../../components/ToolCard';

/**
 * 文本对比工具
 *
 * 功能：
 * - 实时逐行对比
 * - 实时逐词对比
 * - 实时逐字符对比
 * - 高亮显示差异
 * - 统计新增/删除数量
 */
function TextDiff() {
    const theme = useTheme();

    // 状态管理
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');
    const [diffMode, setDiffMode] = useState('chars'); // lines | words | chars
    const [sortLines, setSortLines] = useState(false);

    /**
     * 获取 diff 函数
     */
    const getDiffFn = (mode) => {
        switch (mode) {
            case 'words': return diffWords;
            case 'chars': return diffChars;
            default: return diffLines;
        }
    };

    /**
     * 实时计算对比结果（使用 useMemo 优化性能）
     */
    const { diffResult, stats } = useMemo(() => {
        // 如果两边都为空，则不显示结果
        if (!leftInput && !rightInput) {
            return { diffResult: null, stats: { added: 0, removed: 0, unchanged: 0 } };
        }

        const diffFn = getDiffFn(diffMode);

        let l = leftInput;
        let r = rightInput;

        if (sortLines) {
            l = l.split('\n').sort().join('\n');
            r = r.split('\n').sort().join('\n');
        }

        const diff = diffFn(l, r);

        // 统计变更
        let added = 0, removed = 0, unchanged = 0;
        diff.forEach(part => {
            const count = diffMode === 'lines'
                ? part.value.split('\n').filter(l => l).length
                : part.value.length;

            if (part.added) {
                added += count;
            } else if (part.removed) {
                removed += count;
            } else {
                unchanged += count;
            }
        });

        return { diffResult: diff, stats: { added, removed, unchanged } };
    }, [leftInput, rightInput, diffMode, sortLines]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setLeftInput('');
        setRightInput('');
    }, []);

    /**
     * 交换左右文本
     */
    const handleSwap = useCallback(() => {
        setLeftInput(rightInput);
        setRightInput(leftInput);
    }, [leftInput, rightInput]);

    /**
     * 切换对比模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setDiffMode(newMode);
        }
    };

    /**
     * 对输入框内容进行排序
     */
    /**
     * 对输入框内容进行排序并去除首尾空格
     */
    const handleSortInput = useCallback(() => {
        if (leftInput) {
            setLeftInput(leftInput.split('\n').map(l => l.trim()).sort().join('\n'));
        }
        if (rightInput) {
            setRightInput(rightInput.split('\n').map(l => l.trim()).sort().join('\n'));
        }
    }, [leftInput, rightInput]);

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Swap',
            icon: <SwapHorizIcon fontSize="small" />,
            onClick: handleSwap,
            disabled: !leftInput && !rightInput,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    /**
     * 渲染 Diff 结果 - 实时更新
     */
    const renderDiffResult = () => {
        if (!diffResult) return null;

        return (
            <Box
                sx={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '13px',
                    lineHeight: diffMode === 'lines' ? 1.6 : 1.8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {diffResult.map((part, index) => {
                    let backgroundColor = 'transparent';
                    let color = theme.palette.text.primary;
                    let textDecoration = 'none';

                    if (part.added) {
                        backgroundColor = theme.palette.mode === 'dark'
                            ? 'rgba(34, 197, 94, 0.25)'
                            : 'rgba(34, 197, 94, 0.2)';
                        color = theme.palette.mode === 'dark' ? '#86efac' : '#15803d';
                    } else if (part.removed) {
                        backgroundColor = theme.palette.mode === 'dark'
                            ? 'rgba(239, 68, 68, 0.25)'
                            : 'rgba(239, 68, 68, 0.2)';
                        color = theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626';
                        textDecoration = 'line-through';
                    }

                    return (
                        <Box
                            key={index}
                            component="span"
                            sx={{
                                display: diffMode === 'lines' ? 'block' : 'inline',
                                backgroundColor,
                                color,
                                textDecoration,
                                px: diffMode === 'lines' ? 1 : 0,
                                borderRadius: diffMode === 'lines' ? 0 : '2px',
                            }}
                        >
                            {part.value}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    /**
     * 判断是否有差异
     */
    const hasDiff = diffResult && (stats.added > 0 || stats.removed > 0);
    const isIdentical = diffResult && stats.added === 0 && stats.removed === 0 && (leftInput || rightInput);

    return (
        <ToolCard
            title="文本对比"
            description="实时比较两段文本的差异，支持逐行、逐词和逐字符对比，高亮显示变更内容"
            actions={actions}
        >
            {/* 对比模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, gap: 2 }}>
                <ToggleButtonGroup
                    value={diffMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="对比模式"
                >
                    <ToggleButton value="lines" aria-label="逐行">
                        <TextFieldsIcon sx={{ mr: 1 }} fontSize="small" />
                        逐行
                    </ToggleButton>
                    <ToggleButton value="words" aria-label="逐词">
                        <SpaceBarIcon sx={{ mr: 1 }} fontSize="small" />
                        逐词
                    </ToggleButton>
                    <ToggleButton value="chars" aria-label="逐字符">
                        <AbcIcon sx={{ mr: 1 }} fontSize="small" />
                        逐字符
                    </ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ display: 'flex', border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    <ToggleButton
                        value="sort"
                        selected={sortLines}
                        onChange={() => setSortLines(!sortLines)}
                        color="primary"
                        sx={{ border: 'none', borderRadius: '4px 0 0 4px' }}
                        title="排序后对比（忽略行顺序）"
                    >
                        <SortByAlphaIcon sx={{ mr: 1 }} fontSize="small" />
                        排序对比
                    </ToggleButton>
                    <Tooltip title="去除空格并重排输入框文本">
                        <Button
                            onClick={handleSortInput}
                            disabled={!leftInput && !rightInput}
                            sx={{
                                borderLeft: `1px solid ${theme.palette.divider}`,
                                borderRadius: '0 4px 4px 0',
                                color: 'text.secondary',
                                px: 2,
                                minWidth: 'auto'
                            }}
                        >
                            重排输入
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            {/* 三栏布局：左边输入 | 中间结果 | 右边输入 */}
            <Grid container spacing={2}>
                {/* 左侧文本输入 */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(239, 68, 68, 0.05)',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                原始文本
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={15}
                            value={leftInput}
                            onChange={(e) => setLeftInput(e.target.value)}
                            placeholder="输入原始文本..."
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

                {/* 中间对比结果 - 实时显示 */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(99, 102, 241, 0.1)'
                                    : 'rgba(99, 102, 241, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                对比结果
                            </Typography>
                            {hasDiff && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Chip
                                        label={`-${stats.removed}`}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: 11,
                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                            color: theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626',
                                        }}
                                    />
                                    <Chip
                                        label={`+${stats.added}`}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: 11,
                                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                            color: theme.palette.mode === 'dark' ? '#86efac' : '#15803d',
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                flex: 1,
                                overflow: 'auto',
                                minHeight: 300,
                            }}
                        >
                            {!leftInput && !rightInput ? (
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    sx={{ fontStyle: 'italic', textAlign: 'center', mt: 8 }}
                                >
                                    在左右两侧输入文本，<br />对比结果将实时显示
                                </Typography>
                            ) : isIdentical ? (
                                <Box sx={{ textAlign: 'center', mt: 8 }}>
                                    <Chip
                                        label="✓ 两段文本完全相同"
                                        color="success"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>
                            ) : (
                                renderDiffResult()
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* 右侧文本输入 */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : 'rgba(34, 197, 94, 0.05)',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                修改后文本
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={15}
                            value={rightInput}
                            onChange={(e) => setRightInput(e.target.value)}
                            placeholder="输入修改后的文本..."
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
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    在左右两侧输入或粘贴文本，对比结果会<strong>实时显示</strong>在中间区域。
                    <Box component="span" sx={{ color: theme.palette.error.main, mx: 0.5, textDecoration: 'line-through' }}>删除的内容</Box>
                    用红色删除线标记，
                    <Box component="span" sx={{ color: theme.palette.success.main, mx: 0.5 }}>新增的内容</Box>
                    用绿色标记。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default TextDiff;
