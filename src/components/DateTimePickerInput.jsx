import React, { useState } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Button,
    Tooltip,
    InputAdornment,
    Collapse,
    Paper,
    useTheme,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

/**
 * 日期时间格式正则验证
 */
const isValidDateFormat = (str) => {
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
 * 日期时间输入组件
 * 
 * 功能：
 * - 支持文本框直接输入日期时间（可编辑任意位置）
 * - 支持点击图标展开日期时间选择器
 * - 输入框与选择器双向联动
 * - 格式验证与错误提示
 * - 选择器包含秒选择
 * 
 * @param {Object} props
 * @param {dayjs} props.value - 当前日期时间值（dayjs 对象）
 * @param {function} props.onChange - 值变化回调 (dayjsValue) => void
 * @param {string} props.label - 输入框标签
 * @param {string} props.format - 日期格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @param {boolean} props.fullWidth - 是否全宽
 * @param {boolean} props.disabled - 是否禁用
 */
function DateTimePickerInput({
    value,
    onChange,
    label = '日期时间',
    format = 'YYYY-MM-DD HH:mm:ss',
    fullWidth = true,
    disabled = false,
}) {
    const theme = useTheme();

    // 文本输入框的值
    const [textValue, setTextValue] = useState(value ? value.format(format) : '');
    // 选择器是否展开
    const [expanded, setExpanded] = useState(false);
    // 临时选择值（未确认的值）
    const [tempValue, setTempValue] = useState(value || dayjs());
    // 输入错误状态
    const [inputError, setInputError] = useState(null);

    /**
     * 同步外部 value 变化到内部状态
     */
    React.useEffect(() => {
        if (value && value.isValid()) {
            setTextValue(value.format(format));
            setTempValue(value);
        }
    }, [value, format]);

    /**
     * 文本输入框变化
     */
    const handleTextChange = (e) => {
        const inputValue = e.target.value;
        setTextValue(inputValue);

        // 空值不报错
        if (!inputValue.trim()) {
            setInputError(null);
            return;
        }

        // 格式验证
        if (!isValidDateFormat(inputValue)) {
            setInputError('格式错误，请使用 YYYY-MM-DD HH:mm:ss');
            return;
        }

        // 尝试解析输入的日期
        const parsed = dayjs(inputValue);
        if (parsed.isValid()) {
            setInputError(null);
            onChange?.(parsed);
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
            // 打开选择器时，设置临时值
            const initialValue = value || dayjs();
            setTempValue(initialValue);
            // 如果输入框为空，自动填充当前时间
            if (!textValue.trim()) {
                setTextValue(initialValue.format(format));
                onChange?.(initialValue);
            }
        }
        setExpanded(!expanded);
    };

    /**
     * 确认选择
     */
    const handleConfirm = () => {
        if (tempValue && tempValue.isValid()) {
            setTextValue(tempValue.format(format));
            onChange?.(tempValue);
            setInputError(null);
        }
        setExpanded(false);
    };

    /**
     * 取消选择
     */
    const handleCancel = () => {
        setExpanded(false);
    };

    return (
        <Box>
            {/* 文本输入框 + 日历按钮 */}
            <TextField
                fullWidth={fullWidth}
                label={label}
                value={textValue}
                onChange={handleTextChange}
                placeholder="如: 2024-01-15 10:30:00"
                error={!!inputError}
                helperText={inputError || '格式: YYYY-MM-DD HH:mm:ss'}
                disabled={disabled}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Tooltip title={expanded ? "关闭选择器" : "打开日期选择器"}>
                                <IconButton
                                    onClick={handleTogglePicker}
                                    edge="end"
                                    disabled={disabled}
                                >
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
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        p: 2,
                        pt: 0,
                        borderTop: `1px solid ${theme.palette.divider}`
                    }}>
                        <Button size="small" onClick={handleCancel}>取消</Button>
                        <Button size="small" variant="contained" onClick={handleConfirm}>确认</Button>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}

export default DateTimePickerInput;
