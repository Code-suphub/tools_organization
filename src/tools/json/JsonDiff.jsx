import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, Chip, CircularProgress, Fade, Stack, IconButton, Tooltip, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useDiff } from '../../hooks/useDiff';
import { List } from 'react-window';

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
    const [currentDiffIndex, setCurrentDiffIndex] = useState(-1);
    const listRef = useRef(null);

    // 直接将原始输入传给 Hook，格式化逻辑已移至 Worker 内部
    const { result: diffResult, diffIndices, loading, duration, stats } = useDiff(leftInput, rightInput, 'lines', { wrapJson: true });

    // 语法错误检测
    const { leftValid, rightValid, error } = useMemo(() => {
        let lv = true, rv = true, err = null;
        if (leftInput.trim()) {
            try { JSON.parse(leftInput); } catch (e) { lv = false; err = `左侧 JSON 错误: ${e.message}`; }
        }
        if (rightInput.trim()) {
            try { JSON.parse(rightInput); } catch (e) { rv = false; err = err ? '左右两侧 JSON 都有语法错误' : `右侧 JSON 错误: ${e.message}`; }
        }
        return { leftValid: lv, rightValid: rv, error: err };
    }, [leftInput, rightInput]);

    const handleFormat = useCallback(() => {
        if (leftInput.trim()) {
            try { setLeftInput(JSON.stringify(JSON.parse(leftInput), null, 4)); } catch (e) { }
        }
        if (rightInput.trim()) {
            try { setRightInput(JSON.stringify(JSON.parse(rightInput), null, 4)); } catch (e) { }
        }
    }, [leftInput, rightInput, setLeftInput, setRightInput]);

    const handleNextDiff = useCallback(() => {
        if (!diffIndices || diffIndices.length === 0) return;
        const nextIdx = (currentDiffIndex + 1) % diffIndices.length;
        setCurrentDiffIndex(nextIdx);
        listRef.current?.scrollToItem(diffIndices[nextIdx], 'center');
    }, [diffIndices, currentDiffIndex]);

    const handlePrevDiff = useCallback(() => {
        if (!diffIndices || diffIndices.length === 0) return;
        const prevIdx = (currentDiffIndex - 1 + diffIndices.length) % diffIndices.length;
        setCurrentDiffIndex(prevIdx);
        listRef.current?.scrollToItem(diffIndices[prevIdx], 'center');
    }, [diffIndices, currentDiffIndex]);

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
    // 提取 Row 组件外部以便 List 调用
    // 注意：在 react-window v2.x 中，rowProps 的内容会被平铺到 props 中
    const Row = useCallback(({ index, style, diffResult, diffIndices, currentDiffIndex, theme }) => {
        const part = diffResult ? diffResult[index] : null;
        if (!part) return null;

        let backgroundColor = 'transparent';
        let color = theme.palette.text.primary;
        let prefix = '  ';

        if (part.type === 'added') {
            backgroundColor = theme.palette.mode === 'dark'
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(34, 197, 94, 0.15)';
            color = theme.palette.mode === 'dark' ? '#86efac' : '#15803d';
            prefix = '+ ';
        } else if (part.type === 'removed') {
            backgroundColor = theme.palette.mode === 'dark'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(239, 68, 68, 0.15)';
            color = theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626';
            prefix = '- ';
        }

        const isCurrent = diffIndices && diffIndices[currentDiffIndex] === index;

        return (
            <Box
                style={style}
                sx={{
                    backgroundColor,
                    color,
                    px: 1,
                    display: 'flex',
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '13px',
                    lineHeight: '25px',
                    whiteSpace: 'pre',
                    borderLeft: isCurrent ? `4px solid ${theme.palette.primary.main}` : 'none',
                    overflow: 'hidden',
                }}
            >
                <Box component="span" sx={{ opacity: 0.5, mr: 1, userSelect: 'none', width: '20px' }}>{prefix}</Box>
                <Box component="span">{part.content}</Box>
            </Box>
        );
    }, []);

    const renderDiffResult = () => {
        if (!diffResult) return null;

        return (
            <Box sx={{ position: 'relative', height: 600 }}>
                <List
                    listRef={listRef}
                    height={600}
                    rowCount={diffResult ? diffResult.length : 0}
                    rowHeight={25}
                    rowComponent={Row}
                    rowProps={{ diffResult, diffIndices, currentDiffIndex, theme }}
                    width="100%"
                />

                {/* 加载遮罩 */}
                <Fade in={loading}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(2px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                        }}
                    >
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">对比中...</Typography>
                    </Box>
                </Fade>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={500} color="text.secondary">
                                    对比结果
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AutoFixHighIcon />}
                                    onClick={handleFormat}
                                    sx={{ ml: 2, py: 0 }}
                                >
                                    格式化输入
                                </Button>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {diffIndices.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, px: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {currentDiffIndex + 1}/{diffIndices.length}
                                        </Typography>
                                        <IconButton size="small" onClick={handlePrevDiff}><KeyboardArrowUpIcon fontSize="inherit" /></IconButton>
                                        <IconButton size="small" onClick={handleNextDiff}><KeyboardArrowDownIcon fontSize="inherit" /></IconButton>
                                    </Box>
                                )}
                                {duration > 0 && <Chip label={`${duration}ms`} size="small" variant="outlined" />}
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
                            </Stack>
                        </Box>
                        <Box
                            sx={{
                                px: 0,
                                flex: 1,
                                overflow: 'hidden',
                                minHeight: 600,
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
