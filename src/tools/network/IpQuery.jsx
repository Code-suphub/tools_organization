import React, { useState, useEffect, useCallback } from 'react';
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
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import RouterIcon from '@mui/icons-material/Router';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security';
import ExploreIcon from '@mui/icons-material/Explore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ToolCard from '../../components/ToolCard';

/**
 * IP 查询工具 (增强版)
 * 
 * 功能：
 * - 公网 IPv4/IPv6 查询
 * - 内网 (局域网) IP 查询 (WebRTC)
 * - 地理位置与运营商信息
 * - 代理/VPN 检测
 * - DNS 解析器信息
 */
function IpQuery() {
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [localIpLoading, setLocalIpLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFixDialog, setShowFixDialog] = useState(false);
    const [data, setData] = useState({
        ipv4: null,
        ipv6: null,
        localIp: null, // 初始为 null，表示尚未尝试
        geo: null,
        dns: null,
        userAgent: navigator.userAgent
    });

    /**
     * 获取局域网 IP (WebRTC 技巧)
     */
    const fetchLocalIP = useCallback(async (isRetry = false) => {
        setLocalIpLoading(true);
        const result = await new Promise((resolve) => {
            try {
                // 使用 Google STUN 服务器增加探测成功率
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                pc.createDataChannel("");
                pc.createOffer().then(pc.setLocalDescription.bind(pc));
                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                    // 网络掩码匹配 IPv4 或 IPv6 地址
                    const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
                    pc.onicecandidate = null;
                    pc.close();
                    resolve(myIP);
                };
                // 超时处理
                setTimeout(() => {
                    pc.close();
                    resolve('BLOCK'); // 标记为被拦截
                }, 3000);
            } catch (e) {
                resolve('UNSUPPORTED');
            }
        });

        setData(prev => ({ ...prev, localIp: result }));
        setLocalIpLoading(false);
        return result;
    }, []);

    /**
     * 授权并重试 (WebRTC 权限提升技巧)
     */
    const handleGrantAndRetry = async () => {
        try {
            // 通过请求媒体权限，部分浏览器会放宽对 WebRTC 获取真实 IP 的限制
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // 立即停止，我们不需要真的用到麦克风
            stream.getTracks().forEach(track => track.stop());
            // 重新探测
            const result = await fetchLocalIP(true);
            if (result === 'BLOCK') {
                setShowFixDialog(true);
            }
        } catch (err) {
            // 用户拒绝或浏览器不支持
            setShowFixDialog(true);
        }
    };

    /**
     * 获取所有公网信息
     */
    const fetchPublicInfo = useCallback(async () => {
        setLoading(true);
        setError(null);

        // 异步并行请求公网数据
        const tasks = [
            fetch('https://api.ipify.org?format=json').then(r => r.json()).catch(() => ({ ip: null })),
            fetch('https://api64.ipify.org?format=json').then(r => r.json()).catch(() => ({ ip: null })),
            fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => null),
            fetch('https://edns.ip-api.com/json').then(r => r.json()).catch(() => null),
        ];

        try {
            const [v4Res, v6Res, geoRes, dnsRes] = await Promise.all(tasks);

            setData(prev => ({
                ...prev,
                ipv4: v4Res.ip,
                ipv6: v6Res.ip !== v4Res.ip ? v6Res.ip : '未分配/暂存 IPv6',
                geo: geoRes,
                dns: dnsRes,
            }));
        } catch (err) {
            setError('获取部分信息失败，请重试');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPublicInfo();
        fetchLocalIP();
    }, [fetchPublicInfo, fetchLocalIP]);

    /**
     * 复制文本
     */
    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    /**
     * 渲染局域网 IP 卡片内容
     */
    const renderLocalIpContent = () => {
        if (localIpLoading) return <CircularProgress size={20} thickness={4} />;

        if (!data.localIp || data.localIp === 'BLOCK') {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                    <Typography variant="body2" color="error.main" sx={{ fontSize: '0.8rem' }}>
                        获取失败 (隐私拦截)
                    </Typography>
                    <Button
                        size="small"
                        variant="text"
                        onClick={handleGrantAndRetry}
                        sx={{ p: 0, minWidth: 0, fontSize: '0.7rem', textTransform: 'none' }}
                    >
                        点击授权并重试
                    </Button>
                </Box>
            );
        }

        if (data.localIp === 'UNSUPPORTED') {
            return <Typography variant="body2" color="text.disabled">浏览器不支持</Typography>;
        }

        return (
            <Typography variant="body1" fontWeight={700} color="text.primary">
                {data.localIp}
            </Typography>
        );
    };

    const InfoItem = ({ icon: Icon, label, value, subValue, isLoading, copyable = true, customContent }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                position: 'relative',
                minHeight: '85px',
                transition: 'transform 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <Icon fontSize="small" />
                <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                {isLoading ? (
                    <CircularProgress size={20} thickness={4} />
                ) : (
                    customContent ? customContent : (
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ wordBreak: 'break-all' }}>
                                {value || '未知'}
                            </Typography>
                            {subValue && (
                                <Typography variant="caption" color="text.secondary">
                                    {subValue}
                                </Typography>
                            )}
                        </Box>
                    )
                )}
            </Box>

            {!isLoading && !customContent && copyable && value && (
                <Tooltip title="复制">
                    <IconButton
                        size="small"
                        onClick={() => copyToClipboard(value)}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            )}
        </Paper>
    );

    return (
        <ToolCard
            title="高级 IP / 网络查询"
            description="查询公网 IP、局域网 IP、DNS 解析服务器及网络安全性信息"
            actions={[
                {
                    label: '刷新全部',
                    icon: <RefreshIcon fontSize="small" />,
                    onClick: () => {
                        fetchPublicInfo();
                        if (data.localIp) fetchLocalIP();
                    },
                    loading: loading || localIpLoading
                }
            ]}
        >
            {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={2}>
                {/* 核心 IP 地址 */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, px: 1, color: 'primary.main', fontWeight: 600 }}>
                        核心地址 (Core Addresses)
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem icon={PublicIcon} label="公网 IPv4" value={data.ipv4} isLoading={loading} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem icon={LanguageIcon} label="公网 IPv6" value={data.ipv6} isLoading={loading} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem
                                icon={RouterIcon}
                                label="局域网 IP"
                                customContent={renderLocalIpContent()}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <InfoItem
                                icon={DnsIcon}
                                label="DNS 解析器"
                                value={data.dns?.dns?.ip}
                                subValue={data.dns?.dns?.geo}
                                isLoading={loading}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* 网络详情与归属地 */}
                <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, px: 1, color: 'primary.main', fontWeight: 600 }}>
                        网络详情 (Network Details)
                    </Typography>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                        }}
                    >
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">运营商 (ISP)</Typography>
                                        <Typography variant="body1" fontWeight={600}>{data.geo?.org || data.geo?.asn || '获取中...'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">地理位置</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {data.geo ? `${data.geo.city}, ${data.geo.region}, ${data.geo.country_name}` : '未知'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">ASN</Typography>
                                        <Typography variant="body1" fontWeight={600}>{data.geo?.asn || '未知'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip
                                            icon={<SecurityIcon style={{ fontSize: 16 }} />}
                                            label={data.geo?.security?.proxy || data.geo?.proxy ? "代理/VPN: 是" : "代理/VPN: 否"}
                                            color={data.geo?.proxy ? "warning" : "success"}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            icon={<ExploreIcon style={{ fontSize: 16 }} />}
                                            label={data.geo?.timezone || '时区'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* 浏览器/UA */}
                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, px: 1, color: 'primary.main', fontWeight: 600 }}>
                        系统信息 (System)
                    </Typography>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: 'calc(100% - 32px)',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            User-Agent
                        </Typography>
                        <Box
                            sx={{
                                p: 1.5,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                borderRadius: 1,
                                fontFamily: 'Fira Code, monospace',
                                fontSize: '0.75rem',
                                wordBreak: 'break-all',
                                maxHeight: '100px',
                                overflowY: 'auto'
                            }}
                        >
                            {data.userAgent}
                        </Box>
                        <Button
                            variant="text"
                            size="small"
                            startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                            onClick={() => copyToClipboard(data.userAgent)}
                            sx={{ mt: 1, fontSize: '0.7rem' }}
                        >
                            复制 UA
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Alert severity="info" variant="outlined" sx={{ borderStyle: 'dashed' }}>
                    <Typography variant="caption" color="text.secondary">
                        <strong>说明：</strong>
                        1. 局域网 IP 获取依赖 WebRTC 技术，部分浏览器或网络环境可能出于安全考虑拦截此行为。<br />
                        2. 代理/VPN 检测结果仅供参考，基于 IP 数据库识别已知出口。<br />
                        3. DNS 解析器反映了您的域名查询最终到达出口的节点地址。
                    </Typography>
                </Alert>
            </Box>

            {/* 修复指南弹窗 */}
            <Dialog
                open={showFixDialog}
                onClose={() => setShowFixDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon color="primary" /> 如何授权获取局域网 IP？
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" paragraph>
                        现代浏览器（如 Chrome）为了隐私保护，默认会通过 mDNS 屏蔽真实的局域网 IP。如果您需要使用此功能，可以尝试以下操作：
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        方案一：临时媒体授权 (推荐)
                    </Typography>
                    <Typography variant="body2" paragraph color="text.secondary">
                        点击卡片中的“点击授权并重试”，并在浏览器弹出的提示中选择“允许（麦克风）”。这会临时提升 WebRTC 的权限以获取真实 IP。
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        方案二：修改浏览器配置 (永久生效)
                    </Typography>
                    <Box component="ol" sx={{ pl: 2, '& li': { mb: 1, fontSize: '0.85rem' } }}>
                        <li>
                            在 Chrome 浏览器地址栏输入：
                            <Box sx={{ my: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1, fontFamily: 'monospace' }}>
                                chrome://flags/#enable-webrtc-hide-local-ips-with-mdns
                            </Box>
                        </li>
                        <li>将该项设置为 <strong>Disabled</strong>。</li>
                        <li>点击右下角的 <strong>Relaunch</strong> 重启浏览器。</li>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFixDialog(false)}>知道了</Button>
                    <Button variant="contained" onClick={() => { setShowFixDialog(false); handleGrantAndRetry(); }}>
                        再次尝试授权
                    </Button>
                </DialogActions>
            </Dialog>
        </ToolCard>
    );
}

export default IpQuery;

