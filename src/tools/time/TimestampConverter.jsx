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
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ToolCard from '../../components/ToolCard';

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
 * 时间戳转换工具
 * 
 * 功能：
 * - Unix 时间戳 ↔ 人类可读时间
 * - 多种时间格式输出
 * - 时区选择
 * - 实时当前时间显示
 */
function TimestampConverter() {
    const theme = useTheme();

    // 状态管理
    const [timestamp, setTimestamp] = useState('');
    const [datetime, setDatetime] = useState('');
    const [selectedTimezone, setSelectedTimezone] = useState('Asia/Shanghai');
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [formats, setFormats] = useState({});

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
     * 更新多种格式输出
     */
    const updateFormats = useCallback((ts) => {
        if (!ts || isNaN(ts)) {
            setFormats({});
            return;
        }

        // 处理秒级和毫秒级时间戳
        const tsNumber = Number(ts);
        const isMilliseconds = String(ts).length > 10;
        const date = isMilliseconds ? dayjs(tsNumber) : dayjs.unix(tsNumber);
        const dateInTz = date.tz(selectedTimezone);

        setFormats({
            local: dateInTz.format('YYYY-MM-DD HH:mm:ss'),
            iso8601: dateInTz.toISOString(),
            rfc2822: dateInTz.format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            relative: getRelativeTime(date),
            unix: date.unix(),
            unixMs: date.valueOf(),
        });
    }, [selectedTimezone]);

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
     * 时间戳转日期时间
     */
    const handleTimestampChange = (e) => {
        const value = e.target.value;
        setTimestamp(value);

        if (value && !isNaN(value)) {
            const tsNumber = Number(value);
            const isMilliseconds = value.length > 10;
            const date = isMilliseconds ? dayjs(tsNumber) : dayjs.unix(tsNumber);
            setDatetime(date.tz(selectedTimezone).format('YYYY-MM-DDTHH:mm:ss'));
            updateFormats(value);
        } else {
            setDatetime('');
            setFormats({});
        }
    };

    /**
     * 日期时间转时间戳
     */
    const handleDatetimeChange = (e) => {
        const value = e.target.value;
        setDatetime(value);

        if (value) {
            try {
                const date = dayjs.tz(value, selectedTimezone);
                if (date.isValid()) {
                    const ts = date.unix();
                    setTimestamp(String(ts));
                    updateFormats(String(ts));
                }
            } catch (err) {
                // 忽略无效日期
            }
        } else {
            setTimestamp('');
            setFormats({});
        }
    };

    /**
     * 获取当前时间戳
     */
    const handleGetNow = () => {
        const now = dayjs();
        const ts = now.unix();
        setTimestamp(String(ts));
        setDatetime(now.tz(selectedTimezone).format('YYYY-MM-DDTHH:mm:ss'));
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
            description="Unix 时间戳与人类可读时间格式互相转换，支持多种格式和时区"
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
                            当前时间
                        </Typography>
                        <Typography variant="h4" fontWeight={600} sx={{ fontFamily: 'Fira Code, monospace' }}>
                            {currentTime.tz(selectedTimezone).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'Fira Code, monospace' }}>
                                Unix: {currentTime.unix()}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                |
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'Fira Code, monospace' }}>
                                毫秒: {currentTime.valueOf()}
                            </Typography>
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
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            时间戳输入
                        </Typography>
                        <TextField
                            fullWidth
                            label="Unix 时间戳"
                            placeholder="例如：1705315200"
                            value={timestamp}
                            onChange={handleTimestampChange}
                            variant="outlined"
                            sx={{ mb: 2 }}
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
                            height: '100%',
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            日期时间输入
                        </Typography>
                        <TextField
                            fullWidth
                            label="日期时间"
                            type="datetime-local"
                            value={datetime}
                            onChange={handleDatetimeChange}
                            variant="outlined"
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
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

                {/* 多格式输出 */}
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
                                格式化输出
                            </Typography>
                            <Grid container spacing={2}>
                                {[
                                    { label: '本地时间', value: formats.local },
                                    { label: 'ISO 8601', value: formats.iso8601 },
                                    { label: 'RFC 2822', value: formats.rfc2822 },
                                    { label: '相对时间', value: formats.relative },
                                    { label: 'Unix 时间戳（秒）', value: formats.unix },
                                    { label: 'Unix 时间戳（毫秒）', value: formats.unixMs },
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
                                                    {item.label}
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
