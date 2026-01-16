import React, { useState, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    Chip,
    useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import ToolCard from '../../components/ToolCard';

/**
 * Cron 字段定义
 */
const cronFields = [
    { id: 'minute', label: '分钟', min: 0, max: 59, options: ['*', '*/5', '*/10', '*/15', '*/30', '0', '30'] },
    { id: 'hour', label: '小时', min: 0, max: 23, options: ['*', '*/2', '*/4', '*/6', '*/12', '0', '8', '12', '18'] },
    { id: 'dayOfMonth', label: '日期', min: 1, max: 31, options: ['*', '1', '15', '1,15', 'L'] },
    { id: 'month', label: '月份', min: 1, max: 12, options: ['*', '1', '3', '6', '9', '12', '1-6', '7-12'] },
    { id: 'dayOfWeek', label: '星期', min: 0, max: 6, options: ['*', '0', '1-5', '6,0', '1', '2', '3', '4', '5'] },
];

/**
 * 常用 Cron 表达式预设
 */
const presets = [
    { label: '每分钟', cron: '* * * * *' },
    { label: '每 5 分钟', cron: '*/5 * * * *' },
    { label: '每 15 分钟', cron: '*/15 * * * *' },
    { label: '每 30 分钟', cron: '*/30 * * * *' },
    { label: '每小时', cron: '0 * * * *' },
    { label: '每 2 小时', cron: '0 */2 * * *' },
    { label: '每天凌晨', cron: '0 0 * * *' },
    { label: '每天早上 8 点', cron: '0 8 * * *' },
    { label: '每天中午 12 点', cron: '0 12 * * *' },
    { label: '每天晚上 6 点', cron: '0 18 * * *' },
    { label: '工作日 9 点', cron: '0 9 * * 1-5' },
    { label: '每周一凌晨', cron: '0 0 * * 1' },
    { label: '每月 1 号凌晨', cron: '0 0 1 * *' },
    { label: '每月 1 号和 15 号', cron: '0 0 1,15 * *' },
];

/**
 * 星期名称映射
 */
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 月份名称映射
 */
const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

/**
 * Cron 表达式生成器
 * 
 * 功能：
 * - 可视化配置 Cron 表达式
 * - 常用预设快速选择
 * - 人类可读的描述
 */
function CronGenerator() {
    const theme = useTheme();

    // 状态管理
    const [values, setValues] = useState({
        minute: '0',
        hour: '*',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*',
    });

    /**
     * 生成 Cron 表达式
     */
    const cronExpression = useMemo(() => {
        return `${values.minute} ${values.hour} ${values.dayOfMonth} ${values.month} ${values.dayOfWeek}`;
    }, [values]);

    /**
     * 解析 Cron 表达式为人类可读描述
     */
    const description = useMemo(() => {
        const { minute, hour, dayOfMonth, month, dayOfWeek } = values;
        const parts = [];

        // 分钟
        if (minute === '*') {
            parts.push('每分钟');
        } else if (minute.startsWith('*/')) {
            parts.push(`每 ${minute.slice(2)} 分钟`);
        } else if (minute === '0') {
            // 整点
        } else {
            parts.push(`在第 ${minute} 分钟`);
        }

        // 小时
        if (hour === '*') {
            if (minute !== '*' && !minute.startsWith('*/')) {
                parts.push('每小时');
            }
        } else if (hour.startsWith('*/')) {
            parts.push(`每 ${hour.slice(2)} 小时`);
        } else {
            parts.push(`${hour} 点`);
        }

        // 日期
        if (dayOfMonth !== '*') {
            if (dayOfMonth === 'L') {
                parts.push('每月最后一天');
            } else if (dayOfMonth.includes(',')) {
                parts.push(`每月 ${dayOfMonth} 日`);
            } else {
                parts.push(`每月 ${dayOfMonth} 日`);
            }
        }

        // 月份
        if (month !== '*') {
            if (month.includes('-')) {
                const [start, end] = month.split('-');
                parts.push(`${monthNames[parseInt(start)]}到${monthNames[parseInt(end)]}`);
            } else if (month.includes(',')) {
                parts.push(`${month.split(',').map(m => monthNames[parseInt(m)]).join('、')}`);
            } else {
                parts.push(`${monthNames[parseInt(month)]}`);
            }
        }

        // 星期
        if (dayOfWeek !== '*') {
            if (dayOfWeek === '1-5') {
                parts.push('工作日');
            } else if (dayOfWeek === '6,0' || dayOfWeek === '0,6') {
                parts.push('周末');
            } else if (dayOfWeek.includes('-')) {
                const [start, end] = dayOfWeek.split('-');
                parts.push(`${dayNames[parseInt(start)]}到${dayNames[parseInt(end)]}`);
            } else if (dayOfWeek.includes(',')) {
                parts.push(`${dayOfWeek.split(',').map(d => dayNames[parseInt(d)]).join('、')}`);
            } else {
                parts.push(`${dayNames[parseInt(dayOfWeek)]}`);
            }
        }

        return parts.join(' ') || '每分钟执行';
    }, [values]);

    /**
     * 更新字段值
     */
    const handleFieldChange = (field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));
    };

    /**
     * 应用预设
     */
    const applyPreset = (cron) => {
        const parts = cron.split(' ');
        setValues({
            minute: parts[0] || '*',
            hour: parts[1] || '*',
            dayOfMonth: parts[2] || '*',
            month: parts[3] || '*',
            dayOfWeek: parts[4] || '*',
        });
    };

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(cronExpression);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    return (
        <ToolCard
            title="Cron 表达式生成器"
            description="可视化生成和解析 Cron 表达式，支持常用调度预设"
            showToolbar={false}
        >
            <Grid container spacing={3}>
                {/* Cron 表达式显示 */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            borderRadius: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Cron 表达式
                            </Typography>
                            <Tooltip title="复制">
                                <IconButton size="small" sx={{ color: '#fff' }} onClick={copyToClipboard}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography
                            variant="h4"
                            fontWeight={600}
                            sx={{ fontFamily: 'Fira Code, monospace', letterSpacing: 2 }}
                        >
                            {cronExpression}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                            📅 {description}
                        </Typography>
                    </Paper>
                </Grid>

                {/* 常用预设 */}
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
                            常用预设
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {presets.map((preset) => (
                                <Chip
                                    key={preset.cron}
                                    label={preset.label}
                                    onClick={() => applyPreset(preset.cron)}
                                    variant={cronExpression === preset.cron ? 'filled' : 'outlined'}
                                    color={cronExpression === preset.cron ? 'primary' : 'default'}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* 字段配置 */}
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
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            自定义配置
                        </Typography>

                        <Grid container spacing={2}>
                            {cronFields.map((field) => (
                                <Grid item xs={12} sm={6} md={2.4} key={field.id}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>{field.label}</InputLabel>
                                        <Select
                                            value={values[field.id]}
                                            label={field.label}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        >
                                            {field.options.map((opt) => (
                                                <MenuItem key={opt} value={opt}>
                                                    {opt}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={values[field.id]}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={`${field.min}-${field.max}`}
                                        sx={{ mt: 1, '& input': { fontFamily: 'Fira Code, monospace' } }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* 语法参考 */}
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
                            Cron 语法参考
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'Fira Code, monospace',
                                mb: 2,
                                p: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: 1,
                            }}
                        >
                            ┌───────────── 分钟 (0 - 59)<br />
                            │ ┌───────────── 小时 (0 - 23)<br />
                            │ │ ┌───────────── 日期 (1 - 31)<br />
                            │ │ │ ┌───────────── 月份 (1 - 12)<br />
                            │ │ │ │ ┌───────────── 星期 (0 - 6，0=周日)<br />
                            * * * * *
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>*</strong> - 任意值
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>,</strong> - 多个值 (1,3,5)
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>-</strong> - 范围 (1-5)
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>/</strong> - 步长 (*/5)
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default CronGenerator;
