import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    IconButton,
    Tooltip,
    Chip,
    Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ToolCard from '../../components/ToolCard';
import DateTimePickerInput from '../../components/DateTimePickerInput';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 常用时区列表
 */
const timezones = [
    { value: 'Asia/Shanghai', label: '中国标准时间 (CST, UTC+8)' },
    { value: 'Asia/Tokyo', label: '日本标准时间 (JST, UTC+9)' },
    { value: 'Asia/Singapore', label: '新加坡时间 (SGT, UTC+8)' },
    { value: 'America/New_York', label: '美国东部时间 (EST, UTC-5)' },
    { value: 'America/Los_Angeles', label: '美国太平洋时间 (PST, UTC-8)' },
    { value: 'Europe/London', label: '英国时间 (GMT, UTC+0)' },
    { value: 'Europe/Paris', label: '欧洲中部时间 (CET, UTC+1)' },
    { value: 'UTC', label: 'UTC 协调世界时' },
];

/**
 * 时间戳精度定义
 */
const PRECISION_CONFIG = {
    seconds: { digits: 10, label: '秒 (s)', unit: '秒', color: 'primary' },
    milliseconds: { digits: 13, label: '毫秒 (ms)', unit: '毫秒', color: 'success' },
    microseconds: { digits: 16, label: '微秒 (μs)', unit: '微秒', color: 'warning' },
    nanoseconds: { digits: 19, label: '纳秒 (ns)', unit: '纳秒', color: 'error' },
};

/**
 * 自动检测时间戳精度
 */
const detectPrecision = (ts) => {
    const len = String(ts).length;
    if (len <= 10) return 'seconds';
    if (len <= 13) return 'milliseconds';
    if (len <= 16) return 'microseconds';
    return 'nanoseconds';
};

/**
 * 将任意精度时间戳转换为毫秒
 */
const toMilliseconds = (ts, precision) => {
    const num = Number(ts);
    switch (precision) {
        case 'seconds': return num * 1000;
        case 'milliseconds': return num;
        case 'microseconds': return num / 1000;
        case 'nanoseconds': return num / 1000000;
        default: return num;
    }
};

/**
 * 时间戳转换工具
 * 
 * 功能：
 * - Unix 时间戳 ↔ 人类可读时间
 * - 支持多种时间戳精度（秒/毫秒/微秒/纳秒）
 * - 自动识别时间戳精度
 * - 多种时间格式输出
 * - 时区选择
 */
