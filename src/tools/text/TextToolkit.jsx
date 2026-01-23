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
import CodeIcon from '@mui/icons-material/Code';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

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
        const str = input || '';
        return {
            chars: str.length,
            lines: str ? str.split(/\r\n|\r|\n/).length : 0,
            words: str ? str.trim().split(/\s+/).length : 0,
            bytesUtf8: new Blob([str]).size,
            // GBK Approximation: ASCII=1, Others=2
            bytesGbk: str.replace(/[^\x00-\xff]/g, "**").length,
            bytesUtf16: str.length * 2,
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

    const toBase64 = () => {
        try {
            // Support UTF-8 strings
            transform(s => window.btoa(unescape(encodeURIComponent(s))));
        } catch (e) {
            console.error(e);
        }
    };

    const toHex = () => {
        transform(s => {
            let hex = '';
            for (let i = 0; i < s.length; i++) {
                hex += s.charCodeAt(i).toString(16).padStart(4, '0');
            }
            return hex;
        });
    };

    const toUnicode = () => {
        transform(s => {
            return s.split('').map(c => {
                const code = c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                return `\\u${code}`;
            }).join('');
        });
    };

    const decodeBase64 = () => {
        try {
            transform(s => decodeURIComponent(escape(window.atob(s))));
        } catch (e) {
            alert('无效的 Base64 字符串');
        }
    };

    const decodeUnicode = () => {
        try {
            transform(s => JSON.parse(`"${s}"`));
        } catch (e) {
            alert('无效的 Unicode 转义序列');
        }
    };

    const toUrlEncode = () => transform(s => encodeURIComponent(s));
    const decodeUrl = () => {
        try {
            transform(s => decodeURIComponent(s));
        } catch (e) {
            alert('URL 解码失败：包含无效的编码字符');
        }
    };

    const prettifyUrlQuery = () => {
        transform(s => {
            try {
                // 如果是完整 URL，只处理 search 部分
                let queryString = s;
                if (s.includes('?')) {
                    queryString = s.split('?')[1];
                }

                // 处理编码情况，先解码再分割，以便查看
                const params = new URLSearchParams(queryString);
                const result = [];
                for (const [key, value] of params.entries()) {
                    result.push(`${key}=${value}`);
                }
                return result.join('\n');
            } catch (e) {
                // 如果不是标准格式，简单按 & 分割
                return s.split('&').join('\n');
            }
        });
    };

    const unprettifyUrlQuery = () => {
        transform(s => {
            return s.split(/\r\n|\r|\n/).filter(line => line.trim()).join('&');
        });
    };

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
                        </Box>
                        {/* 扩展统计信息展示 - 移除了顶部的简略统计，改为右侧详细展示 */}
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

                {/* 右侧统计和工具区域 */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* 详细统计 */}
                        <Paper
                            elevation={0}
                            sx={{
                                overflow: 'hidden',
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AnalyticsIcon fontSize="small" color="primary" />
                                <Typography variant="subtitle2" fontWeight={600}>
                                    文本统计
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0 }}>字符数</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, border: 0 }}>{stats.chars}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0 }}>行数</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, border: 0 }}>{stats.lines}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0, pb: 2 }}>单词数</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, border: 0, pb: 2 }}>{stats.words}</TableCell>
                                        </TableRow>
                                        {/* 分割线 */}
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ p: 0, border: 0 }}>
                                                <Divider />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0, pt: 2 }}>UTF-8</TableCell>
                                            <TableCell align="right" sx={{ fontFamily: 'monospace', border: 0, pt: 2 }}>{stats.bytesUtf8} B</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0 }}>GBK (Est.)</TableCell>
                                            <TableCell align="right" sx={{ fontFamily: 'monospace', border: 0 }}>{stats.bytesGbk} B</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', border: 0 }}>UTF-16</TableCell>
                                            <TableCell align="right" sx={{ fontFamily: 'monospace', border: 0 }}>{stats.bytesUtf16} B</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* 编码转换 */}
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
                                <CodeIcon fontSize="small" /> 编码转换
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={toBase64}>
                                        转 Base64
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={decodeBase64}>
                                        解 Base64
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={toUnicode}>
                                        转 Unicode
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={decodeUnicode}>
                                        解 Unicode
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={toUrlEncode}>
                                        URL 编码
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" size="small" fullWidth onClick={decodeUrl}>
                                        URL 解码
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* URL 处理 */}
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
                                <CodeIcon fontSize="small" /> URL 参数处理
                            </Typography>
                            <Stack spacing={1}>
                                <Button variant="outlined" size="small" fullWidth onClick={prettifyUrlQuery}>
                                    参数解析 (Prettify)
                                </Button>
                                <Button variant="outlined" size="small" fullWidth onClick={unprettifyUrlQuery}>
                                    参数合并 (Join)
                                </Button>
                            </Stack>
                        </Paper>

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
            </Grid >
        </ToolCard >
    );
}

export default TextToolkit;
