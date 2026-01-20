import React, { useState, useMemo, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, Chip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { diffLines } from 'diff';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON 对比工具
 *
 * 功能：
 * - 实时比较两个 JSON 的差异
 * - 高亮显示添加/删除的内容
 * - 统计变更信息
 */
function JsonDiff() {
    const theme = useTheme();

    // 状态管理
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');

    /**
     * 实时计算 JSON 对比结果（使用 useMemo 优化性能）
     */
    const { diffResult, stats, error, leftValid, rightValid } = useMemo(() => {
        // 如果两边都为空，不显示结果
        if (!leftInput.trim() && !rightInput.trim()) {
            return {
                diffResult: null,
                stats: { added: 0, removed: 0, unchanged: 0 },
                error: null,
                leftValid: true,
                rightValid: true,
            };
        }

        // 尝试解析 JSON
        let leftParsed, rightParsed;
        let leftValid = true, rightValid = true;
        let parseError = null;

        // 解析左侧（如果有内容）
        if (leftInput.trim()) {
            try {
                leftParsed = JSON.parse(leftInput);
            } catch (e) {
                leftValid = false;
                parseError = `左侧 JSON 语法错误: ${e.message}`;
            }
        } else {
            leftParsed = {};
        }

        // 解析右侧（如果有内容）
        if (rightInput.trim()) {
            try {
                rightParsed = JSON.parse(rightInput);
            } catch (e) {
                rightValid = false;
                if (parseError) {
                    parseError = '左右两侧 JSON 都有语法错误';
                } else {
                    parseError = `右侧 JSON 语法错误: ${e.message}`;
                }
            }
        } else {
            rightParsed = {};
        }

        // 如果解析失败，返回错误
        if (!leftValid || !rightValid) {
            return {
                diffResult: null,
                stats: { added: 0, removed: 0, unchanged: 0 },
                error: parseError,
                leftValid,
                rightValid,
            };
        }

        // 格式化 JSON 确保格式一致
        const leftFormatted = JSON.stringify(leftParsed, null, 2);
        const rightFormatted = JSON.stringify(rightParsed, null, 2);

        // 执行 diff
        const diff = diffLines(leftFormatted, rightFormatted);

        // 统计变更
        let added = 0, removed = 0, unchanged = 0;
        diff.forEach(part => {
            const lines = part.value.split('\n').filter(l => l.trim()).length;
            if (part.added) {
                added += lines;
            } else if (part.removed) {
                removed += lines;
            } else {
                unchanged += lines;
            }
        });

        return {
            diffResult: diff,
            stats: { added, removed, unchanged },
            error: null,
            leftValid: true,
            rightValid: true,
        };
    }, [leftInput, rightInput]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setLeftInput('');
        setRightInput('');
    }, []);

    /**
     * 交换左右内容
     */
    const handleSwap = useCallback(() => {
        setLeftInput(rightInput);
        setRightInput(leftInput);
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
     * 渲染 Diff 结果
     */
    const renderDiffResult = () => {
        if (!diffResult) return null;

        return (
            <Box
                sx={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {diffResult.map((part, index) => {
                    let backgroundColor = 'transparent';
                    let color = theme.palette.text.primary;
                    let prefix = '  ';

                    if (part.added) {
                        backgroundColor = theme.palette.mode === 'dark'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(34, 197, 94, 0.15)';
                        color = theme.palette.mode === 'dark' ? '#86efac' : '#15803d';
                        prefix = '+ ';
                    } else if (part.removed) {
                        backgroundColor = theme.palette.mode === 'dark'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(239, 68, 68, 0.15)';
                        color = theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626';
                        prefix = '- ';
                    }

                    return (
                        <Box
                            key={index}
                            component="span"
                            sx={{
                                display: 'block',
                                backgroundColor,
                                color,
                                px: 1,
                            }}
                        >
                            {part.value.split('\n').map((line, lineIndex) =>
                                line.trim() ? (
                                    <Box key={lineIndex}>
                                        {prefix}{line}
                                    </Box>
                                ) : null
                            )}
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
    const isIdentical = diffResult && stats.added === 0 && stats.removed === 0 && (leftInput.trim() || rightInput.trim());

    return (
        <ToolCard
            title="JSON 对比"
            description="实时比较两个 JSON 结构的差异，高亮显示添加、删除和修改的内容"
            actions={actions}
        >
            {/* 三栏布局：左输入 | 中间结果 | 右输入 */}
            <Grid container spacing={2}>
                {/* 左侧 JSON 输入 */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${!leftValid ? theme.palette.error.main : theme.palette.divider}`,
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
                                原始 JSON
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={leftInput}
                            onChange={setLeftInput}
                            language="json"
                            placeholder='输入原始 JSON...'
                            height="400px"
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
                                minHeight: 370,
                            }}
                        >
                            {/* 错误提示 */}
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            {/* 空状态提示 */}
                            {!leftInput.trim() && !rightInput.trim() ? (
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    sx={{ fontStyle: 'italic', textAlign: 'center', mt: 10 }}
                                >
                                    在左右两侧输入 JSON，<br />对比结果将实时显示
                                </Typography>
                            ) : isIdentical ? (
                                <Box sx={{ textAlign: 'center', mt: 10 }}>
                                    <Chip
                                        label="✓ 两个 JSON 完全相同"
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

                {/* 右侧 JSON 输入 */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${!rightValid ? theme.palette.error.main : theme.palette.divider}`,
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
                                修改后 JSON
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={rightInput}
                            onChange={setRightInput}
                            language="json"
                            placeholder='输入修改后的 JSON...'
                            height="400px"
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    在左右两侧输入 JSON，对比结果会<strong>实时显示</strong>在中间区域。
                    <Box component="span" sx={{ color: theme.palette.error.main, mx: 0.5 }}>- 红色</Box>
                    表示删除的内容，
                    <Box component="span" sx={{ color: theme.palette.success.main, mx: 0.5 }}>+ 绿色</Box>
                    表示新增的内容。JSON 会自动格式化后再进行对比。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default JsonDiff;
