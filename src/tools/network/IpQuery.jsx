import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    useTheme,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ToolCard from '../../components/ToolCard';

/**
 * IP 查询工具
 * 
 * 功能：
 * - 查询本机公网 IP (使用 ipify API)
 * - 显示 User-Agent
 * - 后续可扩展 IP 归属地查询 (依赖后端或更复杂的 API)
 */
function IpQuery() {
    const theme = useTheme();

    const [ipData, setIpData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userAgent, setUserAgent] = useState('');

    useEffect(() => {
        setUserAgent(navigator.userAgent);
        fetchIp();
    }, []);

    /**
     * 获取 IP 地址
     */
    const fetchIp = async () => {
        setLoading(true);
        setError(null);
        try {
            // 使用 ipify 的免费 API
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            const data = await response.json();
            setIpData(data);
        } catch (err) {
            setError('获取 IP 地址失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 复制文本
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    return (
        <ToolCard
            title="本机 IP 查询"
            description="查看您的公网 IP 地址和 User-Agent 信息"
            showToolbar={false}
        >
            <Grid container spacing={3}>
                {/* IP 信息 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PublicIcon /> 公网 IP 地址
                        </Typography>

                        {loading ? (
                            <CircularProgress size={40} />
                        ) : error ? (
                            <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
                        ) : (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                                    {ipData?.ip || '-'}
                                </Typography>
                                {ipData?.ip && (
                                    <Button
                                        startIcon={<ContentCopyIcon />}
                                        size="small"
                                        onClick={() => copyToClipboard(ipData.ip)}
                                        sx={{ mt: 1 }}
                                    >
                                        复制 IP
                                    </Button>
                                )}
                            </Box>
                        )}

                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={fetchIp}
                            sx={{ position: 'absolute', top: 16, right: 16 }}
                        >
                            刷新
                        </Button>
                    </Paper>
                </Grid>

                {/* User Agent 信息 */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                            浏览器信息 (User-Agent)
                        </Typography>

                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                borderRadius: 1,
                                fontFamily: 'Fira Code, monospace',
                                fontSize: '0.9rem',
                                wordBreak: 'break-all',
                                position: 'relative',
                            }}
                        >
                            {userAgent}
                            <Tooltip title="复制">
                                <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(userAgent)}
                                    sx={{ position: 'absolute', bottom: 8, right: 8 }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="body2" color="text.secondary">
                            注意：IP 地址来自 api.ipify.org 提供的公共查询服务，可能受网络代理等因素影响。
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default IpQuery;
