import React, { useState, useCallback } from 'react';
import { Box, Grid, Paper, Typography, TextField, useTheme, Alert, Chip } from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { diffLines, diffWords, diffChars } from 'diff';

import ToolCard from '../../components/ToolCard';

/**
 * 文本对比工具
 * 
 * 功能：
 * - 逐行对比
 * - 逐词对比
 * - 逐字符对比
 * - 高亮显示差异
 */
function TextDiff() {
    const theme = useTheme();

    // 状态管理
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');
    const [diffResult, setDiffResult] = useState(null);
    const [diffMode, setDiffMode] = useState('lines'); // lines | words | chars
    const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

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
     * 执行文本对比
     */
    const handleCompare = useCallback(() => {
        if (!leftInput && !rightInput) {
            setDiffResult(null);
            return;
        }

        const diffFn = getDiffFn(diffMode);
        const diff = diffFn(leftInput, rightInput);

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

        setDiffResult(diff);
        setStats({ added, removed, unchanged });
    }, [leftInput, rightInput, diffMode]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setLeftInput('');
        setRightInput('');
        setDiffResult(null);
        setStats({ added: 0, removed: 0, unchanged: 0 });
    }, []);

    /**
     * 切换对比模式
     */
    const handleModeChange = (mode) => {
        setDiffMode(mode);
        // 如果已有结果，重新计算
        if (leftInput || rightInput) {
            const diffFn = getDiffFn(mode);
            const diff = diffFn(leftInput, rightInput);
            setDiffResult(diff);
        }
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: '逐行',
            onClick: () => handleModeChange('lines'),
            variant: diffMode === 'lines' ? 'contained' : 'outlined',
            color: diffMode === 'lines' ? 'primary' : 'inherit',
        },
        {
            label: '逐词',
            onClick: () => handleModeChange('words'),
            variant: diffMode === 'words' ? 'contained' : 'outlined',
            color: diffMode === 'words' ? 'primary' : 'inherit',
        },
        {
            label: '逐字符',
            onClick: () => handleModeChange('chars'),
            variant: diffMode === 'chars' ? 'contained' : 'outlined',
            color: diffMode === 'chars' ? 'primary' : 'inherit',
        },
        {
            label: 'Compare',
            icon: <CompareIcon fontSize="small" />,
            onClick: handleCompare,
            variant: 'contained',
            color: 'primary',
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    /**
     * 渲染 Diff 结果
     */
    const renderDiffResult = () => {
        if (!diffResult) return null;

        return (
            <Box
                sx={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '13px',
                    lineHeight: diffMode === 'lines' ? 1.6 : 1.8,
                    whiteSpace: diffMode === 'lines' ? 'pre-wrap' : 'pre-wrap',
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

    return (
        <ToolCard
            title="文本对比"
            description="比较两段文本的差异，支持逐行、逐词和逐字符对比，高亮显示变更内容"
            actions={actions}
        >
            {/* 双栏输入 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* 左侧文本 */}
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
                                原始文本 (左侧)
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
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
                                },
                            }}
                        />
                    </Paper>
                </Grid>

                {/* 右侧文本 */}
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
                                修改后文本 (右侧)
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
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
                                },
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 对比结果 */}
            {diffResult && (
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
                            py: 1.5,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                            对比结果 ({diffMode === 'lines' ? '逐行' : diffMode === 'words' ? '逐词' : '逐字符'})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label={`+${stats.added} 新增`}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    color: theme.palette.mode === 'dark' ? '#86efac' : '#15803d',
                                }}
                            />
                            <Chip
                                label={`-${stats.removed} 删除`}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626',
                                }}
                            />
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            p: 2,
                            maxHeight: 400,
                            overflow: 'auto',
                        }}
                    >
                        {renderDiffResult()}
                    </Box>
                </Paper>
            )}
        </ToolCard>
    );
}

export default TextDiff;
