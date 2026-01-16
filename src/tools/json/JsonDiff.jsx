import React, { useState, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, Chip } from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { diffLines } from 'diff';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON 对比工具
 * 
 * 功能：
 * - 比较两个 JSON 的差异
 * - 高亮显示添加/删除的内容
 * - 统计变更信息
 */
function JsonDiff() {
    const theme = useTheme();

    // 状态管理
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');
    const [diffResult, setDiffResult] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

    /**
     * 执行 JSON 对比
     */
    const handleCompare = useCallback(() => {
        // 校验输入
        if (!leftInput.trim() || !rightInput.trim()) {
            setError('请在左右两侧都输入 JSON 内容');
            return;
        }

        try {
            // 解析并格式化 JSON（确保格式一致再比较）
            const leftParsed = JSON.parse(leftInput);
            const rightParsed = JSON.parse(rightInput);
            const leftFormatted = JSON.stringify(leftParsed, null, 2);
            const rightFormatted = JSON.stringify(rightParsed, null, 2);

            // 执行 diff
            const diff = diffLines(leftFormatted, rightFormatted);

            // 统计变更
            let added = 0, removed = 0, unchanged = 0;
            diff.forEach(part => {
                const lines = part.value.split('\n').filter(l => l).length;
                if (part.added) {
                    added += lines;
                } else if (part.removed) {
                    removed += lines;
                } else {
                    unchanged += lines;
                }
            });

            setDiffResult(diff);
            setStats({ added, removed, unchanged });
            setError(null);
        } catch (err) {
            setError(`JSON 语法错误: ${err.message}`);
            setDiffResult(null);
        }
    }, [leftInput, rightInput]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setLeftInput('');
        setRightInput('');
        setDiffResult(null);
        setError(null);
        setStats({ added: 0, removed: 0, unchanged: 0 });
    }, []);

    // 工具栏按钮配置
    const actions = [
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
                                line ? (
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

    return (
        <ToolCard
            title="JSON 对比"
            description="比较两个 JSON 结构的差异，高亮显示添加、删除和修改的内容"
            actions={actions}
        >
            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 双栏输入 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* 左侧 JSON */}
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
                                原始 JSON (左侧)
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={leftInput}
                            onChange={setLeftInput}
                            language="json"
                            placeholder='输入原始 JSON...'
                            height="300px"
                        />
                    </Paper>
                </Grid>

                {/* 右侧 JSON */}
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
                                修改后 JSON (右侧)
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={rightInput}
                            onChange={setRightInput}
                            language="json"
                            placeholder='输入修改后的 JSON...'
                            height="300px"
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
                            对比结果
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
                            <Chip
                                label={`${stats.unchanged} 未变`}
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: theme.palette.divider }}
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

export default JsonDiff;
