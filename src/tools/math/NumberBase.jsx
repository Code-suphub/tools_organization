import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import ToolCard from '../../components/ToolCard';

/**
 * 支持的进制列表
 */
const bases = [
    { id: '10', label: '十进制 (Decimal)', prefix: '' },
    { id: '2', label: '二进制 (Binary)', prefix: '0b' },
    { id: '8', label: '八进制 (Octal)', prefix: '0o' },
    { id: '16', label: '十六进制 (Hexadecimal)', prefix: '0x' },
    { id: '32', label: '三十二进制 (Base32)', prefix: '' }, // 简单实现 parseInt(val, 32)
];

/**
 * 进制转换工具
 */
function NumberBase() {
    const theme = useTheme();

    // 核心状态：存储当前数值的十进制 BigInt 形式（为了支持大数，虽然 JS Number 有限制，但 BigInt 更好）
    // 但为了简化 input 处理，我们直接存储各进制的字符串状态，以最后一次修改的为准来更新其他
    // 这里简化处理：以 state 存储各进制字符串，用 handleChange 触发更新

    const [values, setValues] = useState({
        '10': '',
        '2': '',
        '8': '',
        '16': '',
        '32': '',
    });

    const updateValues = (value, fromBase) => {
        // 空值处理
        if (!value.trim()) {
            setValues({ '10': '', '2': '', '8': '', '16': '', '32': '' });
            return;
        }

        try {
            // 这里的 value 应该是去掉了 prefix 的纯数字字符串
            // 使用 BigInt 进行转换以支持大整数
            // 注意 BigInt 不支持 base 32 解析，且 toString(radix) 也不支持 radix > 36 的标准 BigInt
            // 这里如果为了通用性，先用 BigInt 尝试

            let bigVal;

            // 处理输入前缀 (0x, 0b 等通常由用户手动删或不输, 这里假设传入的是纯值)
            // 但标准 BigInt 构造函数不支持 radix 参数，需手动解析
            // 为简化，暂只支持 Native Number 范围内的精确转换，或者使用 BigInt 但仅限标准方法

            // 自定义 parseBigInt 
            // 实际上 JS BigInt 构造函数只接受十进制字符串或 0x 等前缀
            // 所以非 10 进制需先转 10 进制

            const parseBigInt = (str, base) => {
                const chunk = 10; // 分块处理防止溢出（简单版直接用 BigInt 包装，如果 base <= 36）
                // BigInt 不支持直接 parse(string, radix)。
                // 简单起见，我们使用 JS 内置 parseInt，这会限制在大数精度。
                // 如果要完美支持 BigInt 任意进制转换需要写大数算法。
                // 鉴于这是一个通用工具，我们先用 BigInt( prefix + str ) 的方式（仅支持 2, 8, 10, 16）

                if (base === 10) return BigInt(str);
                if (base === 2) return BigInt('0b' + str);
                if (base === 8) return BigInt('0o' + str);
                if (base === 16) return BigInt('0x' + str);

                // 对于 32 进制等，BigInt 原生不支持，回退到 parseInt (会有精度丢失)
                return BigInt(parseInt(str, base));
            };

            bigVal = parseBigInt(value, parseInt(fromBase));

            const newValues = {};
            bases.forEach(b => {
                const radix = parseInt(b.id);
                newValues[b.id] = bigVal.toString(radix).toUpperCase();
            });

            setValues(newValues);

        } catch (e) {
            // 转换失败（输入非法字符等），只更新当前输入框，其他清空或保持
            // 最好是只更新当前输入框
            setValues(prev => ({
                ...prev,
                [fromBase]: value, // 保留用户非法输入以便修改
            }));
        }
    };

    const handleChange = (id, val) => {
        // 允许输入，尝试转换
        setValues(prev => ({ ...prev, [id]: val }));
        updateValues(val, parseInt(id));
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

    return (
        <ToolCard
            title="进制转换"
            description="在二进制、八进制、十进制、十六进制等之间实时转换数值"
            showToolbar={false}
        >
            <Grid container spacing={3}>
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
                        <Grid container spacing={3}>
                            {bases.map((base) => (
                                <Grid item xs={12} key={base.id}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {base.label}
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={values[base.id]}
                                            onChange={(e) => handleChange(base.id, e.target.value)}
                                            placeholder={`输入${base.id}进制数...`}
                                            InputProps={{
                                                startAdornment: base.prefix ? (
                                                    <Typography color="text.secondary" sx={{ mr: 1, fontFamily: 'Fira Code, monospace' }}>
                                                        {base.prefix}
                                                    </Typography>
                                                ) : null,
                                                endAdornment: (
                                                    <Tooltip title="复制">
                                                        <IconButton onClick={() => copyToClipboard(values[base.id])} edge="end">
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ),
                                                sx: { fontFamily: 'Fira Code, monospace' }
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        支持大整数转换。对于非 2/8/10/16 进制（如 32 进制），受限于 JavaScript 精度，超大数值可能不准确。
                    </Alert>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default NumberBase;
