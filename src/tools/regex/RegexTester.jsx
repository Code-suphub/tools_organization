import React, { useState, useCallback, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Chip,
    useTheme,
    Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import ToolCard from '../../components/ToolCard';

/**
 * 正则表达式测试器
 * 
 * 功能：
 * - 实时测试正则表达式
 * - 高亮匹配结果
 * - 支持常用标志位 (g, i, m, s)
 * - 显示匹配组
 */
function RegexTester() {
    const theme = useTheme();

    // 状态管理
    const [pattern, setPattern] = useState('');
    const [testString, setTestString] = useState('');
    const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
    const [error, setError] = useState(null);

    /**
     * 构建正则表达式标志字符串
     */
    const flagsString = useMemo(() => {
        return Object.entries(flags)
            .filter(([_, enabled]) => enabled)
            .map(([flag]) => flag)
            .join('');
    }, [flags]);

    /**
     * 执行正则匹配
     */
    const matchResults = useMemo(() => {
        if (!pattern || !testString) {
            setError(null);
            return { matches: [], highlightedText: testString };
        }

        try {
            const regex = new RegExp(pattern, flagsString);
            const matches = [];
            let match;

            if (flags.g) {
                // 全局匹配
                while ((match = regex.exec(testString)) !== null) {
                    matches.push({
                        fullMatch: match[0],
                        groups: match.slice(1),
                        index: match.index,
                        length: match[0].length,
                    });
                    // 防止无限循环
                    if (match[0].length === 0) {
                        regex.lastIndex++;
                    }
                }
            } else {
                // 单次匹配
                match = regex.exec(testString);
                if (match) {
                    matches.push({
                        fullMatch: match[0],
                        groups: match.slice(1),
                        index: match.index,
                        length: match[0].length,
                    });
                }
            }

            setError(null);
            return { matches, regex };
        } catch (err) {
            setError('正则表达式语法错误: ' + err.message);
            return { matches: [], highlightedText: testString };
        }
    }, [pattern, testString, flagsString, flags.g]);

    /**
     * 切换标志位
     */
    const handleFlagChange = (flag) => {
        setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
    };

    /**
     * 清空
     */
    const handleClear = useCallback(() => {
        setPattern('');
        setTestString('');
        setError(null);
    }, []);

    /**
     * 渲染高亮文本
     */
    const renderHighlightedText = () => {
        if (!pattern || !testString || matchResults.matches.length === 0) {
            return (
                <Typography
                    sx={{
                        fontFamily: 'Fira Code, monospace',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {testString || '测试文本将显示在这里...'}
                </Typography>
            );
        }

        const { matches } = matchResults;
        const parts = [];
        let lastIndex = 0;

        // 排序匹配结果
        const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

        sortedMatches.forEach((match, i) => {
            // 添加匹配前的文本
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`text-${i}`}>
                        {testString.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // 添加高亮的匹配文本
            parts.push(
                <Box
                    key={`match-${i}`}
                    component="span"
                    sx={{
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(34, 197, 94, 0.25)',
                        color: theme.palette.mode === 'dark' ? '#86efac' : '#15803d',
                        borderRadius: '2px',
                        px: 0.5,
                    }}
                >
                    {match.fullMatch}
                </Box>
            );

            lastIndex = match.index + match.length;
        });

        // 添加剩余文本
        if (lastIndex < testString.length) {
            parts.push(
                <span key="text-end">
                    {testString.substring(lastIndex)}
                </span>
            );
        }

        return (
            <Typography
                component="div"
                sx={{
                    fontFamily: 'Fira Code, monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {parts}
            </Typography>
        );
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
            title="正则表达式测试器"
            description="实时测试正则表达式匹配，高亮显示匹配结果，支持捕获组"
            actions={actions}
        >
            <Grid container spacing={3}>
                {/* 正则表达式输入 */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            正则表达式
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography color="text.secondary" sx={{ fontSize: '1.5rem' }}>/</Typography>
                            <TextField
                                fullWidth
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                placeholder="输入正则表达式，例如：\d+|[a-z]+@[a-z]+\.[a-z]+"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Fira Code, monospace',
                                    },
                                }}
                            />
                            <Typography color="text.secondary" sx={{ fontSize: '1.5rem' }}>/{flagsString}</Typography>
                        </Box>

                        {/* 标志位选择 */}
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={flags.g}
                                        onChange={() => handleFlagChange('g')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">g (全局匹配)</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={flags.i}
                                        onChange={() => handleFlagChange('i')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">i (忽略大小写)</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={flags.m}
                                        onChange={() => handleFlagChange('m')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">m (多行模式)</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={flags.s}
                                        onChange={() => handleFlagChange('s')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">s (点号匹配换行)</Typography>}
                            />
                        </FormGroup>
                    </Paper>
                </Grid>

                {/* 错误提示 */}
                {error && (
                    <Grid item xs={12}>
                        <Alert severity="error">{error}</Alert>
                    </Grid>
                )}

                {/* 测试文本输入 */}
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
                                测试文本
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
                            value={testString}
                            onChange={(e) => setTestString(e.target.value)}
                            placeholder="输入要测试的文本..."
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

                {/* 高亮结果 */}
                <Grid item xs={12} md={6}>
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
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'rgba(0,0,0,0.02)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                匹配结果
                            </Typography>
                            <Chip
                                label={`${matchResults.matches.length} 个匹配`}
                                size="small"
                                color={matchResults.matches.length > 0 ? 'success' : 'default'}
                                variant={matchResults.matches.length > 0 ? 'filled' : 'outlined'}
                            />
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                minHeight: 240,
                                maxHeight: 300,
                                overflow: 'auto',
                            }}
                        >
                            {renderHighlightedText()}
                        </Box>
                    </Paper>
                </Grid>

                {/* 匹配详情 */}
                {matchResults.matches.length > 0 && (
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                匹配详情
                            </Typography>
                            <Grid container spacing={2}>
                                {matchResults.matches.slice(0, 20).map((match, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: 1.5,
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                匹配 #{index + 1} (位置: {match.index})
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: 'Fira Code, monospace',
                                                    mt: 0.5,
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                "{match.fullMatch}"
                                            </Typography>
                                            {match.groups.length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        捕获组:
                                                    </Typography>
                                                    {match.groups.map((group, gIndex) => (
                                                        <Chip
                                                            key={gIndex}
                                                            label={`$${gIndex + 1}: ${group || '(空)'}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ ml: 0.5, mt: 0.5 }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                            {matchResults.matches.length > 20 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    ... 还有 {matchResults.matches.length - 20} 个匹配未显示
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </ToolCard>
    );
}

export default RegexTester;
