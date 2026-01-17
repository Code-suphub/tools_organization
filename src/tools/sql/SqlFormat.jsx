import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * SQL 格式化工具
 * 
 * 功能：
 * - 实时 SQL 语句美化
 * - 实时 SQL 语句压缩
 */
function SqlFormat() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState('format'); // 'format' | 'minify'
    const [error, setError] = useState(null);

    /**
     * 简单的 SQL 格式化实现
     */
    const formatSql = (sql) => {
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

        // 清理多余空行
        formatted = formatted.replace(/\n\s*\n/g, '\n');
        return formatted.trim();
    };

    /**
     * 压缩 SQL
     */
    const minifySql = (sql) => {
        let minified = sql.trim();
        minified = minified.replace(/\s+/g, ' ');
        minified = minified.replace(/\s*\(\s*/g, '(');
        minified = minified.replace(/\s*\)\s*/g, ')');
        minified = minified.replace(/\s*,\s*/g, ',');
        return minified;
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
            const result = mode === 'format' ? formatSql(input) : minifySql(input);
            setOutput(result);
            setError(null);
        } catch (err) {
            setError('处理失败: ' + err.message);
            setOutput('');
        }
    }, [input, mode]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

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
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="SQL 格式化"
            description="实时美化和压缩 SQL 语句，提高代码可读性"
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
                                输出结果 ({mode === 'format' ? '格式化' : '压缩'})
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={output}
                            language="sql"
                            placeholder="输入 SQL 后将实时显示结果..."
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

