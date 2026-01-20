import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Chip,
    useTheme,
    Alert,
    Divider,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    InputAdornment,
    IconButton,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import InfoIcon from '@mui/icons-material/Info';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CryptoJS from 'crypto-js';

import ToolCard from '../../components/ToolCard';

/**
 * Base64URL 解码，转换为普通 Base64 后解码
 */
function decodeBase64Url(str) {
    // Base64URL 转 Base64：替换 - 为 +，_ 为 /
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    const padding = base64.length % 4;
    if (padding) {
        base64 += '='.repeat(4 - padding);
    }
    // 解码
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0));
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

/**
 * 普通字符串编码为 Base64URL
 */
function encodeBase64Url(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    let base64 = btoa(binString);
    // Base64 转 Base64URL
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 格式化 JSON 为美化的字符串
 */
function formatJson(obj) {
    return JSON.stringify(obj, null, 2);
}

/**
 * 解析 JWT 时间戳字段，转换为可读时间
 */
function formatTimestamp(ts) {
    if (typeof ts !== 'number') return null;
    const date = new Date(ts * 1000);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

/**
 * 检查 token 是否过期
 */
function isExpired(exp) {
    if (typeof exp !== 'number') return null;
    return Date.now() > exp * 1000;
}

/**
 * 计算剩余或过期时间
 */
function getTimeStatus(exp) {
    if (typeof exp !== 'number') return null;
    const now = Date.now();
    const expTime = exp * 1000;
    const diff = expTime - now;

    if (diff <= 0) {
        const elapsed = Math.abs(diff);
        if (elapsed < 60000) return `已过期 ${Math.floor(elapsed / 1000)} 秒`;
        if (elapsed < 3600000) return `已过期 ${Math.floor(elapsed / 60000)} 分钟`;
        if (elapsed < 86400000) return `已过期 ${Math.floor(elapsed / 3600000)} 小时`;
        return `已过期 ${Math.floor(elapsed / 86400000)} 天`;
    } else {
        if (diff < 60000) return `剩余 ${Math.floor(diff / 1000)} 秒`;
        if (diff < 3600000) return `剩余 ${Math.floor(diff / 60000)} 分钟`;
        if (diff < 86400000) return `剩余 ${Math.floor(diff / 3600000)} 小时`;
        return `剩余 ${Math.floor(diff / 86400000)} 天`;
    }
}

/**
 * 使用 HMAC 签名生成 JWT
 */
function signJwt(header, payload, secret, algorithm) {
    const headerBase64 = encodeBase64Url(JSON.stringify(header));
    const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
    const message = `${headerBase64}.${payloadBase64}`;

    let signature;
    switch (algorithm) {
        case 'HS256':
            signature = CryptoJS.HmacSHA256(message, secret);
            break;
        case 'HS384':
            signature = CryptoJS.HmacSHA384(message, secret);
            break;
        case 'HS512':
            signature = CryptoJS.HmacSHA512(message, secret);
            break;
        default:
            throw new Error(`不支持的算法: ${algorithm}`);
    }

    // 将 CryptoJS 的 WordArray 转换为 Base64URL
    const signatureBase64 = CryptoJS.enc.Base64.stringify(signature)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${message}.${signatureBase64}`;
}

/**
 * 默认 Header
 */
const defaultHeader = {
    alg: 'HS256',
    typ: 'JWT',
};

/**
 * 默认 Payload 模板
 */
const defaultPayload = {
    sub: '1234567890',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
};

/**
 * JWT 加解密工具
 *
 * 功能：
 * - 解码：解析 JWT Token 的 Header、Payload、Signature
 * - 编码：使用 Header、Payload 和密钥生成 JWT Token
 */
function JwtTool() {
    const theme = useTheme();

    // 模式：encode（编码/生成）或 decode（解码/解析）
    const [mode, setMode] = useState('decode');

    // ========== 解码模式状态 ==========
    const [token, setToken] = useState('');
    const [decodeError, setDecodeError] = useState(null);

    // ========== 编码模式状态 ==========
    const [headerJson, setHeaderJson] = useState(formatJson(defaultHeader));
    const [payloadJson, setPayloadJson] = useState(formatJson(defaultPayload));
    const [secret, setSecret] = useState('your-256-bit-secret');
    const [showSecret, setShowSecret] = useState(false);
    const [algorithm, setAlgorithm] = useState('HS256');
    const [generatedToken, setGeneratedToken] = useState('');
    const [encodeError, setEncodeError] = useState(null);

    /**
     * 解析 JWT Token
     */
    const parseJwt = useCallback((jwtToken) => {
        if (!jwtToken.trim()) {
            return null;
        }

        const parts = jwtToken.trim().split('.');
        if (parts.length !== 3) {
            throw new Error('无效的 JWT 格式：必须包含三个部分（header.payload.signature）');
        }

        try {
            const header = JSON.parse(decodeBase64Url(parts[0]));
            const payload = JSON.parse(decodeBase64Url(parts[1]));
            const signature = parts[2];

            return { header, payload, signature };
        } catch (err) {
            throw new Error('解析失败：' + err.message);
        }
    }, []);

    /**
     * 解码模式 - 解析结果
     */
    const parsedResult = useMemo(() => {
        if (mode !== 'decode') return null;
        try {
            const result = parseJwt(token);
            setDecodeError(null);
            return result;
        } catch (err) {
            if (token.trim()) {
                setDecodeError(err.message);
            }
            return null;
        }
    }, [token, parseJwt, mode]);

    /**
     * 编码模式 - 生成 JWT
     */
    const generateToken = useCallback(() => {
        try {
            const header = JSON.parse(headerJson);
            const payload = JSON.parse(payloadJson);

            // 确保 header 中的 alg 与选择的算法一致
            header.alg = algorithm;

            const jwt = signJwt(header, payload, secret, algorithm);
            setGeneratedToken(jwt);
            setEncodeError(null);
        } catch (err) {
            setEncodeError('生成失败：' + err.message);
            setGeneratedToken('');
        }
    }, [headerJson, payloadJson, secret, algorithm]);

    /**
     * 当编码模式参数改变时，自动重新生成
     */
    useEffect(() => {
        if (mode === 'encode') {
            generateToken();
        }
    }, [mode, headerJson, payloadJson, secret, algorithm, generateToken]);

    /**
     * 同步算法选择到 Header JSON
     */
    const handleAlgorithmChange = (e) => {
        const newAlg = e.target.value;
        setAlgorithm(newAlg);
        try {
            const header = JSON.parse(headerJson);
            header.alg = newAlg;
            setHeaderJson(formatJson(header));
        } catch {
            // 忽略解析错误
        }
    };

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

    /**
     * 清空解码输入
     */
    const handleClearDecode = () => {
        setToken('');
        setDecodeError(null);
    };

    /**
     * 清空编码输入
     */
    const handleClearEncode = () => {
        setHeaderJson(formatJson(defaultHeader));
        setPayloadJson(formatJson(defaultPayload));
        setSecret('your-256-bit-secret');
        setGeneratedToken('');
        setEncodeError(null);
    };

    /**
     * 从剪贴板粘贴
     */
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setToken(text);
            setDecodeError(null);
        } catch {
            setDecodeError('无法读取剪贴板');
        }
    };

    /**
     * 复制生成的 Token
     */
    const handleCopyToken = async () => {
        if (generatedToken) {
            await navigator.clipboard.writeText(generatedToken);
        }
    };

    /**
     * 添加当前时间戳到 Payload
     */
    const handleAddTimestamp = (field) => {
        try {
            const payload = JSON.parse(payloadJson);
            const now = Math.floor(Date.now() / 1000);
            if (field === 'iat') {
                payload.iat = now;
            } else if (field === 'exp') {
                payload.exp = now + 3600; // 1小时后
            }
            setPayloadJson(formatJson(payload));
        } catch {
            // 忽略
        }
    };

    // 工具栏按钮配置
    const actions = mode === 'decode' ? [
        {
            label: 'Paste',
            icon: <ContentPasteIcon fontSize="small" />,
            onClick: handlePaste,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClearDecode,
        },
    ] : [
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClearEncode,
        },
    ];

    /**
     * 渲染 Payload 字段说明
     */
    const renderClaimInfo = (key, value) => {
        const claimDescriptions = {
            iss: '签发者 (Issuer)',
            sub: '主题 (Subject)',
            aud: '接收方 (Audience)',
            exp: '过期时间 (Expiration)',
            nbf: '生效时间 (Not Before)',
            iat: '签发时间 (Issued At)',
            jti: 'JWT ID',
        };

        const desc = claimDescriptions[key];
        const isTimeField = ['exp', 'nbf', 'iat'].includes(key);

        return (
            <Box key={key} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: 'Fira Code, monospace',
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                        }}
                    >
                        {key}
                    </Typography>
                    {desc && (
                        <Tooltip title={desc} arrow>
                            <InfoIcon
                                fontSize="small"
                                sx={{
                                    fontSize: 14,
                                    color: theme.palette.text.disabled,
                                    cursor: 'help',
                                }}
                            />
                        </Tooltip>
                    )}
                    {key === 'exp' && (
                        <Chip
                            size="small"
                            icon={isExpired(value) ? <ErrorIcon /> : <CheckCircleIcon />}
                            label={isExpired(value) ? '已过期' : '有效'}
                            color={isExpired(value) ? 'error' : 'success'}
                            sx={{ height: 20, fontSize: 11 }}
                        />
                    )}
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        fontFamily: 'Fira Code, monospace',
                        color: theme.palette.text.secondary,
                        wordBreak: 'break-all',
                    }}
                >
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    {isTimeField && typeof value === 'number' && (
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{
                                ml: 1,
                                color: theme.palette.info.main,
                                fontSize: 12,
                            }}
                        >
                            ({formatTimestamp(value)})
                        </Typography>
                    )}
                </Typography>
                {key === 'exp' && typeof value === 'number' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
                        <Typography
                            variant="caption"
                            sx={{
                                color: isExpired(value)
                                    ? theme.palette.error.main
                                    : theme.palette.success.main,
                            }}
                        >
                            {getTimeStatus(value)}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    /**
     * 渲染可复制的 JSON 区域
     */
    const renderJsonSection = (title, content, colorHint) => (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
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
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: colorHint,
                    }}
                />
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {title}
                </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography
                    component="pre"
                    sx={{
                        fontFamily: 'Fira Code, monospace',
                        fontSize: 13,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: theme.palette.text.primary,
                    }}
                >
                    {content}
                </Typography>
            </Box>
        </Paper>
    );

    /**
     * 渲染编码模式的输入区域
     */
    const renderEncodeInputSection = (title, value, onChange, colorHint, placeholder) => (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
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
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: colorHint,
                    }}
                />
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {title}
                </Typography>
            </Box>
            <TextField
                fullWidth
                multiline
                rows={6}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                variant="standard"
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        p: 2,
                        fontFamily: 'Fira Code, monospace',
                        fontSize: '13px',
                    },
                }}
            />
        </Paper>
    );

    return (
        <ToolCard
            title="JWT 加解密工具"
            description="解析或生成 JSON Web Token，支持 HS256/HS384/HS512 算法"
            actions={actions}
            copyContent={mode === 'decode' ? (parsedResult ? formatJson(parsedResult.payload) : '') : generatedToken}
        >
            {/* 模式切换 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="JWT 模式"
                >
                    <ToggleButton value="decode" aria-label="解码">
                        <LockOpenIcon sx={{ mr: 1 }} fontSize="small" />
                        解码 (Decode)
                    </ToggleButton>
                    <ToggleButton value="encode" aria-label="编码">
                        <LockIcon sx={{ mr: 1 }} fontSize="small" />
                        编码 (Encode)
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* ========== 解码模式 ========== */}
            {mode === 'decode' && (
                <>
                    {/* 输入区域 */}
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 3,
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
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <KeyIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                JWT Token
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={token}
                            onChange={(e) => { setToken(e.target.value); setDecodeError(null); }}
                            placeholder="粘贴 JWT Token，例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
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

                    {/* 错误提示 */}
                    {decodeError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {decodeError}
                        </Alert>
                    )}

                    {/* 解析结果 */}
                    {parsedResult && (
                        <Grid container spacing={3}>
                            {/* 左侧：结构化显示 */}
                            <Grid item xs={12} md={6}>
                                {renderJsonSection('Header（头部）', formatJson(parsedResult.header), '#E74C3C')}
                                {renderJsonSection('Payload（负载）', formatJson(parsedResult.payload), '#9B59B6')}

                                {/* Signature */}
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
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: '#3498DB',
                                            }}
                                        />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            Signature（签名）
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: 'Fira Code, monospace',
                                                fontSize: 13,
                                                wordBreak: 'break-all',
                                                color: theme.palette.text.primary,
                                            }}
                                        >
                                            {parsedResult.signature}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                mt: 1,
                                                color: theme.palette.text.disabled,
                                            }}
                                        >
                                            ⚠️ 签名验证需要密钥，此工具仅解析不验证
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* 右侧：字段详情 */}
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
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            📋 Payload 字段详情
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        {Object.entries(parsedResult.payload).map(([key, value]) =>
                                            renderClaimInfo(key, value)
                                        )}
                                        {Object.keys(parsedResult.payload).length === 0 && (
                                            <Typography
                                                variant="body2"
                                                color="text.disabled"
                                                sx={{ fontStyle: 'italic' }}
                                            >
                                                Payload 为空
                                            </Typography>
                                        )}
                                    </Box>

                                    <Divider />

                                    {/* Header 信息 */}
                                    <Box sx={{ p: 2 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={500}
                                            color="text.secondary"
                                            sx={{ mb: 1.5 }}
                                        >
                                            🔧 Header 信息
                                        </Typography>
                                        {parsedResult.header.alg && (
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: 'Fira Code, monospace' }}
                                                >
                                                    算法：
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={parsedResult.header.alg}
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontFamily: 'Fira Code, monospace' }}
                                                />
                                            </Box>
                                        )}
                                        {parsedResult.header.typ && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: 'Fira Code, monospace' }}
                                                >
                                                    类型：
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={parsedResult.header.typ}
                                                    variant="outlined"
                                                    sx={{ fontFamily: 'Fira Code, monospace' }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </>
            )}

            {/* ========== 编码模式 ========== */}
            {mode === 'encode' && (
                <>
                    <Grid container spacing={3}>
                        {/* 左侧：输入 */}
                        <Grid item xs={12} md={6}>
                            {/* 算法选择 */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>签名算法</InputLabel>
                                <Select
                                    value={algorithm}
                                    label="签名算法"
                                    onChange={handleAlgorithmChange}
                                >
                                    <MenuItem value="HS256">HS256 (HMAC + SHA-256)</MenuItem>
                                    <MenuItem value="HS384">HS384 (HMAC + SHA-384)</MenuItem>
                                    <MenuItem value="HS512">HS512 (HMAC + SHA-512)</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Header */}
                            {renderEncodeInputSection(
                                'Header（头部）',
                                headerJson,
                                setHeaderJson,
                                '#E74C3C',
                                '输入 Header JSON...'
                            )}

                            {/* Payload */}
                            <Paper
                                elevation={0}
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    mb: 2,
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
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: '#9B59B6',
                                            }}
                                        />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            Payload（负载）
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="设置 iat 为当前时间" arrow>
                                            <Button
                                                size="small"
                                                onClick={() => handleAddTimestamp('iat')}
                                                sx={{ minWidth: 'auto', px: 1 }}
                                            >
                                                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                iat
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="设置 exp 为 1 小时后" arrow>
                                            <Button
                                                size="small"
                                                onClick={() => handleAddTimestamp('exp')}
                                                sx={{ minWidth: 'auto', px: 1 }}
                                            >
                                                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                exp
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    value={payloadJson}
                                    onChange={(e) => setPayloadJson(e.target.value)}
                                    placeholder="输入 Payload JSON..."
                                    variant="standard"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: {
                                            p: 2,
                                            fontFamily: 'Fira Code, monospace',
                                            fontSize: '13px',
                                        },
                                    }}
                                />
                            </Paper>

                            {/* 密钥 */}
                            <TextField
                                fullWidth
                                label="密钥 (Secret)"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                type={showSecret ? 'text' : 'password'}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowSecret(!showSecret)}
                                                edge="end"
                                            >
                                                {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { fontFamily: 'Fira Code, monospace' },
                                }}
                            />
                        </Grid>

                        {/* 右侧：输出 */}
                        <Grid item xs={12} md={6}>
                            {/* 错误提示 */}
                            {encodeError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {encodeError}
                                </Alert>
                            )}

                            {/* 生成的 Token */}
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
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <KeyIcon fontSize="small" color="success" />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            生成的 JWT Token
                                        </Typography>
                                    </Box>
                                    <Tooltip title="复制 Token" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={handleCopyToken}
                                            disabled={!generatedToken}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Box sx={{ p: 2, minHeight: 200 }}>
                                    {generatedToken ? (
                                        <Typography
                                            sx={{
                                                fontFamily: 'Fira Code, monospace',
                                                fontSize: 13,
                                                wordBreak: 'break-all',
                                                color: theme.palette.text.primary,
                                            }}
                                        >
                                            {generatedToken}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            color="text.disabled"
                                            sx={{ fontStyle: 'italic' }}
                                        >
                                            输入有效的 Header 和 Payload JSON 后将自动生成 Token
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>

                            {/* Token 结构预览 */}
                            {generatedToken && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        🔍 Token 结构（点击颜色块可复制对应部分）
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Chip
                                            size="small"
                                            label="Header"
                                            sx={{
                                                backgroundColor: '#E74C3C',
                                                color: '#fff',
                                                fontFamily: 'Fira Code, monospace',
                                            }}
                                        />
                                        <Typography variant="body2" color="text.disabled">.</Typography>
                                        <Chip
                                            size="small"
                                            label="Payload"
                                            sx={{
                                                backgroundColor: '#9B59B6',
                                                color: '#fff',
                                                fontFamily: 'Fira Code, monospace',
                                            }}
                                        />
                                        <Typography variant="body2" color="text.disabled">.</Typography>
                                        <Chip
                                            size="small"
                                            label="Signature"
                                            sx={{
                                                backgroundColor: '#3498DB',
                                                color: '#fff',
                                                fontFamily: 'Fira Code, monospace',
                                            }}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </>
            )}

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>JWT (JSON Web Token) 是一种紧凑的、URL 安全的令牌格式，
                    由三部分组成：Header（头部）、Payload（负载）和 Signature（签名），用 "." 分隔。
                    {mode === 'encode' && ' 编码模式支持 HMAC-SHA 系列算法（HS256/HS384/HS512）。'}
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default JwtTool;
