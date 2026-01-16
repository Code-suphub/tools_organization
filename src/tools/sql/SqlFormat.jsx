import React, { useState, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * SQL 关键字列表（用于简单格式化）
 */
const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
    'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'DATABASE',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE',
    'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'IF', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT',
];

/**
 * SQL 方言列表
 */
const SQL_DIALECTS = [
    { value: 'standard', label: 'SQL Standard' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
];

/**
 * SQL 格式化工具
 * 
 * 功能：
 * - SQL 语句美化
 * - SQL 语句压缩
 * - 支持多种 SQL 方言
 */
function SqlFormat() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [dialect, setDialect] = useState('standard');
    const [error, setError] = useState(null);

    /**
     * 简单的 SQL 格式化实现
     * 在主要关键字前添加换行
     */
    const formatSql = useCallback((sql) => {
        if (!sql.trim()) {
            setError('请输入 SQL 语句');
            return '';
        }

        try {
            let formatted = sql.trim();

            // 标准化空白字符
            formatted = formatted.replace(/\s+/g, ' ');

            // 在主要关键字前换行
            const breakBefore = [
                'SELECT', 'FROM', 'WHERE', 'AND', 'OR',
                'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN',
                'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
                'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
                'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
                'UNION', 'INTERSECT', 'EXCEPT',
            ];

            breakBefore.forEach(keyword => {
                const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi');
                formatted = formatted.replace(regex, `\n${keyword.toUpperCase()} `);
            });

            // 处理逗号后换行（在 SELECT 子句中）
            const selectMatch = formatted.match(/SELECT\s+([\s\S]*?)\s+FROM/i);
            if (selectMatch) {
                const selectClause = selectMatch[1];
                const formattedSelect = selectClause.replace(/,\s*/g, ',\n    ');
                formatted = formatted.replace(selectMatch[1], '\n    ' + formattedSelect);
            }

            // 处理括号
            formatted = formatted.replace(/\(\s*/g, '(\n    ');
            formatted = formatted.replace(/\s*\)/g, '\n)');

            // 清理多余空行
            formatted = formatted.replace(/\n\s*\n/g, '\n');
            formatted = formatted.trim();

            setError(null);
            return formatted;
        } catch (err) {
            setError('格式化失败: ' + err.message);
            return '';
        }
    }, []);

    /**
     * 压缩 SQL（移除多余空白）
     */
    const minifySql = useCallback((sql) => {
        if (!sql.trim()) {
            setError('请输入 SQL 语句');
            return '';
        }

        try {
            let minified = sql.trim();
            // 替换所有空白为单个空格
            minified = minified.replace(/\s+/g, ' ');
            // 移除括号周围的空格
            minified = minified.replace(/\s*\(\s*/g, '(');
            minified = minified.replace(/\s*\)\s*/g, ')');
            // 移除逗号后的空格保留逗号前无空格
            minified = minified.replace(/\s*,\s*/g, ',');

            setError(null);
            return minified;
        } catch (err) {
            setError('压缩失败: ' + err.message);
            return '';
        }
    }, []);

    /**
     * 格式化按钮处理
     */
    const handleFormat = useCallback(() => {
        const result = formatSql(input);
        setOutput(result);
    }, [input, formatSql]);

    /**
     * 压缩按钮处理
     */
    const handleMinify = useCallback(() => {
        const result = minifySql(input);
        setOutput(result);
    }, [input, minifySql]);

    /**
     * 清空
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
    }, []);

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Format',
            icon: <FormatAlignLeftIcon fontSize="small" />,
            onClick: handleFormat,
        },
        {
            label: 'Minify',
            icon: <CompressIcon fontSize="small" />,
            onClick: handleMinify,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="SQL 格式化"
            description="美化和压缩 SQL 语句，提高代码可读性"
            actions={actions}
            copyContent={output}
        >
            {/* 方言选择 */}
            <Box sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
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
SELECT id, name, email FROM users WHERE status = 1 AND created_at > "2024-01-01" ORDER BY id DESC LIMIT 10'
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
                                输出结果
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={output}
                            language="sql"
                            placeholder="格式化后的 SQL 将显示在这里..."
                            height="400px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default SqlFormat;
