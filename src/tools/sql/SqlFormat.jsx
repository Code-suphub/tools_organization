import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Chip,
    Switch,
    FormControlLabel,
} from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import { format } from 'sql-formatter';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * SQL 方言配置
 */
const SQL_DIALECTS = [
    { value: 'sql', label: '标准 SQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'mariadb', label: 'MariaDB' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'bigquery', label: 'BigQuery' },
    { value: 'redshift', label: 'Redshift' },
    { value: 'spark', label: 'Spark SQL' },
    { value: 'trino', label: 'Trino' },
    { value: 'transactsql', label: 'SQL Server (T-SQL)' },
    { value: 'plsql', label: 'Oracle PL/SQL' },
];

/**
 * 关键字大小写选项
 */
const KEYWORD_CASE_OPTIONS = [
    { value: 'upper', label: '大写 (SELECT)' },
    { value: 'lower', label: '小写 (select)' },
    { value: 'preserve', label: '保持原样' },
];

/**
 * 格式化风格预设
 */
const FORMAT_STYLES = [
    {
        value: 'standard',
        label: '标准风格',
        description: '平衡的缩进和换行，适合大多数场景',
        config: {
            tabWidth: 4,
            indentStyle: 'standard',
            logicalOperatorNewline: 'before',
            expressionWidth: 50,
            denseOperators: false,
            newlineBeforeSemicolon: false,
        },
    },
    {
        value: 'compact',
        label: '紧凑风格',
        description: '减少换行，节省垂直空间',
        config: {
            tabWidth: 2,
            indentStyle: 'standard',
            logicalOperatorNewline: 'before',
            expressionWidth: 80,
            denseOperators: true,
            newlineBeforeSemicolon: false,
        },
    },
    {
        value: 'expanded',
        label: '展开风格',
        description: '更多换行，每个子句单独一行，便于阅读复杂查询',
        config: {
            tabWidth: 4,
            indentStyle: 'tabularLeft',
            logicalOperatorNewline: 'before',
            expressionWidth: 30,
            denseOperators: false,
            newlineBeforeSemicolon: true,
        },
    },
    {
        value: 'tabular',
        label: '表格风格',
        description: '关键字右对齐，列定义整齐排列',
        config: {
            tabWidth: 4,
            indentStyle: 'tabularRight',
            logicalOperatorNewline: 'before',
            expressionWidth: 40,
            denseOperators: false,
            newlineBeforeSemicolon: false,
        },
    },
    {
        value: 'custom',
        label: '自定义',
        description: '自由配置所有格式化选项',
        config: null, // 使用用户自定义配置
    },
];

/**
 * 缩进风格选项
 */
const INDENT_STYLE_OPTIONS = [
    { value: 'standard', label: '标准缩进' },
    { value: 'tabularLeft', label: '表格左对齐' },
    { value: 'tabularRight', label: '表格右对齐' },
];

/**
 * 逻辑运算符换行选项
 */
const LOGICAL_OPERATOR_OPTIONS = [
    { value: 'before', label: '运算符前换行' },
    { value: 'after', label: '运算符后换行' },
];

/**
 * SQL 格式化工具
 *
 * 功能：
 * - 实时 SQL 语句美化（使用 sql-formatter 库）
 * - 多种格式化风格预设
 * - 支持多种 SQL 方言
 * - 自定义格式化选项
 */
function SqlFormat() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('format'); // 'format' | 'minify'
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // 格式化选项
    const [dialect, setDialect] = useState('mysql');
    const [keywordCase, setKeywordCase] = useState('upper');
    const [formatStyle, setFormatStyle] = useState('standard');

    // 自定义选项（仅在 custom 风格时使用）
    const [customConfig, setCustomConfig] = useState({
        tabWidth: 4,
        indentStyle: 'standard',
        logicalOperatorNewline: 'before',
        expressionWidth: 50,
        denseOperators: false,
        newlineBeforeSemicolon: false,
    });

    /**
     * 获取当前格式化配置
     */
    const getFormatConfig = () => {
        const style = FORMAT_STYLES.find(s => s.value === formatStyle);
        if (style && style.config) {
            return style.config;
        }
        return customConfig;
    };

    /**
     * 实时处理 SQL
     */
    useEffect(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            let result;
            if (mode === 'format') {
                const config = getFormatConfig();
                // 使用 sql-formatter 进行专业格式化
                result = format(input, {
                    language: dialect,
                    keywordCase: keywordCase,
                    linesBetweenQueries: 2,
                    ...config,
                });
            } else {
                // 压缩模式：移除多余空白
                result = input
                    .replace(/\s+/g, ' ')
                    .replace(/\s*\(\s*/g, '(')
                    .replace(/\s*\)\s*/g, ')')
                    .replace(/\s*,\s*/g, ', ')
                    .replace(/\s*;\s*/g, '; ')
                    .trim();
            }
            setOutput(result);
            setError(null);
        } catch (err) {
            setError('格式化失败: ' + err.message);
            setOutput('');
        }
    }, [input, mode, dialect, keywordCase, formatStyle, customConfig]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

    /**
     * 更新自定义配置
     */
    const updateCustomConfig = (key, value) => {
        setCustomConfig(prev => ({ ...prev, [key]: value }));
    };

    /**
     * 清空
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
    }, []);

    /**
     * 切换设置面板
     */
    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Settings',
            icon: <SettingsIcon fontSize="small" />,
            onClick: toggleSettings,
            variant: showSettings ? 'contained' : 'outlined',
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    const currentStyle = FORMAT_STYLES.find(s => s.value === formatStyle);

    return (
        <ToolCard
            title="SQL 格式化"
            description="实时美化和压缩 SQL 语句，支持多种格式化风格和 SQL 方言"
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

            {/* 格式化风格快速选择 */}
            {mode === 'format' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {FORMAT_STYLES.map((style) => (
                        <Chip
                            key={style.value}
                            label={style.label}
                            onClick={() => setFormatStyle(style.value)}
                            color={formatStyle === style.value ? 'primary' : 'default'}
                            variant={formatStyle === style.value ? 'filled' : 'outlined'}
                            sx={{ cursor: 'pointer' }}
                        />
                    ))}
                </Box>
            )}

            {/* 设置面板 */}
            {showSettings && mode === 'format' && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.05)'
                            : 'rgba(99, 102, 241, 0.03)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            格式化选项
                        </Typography>
                        {currentStyle && (
                            <Typography variant="caption" color="text.secondary">
                                - {currentStyle.description}
                            </Typography>
                        )}
                    </Box>

                    {/* 基础选项 */}
                    <Grid container spacing={3} sx={{ mb: 2 }}>
                        {/* SQL 方言 */}
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>SQL 方言</InputLabel>
                                <Select
                                    value={dialect}
                                    label="SQL 方言"
                                    onChange={(e) => setDialect(e.target.value)}
                                >
                                    {SQL_DIALECTS.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>
                                            {d.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 关键字大小写 */}
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>关键字大小写</InputLabel>
                                <Select
                                    value={keywordCase}
                                    label="关键字大小写"
                                    onChange={(e) => setKeywordCase(e.target.value)}
                                >
                                    {KEYWORD_CASE_OPTIONS.map((k) => (
                                        <MenuItem key={k.value} value={k.value}>
                                            {k.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 格式风格 */}
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>格式风格</InputLabel>
                                <Select
                                    value={formatStyle}
                                    label="格式风格"
                                    onChange={(e) => setFormatStyle(e.target.value)}
                                >
                                    {FORMAT_STYLES.map((s) => (
                                        <MenuItem key={s.value} value={s.value}>
                                            {s.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* 自定义选项（仅在自定义风格时显示） */}
                    {formatStyle === 'custom' && (
                        <>
                            <Typography variant="body2" fontWeight={500} sx={{ mb: 2, mt: 1 }}>
                                自定义配置
                            </Typography>
                            <Grid container spacing={3}>
                                {/* 缩进宽度 */}
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        缩进宽度: {customConfig.tabWidth} 空格
                                    </Typography>
                                    <Slider
                                        value={customConfig.tabWidth}
                                        onChange={(_, value) => updateCustomConfig('tabWidth', value)}
                                        min={2}
                                        max={8}
                                        step={1}
                                        marks={[
                                            { value: 2, label: '2' },
                                            { value: 4, label: '4' },
                                            { value: 8, label: '8' },
                                        ]}
                                        size="small"
                                    />
                                </Grid>

                                {/* 缩进风格 */}
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>缩进风格</InputLabel>
                                        <Select
                                            value={customConfig.indentStyle}
                                            label="缩进风格"
                                            onChange={(e) => updateCustomConfig('indentStyle', e.target.value)}
                                        >
                                            {INDENT_STYLE_OPTIONS.map((i) => (
                                                <MenuItem key={i.value} value={i.value}>
                                                    {i.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* 逻辑运算符换行 */}
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>AND/OR 换行</InputLabel>
                                        <Select
                                            value={customConfig.logicalOperatorNewline}
                                            label="AND/OR 换行"
                                            onChange={(e) => updateCustomConfig('logicalOperatorNewline', e.target.value)}
                                        >
                                            {LOGICAL_OPERATOR_OPTIONS.map((l) => (
                                                <MenuItem key={l.value} value={l.value}>
                                                    {l.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* 表达式宽度 */}
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        行宽度: {customConfig.expressionWidth} 字符
                                    </Typography>
                                    <Slider
                                        value={customConfig.expressionWidth}
                                        onChange={(_, value) => updateCustomConfig('expressionWidth', value)}
                                        min={20}
                                        max={120}
                                        step={10}
                                        size="small"
                                    />
                                </Grid>

                                {/* 紧凑运算符 */}
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={customConfig.denseOperators}
                                                onChange={(e) => updateCustomConfig('denseOperators', e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label="紧凑运算符 (无空格)"
                                    />
                                </Grid>

                                {/* 分号前换行 */}
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={customConfig.newlineBeforeSemicolon}
                                                onChange={(e) => updateCustomConfig('newlineBeforeSemicolon', e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label="分号前换行"
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Paper>
            )}

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
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输入 SQL
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language="sql"
                            placeholder='输入 SQL 语句，例如：
SELECT id, name, email FROM users WHERE status = 1 ORDER BY id DESC;

CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);'
                            height="450px"
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
                                输出结果 ({mode === 'format' ? '格式化' : '压缩'})
                            </Typography>
                            {mode === 'format' && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                        label={currentStyle?.label || '标准'}
                                        size="small"
                                        sx={{ height: 20, fontSize: 11 }}
                                    />
                                    <Typography variant="caption" color="text.disabled">
                                        {SQL_DIALECTS.find(d => d.value === dialect)?.label}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <CodeEditor
                            value={output}
                            language="sql"
                            placeholder="输入 SQL 后将实时显示结果..."
                            height="450px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    选择不同的格式化风格可获得不同的输出效果。
                    <strong>标准风格</strong>适合日常使用，
                    <strong>紧凑风格</strong>减少垂直空间，
                    <strong>展开风格</strong>更易阅读，
                    <strong>表格风格</strong>关键字对齐。
                    选择<strong>自定义</strong>可细粒度调整所有选项。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default SqlFormat;
