import React, { useState, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Tabs,
    Tab,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CryptoJS from 'crypto-js';

import ToolCard from '../../components/ToolCard';

/**
 * 支持的哈希算法
 */
const hashAlgorithms = [
    { id: 'md5', name: 'MD5', fn: (text) => CryptoJS.MD5(text).toString() },
    { id: 'sha1', name: 'SHA-1', fn: (text) => CryptoJS.SHA1(text).toString() },
    { id: 'sha256', name: 'SHA-256', fn: (text) => CryptoJS.SHA256(text).toString() },
    { id: 'sha512', name: 'SHA-512', fn: (text) => CryptoJS.SHA512(text).toString() },
    { id: 'sha3', name: 'SHA-3', fn: (text) => CryptoJS.SHA3(text).toString() },
];

/**
 * 哈希生成工具
 * 
 * 功能：
 * - 支持 MD5、SHA-1、SHA-256、SHA-512、SHA-3
 * - 实时计算
 * - 一键复制
 */
function HashGenerator() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [hashes, setHashes] = useState({});

    /**
     * 计算所有哈希值
     */
    const calculateHashes = useCallback((text) => {
        if (!text) {
            setHashes({});
            return;
        }

        const results = {};
        hashAlgorithms.forEach(algo => {
            try {
                results[algo.id] = algo.fn(text);
            } catch (err) {
                results[algo.id] = '计算失败';
            }
        });
        setHashes(results);
    }, []);

    /**
     * 处理输入变化
     */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);
        calculateHashes(value);
    };

    /**
     * 切换算法标签
     */
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
    };

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setInput('');
        setHashes({});
    };

    const currentAlgo = hashAlgorithms[activeTab];
    const currentHash = hashes[currentAlgo?.id] || '';

    return (
        <ToolCard
            title="哈希生成器"
            description="使用 MD5、SHA-1、SHA-256、SHA-512 等算法计算文本的哈希值"
            copyContent={currentHash}
            onClear={handleClear}
        >
            <Grid container spacing={3}>
                {/* 输入区域 */}
                <Grid item xs={12}>
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
                                输入文本
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            value={input}
                            onChange={handleInputChange}
                            placeholder="输入要计算哈希值的文本..."
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

                {/* 算法选择和结果 */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        {/* 算法标签 */}
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 500,
                                },
                            }}
                        >
                            {hashAlgorithms.map((algo, index) => (
                                <Tab key={algo.id} label={algo.name} />
                            ))}
                        </Tabs>

                        {/* 当前算法结果 */}
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {currentAlgo?.name} 哈希值
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.03)'
                                        : 'rgba(0,0,0,0.02)',
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '14px',
                                    wordBreak: 'break-all',
                                }}
                            >
                                <Typography
                                    sx={{
                                        flex: 1,
                                        fontFamily: 'inherit',
                                        fontSize: 'inherit',
                                        color: currentHash ? 'text.primary' : 'text.secondary',
                                    }}
                                >
                                    {currentHash || '请输入文本以计算哈希值...'}
                                </Typography>
                                {currentHash && (
                                    <Tooltip title="复制">
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(currentHash)}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 所有哈希值一览 */}
                {Object.keys(hashes).length > 0 && (
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
                                所有哈希值
                            </Typography>
                            <Grid container spacing={2}>
                                {hashAlgorithms.map((algo) => (
                                    <Grid item xs={12} key={algo.id}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 1.5,
                                                borderRadius: 1.5,
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.02)'
                                                    : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{ width: 80, flexShrink: 0 }}
                                            >
                                                {algo.name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    flex: 1,
                                                    fontFamily: 'Fira Code, monospace',
                                                    fontSize: '13px',
                                                    wordBreak: 'break-all',
                                                    color: 'text.secondary',
                                                }}
                                            >
                                                {hashes[algo.id]}
                                            </Typography>
                                            <Tooltip title="复制">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyToClipboard(hashes[algo.id])}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </ToolCard>
    );
}

export default HashGenerator;
