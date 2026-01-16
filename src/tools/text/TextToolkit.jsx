import React, { useState, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    useTheme,
    Stack,
    Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';

import ToolCard from '../../components/ToolCard';

/**
 * 文本处理工具箱
 * 
 * 功能：
 * - 统计：字符数、单词数、行数
 * - 转换：大写、小写、首字母大写
 * - 清理：去重、去空行、去首尾空格
 */
function TextToolkit() {
    const theme = useTheme();
    const [input, setInput] = useState('');

    /**
     * 统计信息
     */
    const stats = useMemo(() => {
        return {
            chars: input.length,
            lines: input ? input.split(/\r\n|\r|\n/).length : 0,
            words: input ? input.trim().split(/\s+/).length : 0,
            bytes: new Blob([input]).size,
        };
    }, [input]);

    /**
     * 文本操作函数工厂
     */
    const transform = (fn) => {
        setInput(fn(input));
    };

    /**
     * 各种处理函数
     */
    const toUpperCase = () => transform(s => s.toUpperCase());
    const toLowerCase = () => transform(s => s.toLowerCase());
    const toTitleCase = () => transform(s => s.replace(/\b\w/g, c => c.toUpperCase()));

    const removeDuplicates = () => transform(s => {
        const lines = s.split(/\r\n|\r|\n/);
        return [...new Set(lines)].join('\n');
    });

    const removeEmptyLines = () => transform(s => {
        return s.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0).join('\n');
    });

    const trimLines = () => transform(s => {
        return s.split(/\r\n|\r|\n/).map(line => line.trim()).join('\n');
    });

    const clear = () => setInput('');

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(input);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    // 工具栏配置
    const actions = [
        {
            label: 'Copy',
            icon: <ContentCopyIcon fontSize="small" />,
            onClick: copy,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: clear,
        },
    ];

    return (
        <ToolCard
            title="文本工具箱"
            description="包含文本统计、大小写转换、去重、去空行等常用操作"
            actions={actions}
        >
            <Grid container spacing={3}>
                {/* 输入区域 */}
                <Grid item xs={12} md={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '500px',
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
                                文本内容
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                    {stats.chars} 字符
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {stats.words} 单词
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {stats.lines} 行
                                </Typography>
                            </Stack>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="请输入或粘贴文本..."
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    p: 2,
                                    height: '100%',
                                    alignItems: 'flex-start',
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                    overflow: 'auto',
                                }
                            }}
                            sx={{ flex: 1, overflow: 'auto' }}
                        />
                    </Paper>
                </Grid>

                {/* 操作区域 */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* 转换操作 */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatSizeIcon fontSize="small" /> 大小写转换
                            </Typography>
                            <Stack spacing={1}>
                                <Button variant="outlined" size="small" fullWidth onClick={toUpperCase}>
                                    全部大写 (UPPERCASE)
                                </Button>
                                <Button variant="outlined" size="small" fullWidth onClick={toLowerCase}>
                                    全部小写 (lowercase)
                                </Button>
                                <Button variant="outlined" size="small" fullWidth onClick={toTitleCase}>
                                    首字母大写 (Title Case)
                                </Button>
                            </Stack>
                        </Paper>

                        {/* 清理操作 */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CleaningServicesIcon fontSize="small" /> 文本清理
                            </Typography>
                            <Stack spacing={1}>
                                <Button variant="outlined" size="small" fullWidth onClick={removeDuplicates}>
                                    去除重复行
                                </Button>
                                <Button variant="outlined" size="small" fullWidth onClick={removeEmptyLines}>
                                    去除空行
                                </Button>
                                <Button variant="outlined" size="small" fullWidth onClick={trimLines}>
                                    去除首尾空格
                                </Button>
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default TextToolkit;
