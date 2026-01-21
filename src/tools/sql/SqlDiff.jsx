import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    Chip,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Collapse,
    IconButton,
    Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';
import AbcIcon from '@mui/icons-material/Abc';
import SettingsIcon from '@mui/icons-material/Settings';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import { diffLines, diffWords, diffChars } from 'diff';
import { format } from 'sql-formatter';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * SQL 方言选项
 */
const SQL_DIALECTS = [
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sql', label: 'SQL 标准' },
    { value: 'mariadb', label: 'MariaDB' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'spark', label: 'Spark SQL' },
    { value: 'transactsql', label: 'SQL Server' },
    { value: 'plsql', label: 'Oracle PL/SQL' },
];

/**
 * 移除 SQL 注释
 * @param {string} sql - SQL 语句
 * @returns {string} 移除注释后的 SQL
 */
const removeComments = (sql) => {
    // 移除单行注释 (-- 或 #)
    let result = sql.replace(/--.*$/gm, '');
    result = result.replace(/#.*$/gm, '');
    // 移除多行注释 (/* */)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    return result;
};

/**
 * SQL 对比工具
 *
 * 功能：
 * - 实时逐行/逐词/逐字符对比
 * - 格式化后对比（消除格式干扰）
 * - 忽略大小写、空白、注释
 * - SQL 语法高亮
 * - 高亮显示差异
 * - 统计新增/删除数量
 */
function SqlDiff() {
    const theme = useTheme();

    // 输入状态
    const [leftSql, setLeftSql] = useState('');
    const [rightSql, setRightSql] = useState('');

    // 对比模式
    const [diffMode, setDiffMode] = useState('lines'); // lines | words | chars

    // 配置选项
    const [showSettings, setShowSettings] = useState(false);
    const [formatBeforeDiff, setFormatBeforeDiff] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [ignoreComments, setIgnoreComments] = useState(false);
    const [sqlDialect, setSqlDialect] = useState('mysql');

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
     * 预处理 SQL
     * @param {string} sql - 原始 SQL
     * @returns {string} 预处理后的 SQL
     */
    const preprocessSql = useCallback((sql) => {
        let result = sql;

        // 移除注释
        if (ignoreComments) {
            result = removeComments(result);
        }

        // 格式化 SQL
        if (formatBeforeDiff) {
            try {
                result = format(result, {
                    language: sqlDialect,
                    tabWidth: 2,
                    keywordCase: 'upper',
                });
            } catch {
                // 格式化失败时保持原样
            }
        }

        // 忽略大小写
        if (ignoreCase) {
            result = result.toLowerCase();
        }

        // 忽略空白（将多个空白字符替换为单个空格）
        if (ignoreWhitespace) {
            result = result.replace(/\s+/g, ' ').trim();
        }

        return result;
    }, [formatBeforeDiff, ignoreCase, ignoreWhitespace, ignoreComments, sqlDialect]);

    /**
     * 实时计算对比结果
     */
    const { diffResult, stats } = useMemo(() => {
        if (!leftSql && !rightSql) {
            return { diffResult: null, stats: { added: 0, removed: 0, unchanged: 0 } };
        }

        const processedLeft = preprocessSql(leftSql);
        const processedRight = preprocessSql(rightSql);

        const diffFn = getDiffFn(diffMode);
        const diff = diffFn(processedLeft, processedRight);

        // 统计变更
        let added = 0, removed = 0, unchanged = 0;
        diff.forEach(part => {
            const count = diffMode === 'lines'
                ? part.value.split('\n').filter(l => l.trim()).length
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
    }, [leftSql, rightSql, diffMode, preprocessSql]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setLeftSql('');
        setRightSql('');
    }, []);

    /**
     * 交换左右 SQL
     */
    const handleSwap = useCallback(() => {
        setLeftSql(rightSql);
        setRightSql(leftSql);
    }, [leftSql, rightSql]);

    /**
     * 切换对比模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setDiffMode(newMode);
        }
    };

    /**
     * 格式化左侧 SQL
     */
    const handleFormatLeft = useCallback(() => {
        try {
            const formatted = format(leftSql, {
                language: sqlDialect,
                tabWidth: 2,
                keywordCase: 'upper',
            });
            setLeftSql(formatted);
        } catch {
            // 格式化失败
        }
    }, [leftSql, sqlDialect]);

    /**
     * 格式化右侧 SQL
     */
    const handleFormatRight = useCallback(() => {
        try {
            const formatted = format(rightSql, {
                language: sqlDialect,
                tabWidth: 2,
                keywordCase: 'upper',
            });
            setRightSql(formatted);
        } catch {
            // 格式化失败
        }
    }, [rightSql, sqlDialect]);

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Swap',
            icon: <SwapHorizIcon fontSize="small" />,
            onClick: handleSwap,
            disabled: !leftSql && !rightSql,
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

    // 判断是否有差异
    const hasDiff = diffResult && (stats.added > 0 || stats.removed > 0);
    const isIdentical = diffResult && stats.added === 0 && stats.removed === 0 && (leftSql || rightSql);

    // 获取统计单位
    const getUnit = () => {
        switch (diffMode) {
            case 'lines': return '行';
            case 'words': return '词';
            default: return '字符';
        }
    };

    return (
        <ToolCard
            title="SQL 对比"
            description="比较两个 SQL 脚本的差异，支持格式化对比、忽略大小写/空白/注释"
            actions={actions}
        >
            {/* 对比模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                <ToggleButtonGroup
                    value={diffMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="对比模式"
                    size="small"
                >
                    <ToggleButton value="lines" aria-label="逐行">
                        <TextFieldsIcon sx={{ mr: 0.5 }} fontSize="small" />
                        逐行
                    </ToggleButton>
                    <ToggleButton value="words" aria-label="逐词">
                        <SpaceBarIcon sx={{ mr: 0.5 }} fontSize="small" />
                        逐词
                    </ToggleButton>
                    <ToggleButton value="chars" aria-label="逐字符">
                        <AbcIcon sx={{ mr: 0.5 }} fontSize="small" />
                        逐字符
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* 设置按钮 */}
                <Tooltip title="对比选项">
                    <IconButton
                        onClick={() => setShowSettings(!showSettings)}
                        size="small"
                        color={showSettings ? 'primary' : 'default'}
                        sx={{
                            backgroundColor: showSettings
                                ? (theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')
                                : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                        }}
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* 配置选项面板 */}
            <Collapse in={showSettings}>
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
                        {/* SQL 方言选择 */}
                        <Grid item xs={12} sm={4}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>SQL 方言</InputLabel>
                                <Select
                                    value={sqlDialect}
                                    label="SQL 方言"
                                    onChange={(e) => setSqlDialect(e.target.value)}
                                >
                                    {SQL_DIALECTS.map(dialect => (
                                        <MenuItem key={dialect.value} value={dialect.value}>
                                            {dialect.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 格式化后对比 */}
                        <Grid item xs={6} sm={4}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formatBeforeDiff}
                                        onChange={(e) => setFormatBeforeDiff(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">格式化后对比</Typography>}
                            />
                        </Grid>

                        {/* 忽略大小写 */}
                        <Grid item xs={6} sm={4}>
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

                        {/* 忽略空白 */}
                        <Grid item xs={6} sm={4}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={ignoreWhitespace}
                                        onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">忽略空白</Typography>}
                            />
                        </Grid>

                        {/* 忽略注释 */}
                        <Grid item xs={6} sm={4}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={ignoreComments}
                                        onChange={(e) => setIgnoreComments(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">忽略注释</Typography>}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {/* 三栏布局 */}
            <Grid container spacing={2}>
                {/* 左侧 SQL 输入 */}
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                原始 SQL
                            </Typography>
                            <Tooltip title="格式化">
                                <IconButton size="small" onClick={handleFormatLeft} disabled={!leftSql}>
                                    <FormatAlignLeftIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <CodeEditor
                            value={leftSql}
                            onChange={setLeftSql}
                            language="sql"
                            placeholder="输入原始 SQL 语句..."
                            height="350px"
                        />
                    </Paper>
                </Grid>

                {/* 中间对比结果 */}
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
                                        label={`-${stats.removed} ${getUnit()}`}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: 11,
                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                            color: theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626',
                                        }}
                                    />
                                    <Chip
                                        label={`+${stats.added} ${getUnit()}`}
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
                            {!leftSql && !rightSql ? (
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    sx={{ fontStyle: 'italic', textAlign: 'center', mt: 8 }}
                                >
                                    在左右两侧输入 SQL，<br />对比结果将实时显示
                                </Typography>
                            ) : isIdentical ? (
                                <Box sx={{ textAlign: 'center', mt: 8 }}>
                                    <Chip
                                        label="✓ 两段 SQL 完全相同"
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

                {/* 右侧 SQL 输入 */}
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                修改后 SQL
                            </Typography>
                            <Tooltip title="格式化">
                                <IconButton size="small" onClick={handleFormatRight} disabled={!rightSql}>
                                    <FormatAlignLeftIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <CodeEditor
                            value={rightSql}
                            onChange={setRightSql}
                            language="sql"
                            placeholder="输入修改后的 SQL 语句..."
                            height="350px"
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    点击 <SettingsIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> 按钮展开对比选项。
                    开启"<strong>格式化后对比</strong>"可消除格式差异，只比较 SQL 语义。
                    <Box component="span" sx={{ color: theme.palette.error.main, mx: 0.5, textDecoration: 'line-through' }}>删除的内容</Box>
                    用红色删除线标记，
                    <Box component="span" sx={{ color: theme.palette.success.main, mx: 0.5 }}>新增的内容</Box>
                    用绿色标记。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default SqlDiff;