function TimestampConverter() {
    const theme = useTheme();

    // 状态管理
    const [timestamp, setTimestamp] = useState('');
    const [datetimeValue, setDatetimeValue] = useState(null); // dayjs 对象
    const [selectedTimezone, setSelectedTimezone] = useState('Asia/Shanghai');
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [detectedPrecision, setDetectedPrecision] = useState(null);
    const [formats, setFormats] = useState({});
    const [allFormats, setAllFormats] = useState(null); // 所有精度的时间戳

    /**
     * 更新当前时间（每秒刷新）
     */
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    /**
     * 获取相对时间描述
     */
    const getRelativeTime = (date) => {
        const now = dayjs();
        const diffSeconds = now.diff(date, 'second');
        const diffMinutes = now.diff(date, 'minute');
        const diffHours = now.diff(date, 'hour');
        const diffDays = now.diff(date, 'day');

        if (Math.abs(diffSeconds) < 60) return `${Math.abs(diffSeconds)} 秒${diffSeconds > 0 ? '前' : '后'}`;
        if (Math.abs(diffMinutes) < 60) return `${Math.abs(diffMinutes)} 分钟${diffMinutes > 0 ? '前' : '后'}`;
        if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} 小时${diffHours > 0 ? '前' : '后'}`;
        return `${Math.abs(diffDays)} 天${diffDays > 0 ? '前' : '后'}`;
    };

    /**
     * 更新多种格式输出
     */
    const updateFormats = useCallback((ts) => {
        if (!ts || isNaN(ts)) {
            setFormats({});
            setAllFormats(null);
            setDetectedPrecision(null);
            return;
        }

        const precision = detectPrecision(ts);
        setDetectedPrecision(precision);

        const ms = toMilliseconds(ts, precision);
        const date = dayjs(ms);
        const dateInTz = date.tz(selectedTimezone);

        // 基本格式
        setFormats({
            local: dateInTz.format('YYYY-MM-DD HH:mm:ss'),
            iso8601: dateInTz.toISOString(),
            rfc2822: dateInTz.format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            relative: getRelativeTime(date),
        });

        // 所有精度的时间戳
        const unixSeconds = Math.floor(date.valueOf() / 1000);
        setAllFormats({
            seconds: {
                value: unixSeconds,
                label: '秒级时间戳',
                digits: '10 位',
                description: 'Unix Timestamp (seconds)',
            },
            milliseconds: {
                value: date.valueOf(),
                label: '毫秒级时间戳',
                digits: '13 位',
                description: 'Unix Timestamp (milliseconds)',
            },
            microseconds: {
                value: date.valueOf() * 1000,
                label: '微秒级时间戳',
                digits: '16 位',
                description: 'Unix Timestamp (microseconds)',
            },
            nanoseconds: {
                value: BigInt(date.valueOf()) * BigInt(1000000),
                label: '纳秒级时间戳',
                digits: '19 位',
                description: 'Unix Timestamp (nanoseconds)',
            },
        });
    }, [selectedTimezone]);

    /**
     * 时间戳转日期时间
     */
    const handleTimestampChange = (e) => {
        const value = e.target.value.trim();
        setTimestamp(value);

        if (value && !isNaN(value)) {
            const precision = detectPrecision(value);
            const ms = toMilliseconds(value, precision);
            const date = dayjs(ms);
            setDatetimeValue(date);
            updateFormats(value);
        } else {
            setDatetimeValue(null);
            setFormats({});
            setAllFormats(null);
            setDetectedPrecision(null);
        }
    };

    /**
     * 日期时间转时间戳
     */
    const handleDatetimeChange = (dayjsValue) => {
        setDatetimeValue(dayjsValue);

        if (dayjsValue && dayjsValue.isValid()) {
            const ts = dayjsValue.unix();
            setTimestamp(String(ts));
            updateFormats(String(ts));
        } else {
            setTimestamp('');
            setFormats({});
            setAllFormats(null);
            setDetectedPrecision(null);
        }
    };

    /**
     * 获取当前时间戳
     */
    const handleGetNow = () => {
        const now = dayjs();
        const ts = now.unix();
        setTimestamp(String(ts));
        setDatetimeValue(now);
        updateFormats(String(ts));
    };

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(String(text));
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    return (
        <ToolCard
            title="时间戳转换"
            description="支持秒(10位)/毫秒(13位)/微秒(16位)/纳秒(19位)多种精度，自动识别并转换"
            showToolbar={false}
        >
            <Grid container spacing={3}>
                {/* 当前时间卡片 */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            borderRadius: 3,
                        }}
                    >
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                            当前时间 ({timezones.find(tz => tz.value === selectedTimezone)?.label.split(' ')[0]})
                        </Typography>
                        <Typography variant="h4" fontWeight={600} sx={{ fontFamily: 'Fira Code, monospace' }}>
                            {currentTime.tz(selectedTimezone).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>秒 (10位)</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'Fira Code, monospace' }}>
                                    {currentTime.unix()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>毫秒 (13位)</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'Fira Code, monospace' }}>
                                    {currentTime.valueOf()}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 转换区域 */}
                <Grid item xs={12} md={5}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                时间戳输入
                            </Typography>
                            {detectedPrecision && (
                                <Chip
                                    label={`已识别: ${PRECISION_CONFIG[detectedPrecision].label}`}
                                    color={PRECISION_CONFIG[detectedPrecision].color}
                                    size="small"
                                />
                            )}
                        </Box>
                        <TextField
                            fullWidth
                            label="Unix 时间戳"
                            placeholder="支持 10/13/16/19 位时间戳"
                            value={timestamp}
                            onChange={handleTimestampChange}
                            variant="outlined"
                            sx={{ mb: 2 }}
                            helperText="自动识别精度：10位=秒，13位=毫秒，16位=微秒，19位=纳秒"
                        />
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleGetNow}
                            fullWidth
                        >
                            获取当前时间戳
                        </Button>
                    </Paper>
                </Grid>

                {/* 转换符号 */}
                <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <SwapHorizIcon color="primary" />
                    </Box>
                </Grid>

                {/* 日期时间输入 */}
                <Grid item xs={12} md={5}>
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
                            日期时间输入
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <DateTimePickerInput
                                value={datetimeValue}
                                onChange={handleDatetimeChange}
                                label="日期时间"
                            />
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>时区</InputLabel>
                            <Select
                                value={selectedTimezone}
                                label="时区"
                                onChange={(e) => {
                                    setSelectedTimezone(e.target.value);
                                    if (timestamp) updateFormats(timestamp);
                                }}
                            >
                                {timezones.map((tz) => (
                                    <MenuItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>
                </Grid>

                {/* 多精度时间戳输出 */}
                {allFormats && (
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
                                🕐 多精度时间戳
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                以下是同一时间点在不同精度下的时间戳表示，可直接复制使用
                            </Alert>
                            <Grid container spacing={2}>
                                {Object.entries(allFormats).map(([key, item]) => (
                                    <Grid item xs={12} sm={6} key={key}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {item.label}
                                                    </Typography>
                                                    <Chip
                                                        label={item.digits}
                                                        size="small"
                                                        color={PRECISION_CONFIG[key].color}
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontFamily: 'Fira Code, monospace',
                                                        fontWeight: 500,
                                                        wordBreak: 'break-all',
                                                    }}
                                                >
                                                    {String(item.value)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                            <Tooltip title="复制">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyToClipboard(item.value)}
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

                {/* 格式化输出 */}
                {Object.keys(formats).length > 0 && (
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
                                📅 日期时间格式
                            </Typography>
                            <Grid container spacing={2}>
                                {[
                                    { label: '本地时间', value: formats.local, desc: 'YYYY-MM-DD HH:mm:ss' },
                                    { label: 'ISO 8601', value: formats.iso8601, desc: '国际标准格式' },
                                    { label: 'RFC 2822', value: formats.rfc2822, desc: '邮件/HTTP 标准' },
                                    { label: '相对时间', value: formats.relative, desc: '距离当前时间' },
                                ].map((item) => (
                                    <Grid item xs={12} sm={6} key={item.label}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1.5,
                                                borderRadius: 1.5,
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.label} ({item.desc})
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    sx={{ fontFamily: 'Fira Code, monospace' }}
                                                >
                                                    {item.value}
                                                </Typography>
                                            </Box>
                                            <Tooltip title="复制">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyToClipboard(item.value)}
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

export default TimestampConverter;

