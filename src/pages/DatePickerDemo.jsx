import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    useTheme,
    TextField,
    IconButton,
    Button,
    Tooltip,
    InputAdornment,
    Collapse,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

/**
 * DateTimePicker 演示页面
 * 方案：普通文本输入框 + 内嵌展开选择器
 * - 文本框支持自由光标编辑任意位置
 * - 点击日历图标，选择器在输入框正下方展开
 * - 选择器只有点击确认/取消才关闭
 * - 两者双向联动
 */
function DatePickerDemo() {
    const theme = useTheme();

    // 文本输入框的值
    const [textValue, setTextValue] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    // 选择器的值
    const [pickerValue, setPickerValue] = useState(dayjs());
    // 选择器是否展开
    const [expanded, setExpanded] = useState(false);
    // 临时选择值（未确认的值）
    const [tempValue, setTempValue] = useState(dayjs());
    // 输入错误状态
    const [inputError, setInputError] = useState(null);

    /**
     * 日期格式正则验证
     */
    const isValidDateFormat = (str) => {
        // 支持的格式: YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DD HH:mm 或 YYYY-MM-DD
        const patterns = [
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
            /^\d{4}-\d{2}-\d{2}$/,
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/,
            /^\d{4}\/\d{2}\/\d{2}$/,
        ];
        return patterns.some(p => p.test(str));
    };

    /**
     * 文本输入框变化 - 支持自由编辑
     */
    const handleTextChange = (e) => {
        const value = e.target.value;
        setTextValue(value);

        // 空值不报错
        if (!value.trim()) {
            setInputError(null);
            return;
        }

        // 格式验证
        if (!isValidDateFormat(value)) {
            setInputError('格式错误，请使用 YYYY-MM-DD HH:mm:ss');
            return;
        }

        // 尝试解析输入的日期
        const parsed = dayjs(value);
        if (parsed.isValid()) {
            setInputError(null);
            setPickerValue(parsed);
            // 如果选择器已展开，同步更新选择器显示的值
            if (expanded) {
                setTempValue(parsed);
            }
        } else {
            setInputError('无效的日期时间');
        }
    };

    /**
     * 打开/切换选择器
     */
    const handleTogglePicker = () => {
        if (!expanded) {
            setTempValue(pickerValue);
        }
        setExpanded(!expanded);
    };

    /**
     * 确认选择
     */
    const handleConfirm = () => {
        setPickerValue(tempValue);
        setTextValue(tempValue.format('YYYY-MM-DD HH:mm:ss'));
        setExpanded(false);
    };

    /**
     * 取消选择
     */
    const handleCancel = () => {
        setExpanded(false);
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
                日期时间输入演示
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    maxWidth: 500,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    💡 <strong>两种输入方式：</strong><br />
                    1. 直接在输入框中编辑任意位置的字符<br />
                    2. 点击日历图标打开选择器，选好后点击「确认」
                </Typography>

                {/* 文本输入框 + 日历按钮 */}
                <TextField
                    fullWidth
                    label="日期时间"
                    value={textValue}
                    onChange={handleTextChange}
                    placeholder="如: 2024-01-15 10:30:00"
                    error={!!inputError}
                    helperText={inputError || '格式: YYYY-MM-DD HH:mm:ss'}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={expanded ? "关闭选择器" : "打开日期选择器"}>
                                    <IconButton onClick={handleTogglePicker} edge="end">
                                        {expanded ? <CloseIcon /> : <CalendarMonthIcon />}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* 日期时间选择器 - 直接在输入框下方展开 */}
                <Collapse in={expanded}>
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
                            <StaticDateTimePicker
                                value={tempValue}
                                onChange={(newValue) => setTempValue(newValue)}
                                ampm={false}
                                views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                                slotProps={{
                                    actionBar: { actions: [] },
                                }}
                            />
                        </LocalizationProvider>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2, pt: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button size="small" onClick={handleCancel}>取消</Button>
                            <Button size="small" variant="contained" onClick={handleConfirm}>确认</Button>
                        </Box>
                    </Paper>
                </Collapse>

                {/* 时间戳显示 */}
                {pickerValue.isValid() && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            对应的时间戳：
                        </Typography>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                            {pickerValue.unix()}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

export default DatePickerDemo;
