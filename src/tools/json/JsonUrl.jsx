import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, FormControlLabel, Checkbox, TextField } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON ↔ URL 参数转换工具
 * 
 * 功能：
 * - 实时 JSON 转 URL 查询参数
 * - 实时 URL 查询参数转 JSON
 * - 一键交换输入输出
 * - 支持嵌套对象和数组展开
 */
function JsonUrl() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('json2url'); // 'json2url' | 'url2json'
    const [copied, setCopied] = useState(false);

    // 配置选项
    const [options, setOptions] = useState({
        encodeValues: true,     // 是否对值进行 URL 编码
        includePrefix: true,    // 是否包含 ? 前缀
        flattenArrays: true,    // 是否展开数组为多个同名参数
    });

    // 可选的基础 URL
    const [baseUrl, setBaseUrl] = useState('');

    /**
     * 将 JSON 对象转换为 URL 查询参数
     * @param {Object} obj - JSON 对象
     * @param {string} prefix - 键前缀（用于嵌套对象）
     * @returns {string} URL 查询字符串
     */
    const jsonToUrlParams = (obj, prefix = '') => {
        const params = [];

        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}[${key}]` : key;

            if (value === null || value === undefined) {
                // 跳过 null 和 undefined
                continue;
            } else if (Array.isArray(value)) {
                // 处理数组
                if (options.flattenArrays) {
                    // 展开数组为多个同名参数
                    value.forEach((item, index) => {
                        if (typeof item === 'object' && item !== null) {
                            params.push(jsonToUrlParams(item, `${fullKey}[${index}]`));
                        } else {
                            const encodedValue = options.encodeValues
                                ? encodeURIComponent(String(item))
                                : String(item);
                            params.push(`${fullKey}[]=${encodedValue}`);
                        }
                    });
                } else {
                    // 将数组序列化为 JSON 字符串
                    const encodedValue = options.encodeValues
                        ? encodeURIComponent(JSON.stringify(value))
                        : JSON.stringify(value);
                    params.push(`${fullKey}=${encodedValue}`);
                }
            } else if (typeof value === 'object') {
                // 递归处理嵌套对象
                params.push(jsonToUrlParams(value, fullKey));
            } else {
                // 处理基本类型
                const encodedValue = options.encodeValues
                    ? encodeURIComponent(String(value))
                    : String(value);
                params.push(`${fullKey}=${encodedValue}`);
            }
        }

        return params.filter(p => p).join('&');
    };

    /**
     * 将 URL 查询参数转换为 JSON 对象
     * @param {string} queryString - URL 查询字符串
     * @returns {Object} JSON 对象
     */
    const urlParamsToJson = (queryString) => {
        // 移除开头的 ? 和 URL 部分
        let query = queryString.trim();

        // 尝试从完整 URL 中提取查询参数
        if (query.includes('://')) {
            const url = new URL(query);
            query = url.search.substring(1);
        } else if (query.startsWith('?')) {
            query = query.substring(1);
        }

        if (!query) {
            return {};
        }

        const result = {};
        const pairs = query.split('&');

        for (const pair of pairs) {
            const [key, ...valueParts] = pair.split('=');
            const value = valueParts.join('='); // 处理值中包含 = 的情况

            if (!key) continue;

            const decodedKey = decodeURIComponent(key);
            let decodedValue = value ? decodeURIComponent(value) : '';

            // 尝试解析 JSON 值
            try {
                if (decodedValue.startsWith('{') || decodedValue.startsWith('[')) {
                    decodedValue = JSON.parse(decodedValue);
                } else if (decodedValue === 'true') {
                    decodedValue = true;
                } else if (decodedValue === 'false') {
                    decodedValue = false;
                } else if (decodedValue === 'null') {
                    decodedValue = null;
                } else if (!isNaN(decodedValue) && decodedValue !== '') {
                    decodedValue = Number(decodedValue);
                }
            } catch {
                // 保持原始字符串值
            }

            // 处理嵌套键（如 user[name] 或 items[]）
            const keyMatch = decodedKey.match(/^([^\[]+)(.*)$/);
            if (keyMatch) {
                const baseKey = keyMatch[1];
                const nestedPart = keyMatch[2];

                if (nestedPart === '[]') {
                    // 数组形式的键
                    if (!result[baseKey]) result[baseKey] = [];
                    result[baseKey].push(decodedValue);
                } else if (nestedPart) {
                    // 嵌套对象形式的键
                    const nestedKeys = nestedPart.match(/\[([^\]]*)\]/g);
                    if (nestedKeys) {
                        let current = result;
                        let fullPath = [baseKey, ...nestedKeys.map(k => k.slice(1, -1))];

                        for (let i = 0; i < fullPath.length - 1; i++) {
                            const k = fullPath[i];
                            const nextK = fullPath[i + 1];
                            if (!current[k]) {
                                current[k] = nextK === '' || !isNaN(Number(nextK)) ? [] : {};
                            }
                            current = current[k];
                        }

                        const lastKey = fullPath[fullPath.length - 1];
                        if (lastKey === '' && Array.isArray(current)) {
                            current.push(decodedValue);
                        } else {
                            current[lastKey] = decodedValue;
                        }
                    }
                } else {
                    // 简单键
                    if (result[baseKey] !== undefined) {
                        // 如果键已存在，转换为数组
                        if (!Array.isArray(result[baseKey])) {
                            result[baseKey] = [result[baseKey]];
                        }
                        result[baseKey].push(decodedValue);
                    } else {
                        result[baseKey] = decodedValue;
                    }
                }
            }
        }

        return result;
    };

    /**
     * 实时转换
     */
    useEffect(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            if (mode === 'json2url') {
                // JSON → URL 参数
                const parsed = JSON.parse(input);
                let result = jsonToUrlParams(parsed);

                // 添加前缀和基础 URL
                if (result) {
                    if (baseUrl.trim()) {
                        const separator = baseUrl.includes('?') ? '&' : '?';
                        result = baseUrl.trim() + separator + result;
                    } else if (options.includePrefix) {
                        result = '?' + result;
                    }
                }

                setOutput(result);
                setError(null);
            } else {
                // URL 参数 → JSON
                const parsed = urlParamsToJson(input);
                const result = JSON.stringify(parsed, null, 2);
                setOutput(result);
                setError(null);
            }
        } catch (err) {
            const errorType = mode === 'json2url' ? 'JSON' : 'URL 参数';
            setError(`${errorType} 解析错误: ${err.message}`);
            setOutput('');
        }
    }, [input, mode, options, baseUrl]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            setInput('');
            setOutput('');
            setError(null);
        }
    };

    /**
     * 切换选项
     */
    const handleOptionChange = (option) => (event) => {
        setOptions(prev => ({
            ...prev,
            [option]: event.target.checked,
        }));
    };

    /**
     * 交换输入和输出
     */
    const handleSwap = useCallback(() => {
        if (!output.trim()) return;

        setInput(output);
        setMode(prevMode => prevMode === 'json2url' ? 'url2json' : 'json2url');
    }, [output]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
        setBaseUrl('');
    }, []);

    /**
     * 复制输出内容
     */
    const handleCopy = useCallback(async () => {
        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }, [output]);

    // 获取输入和输出的语言类型
    const inputLanguage = mode === 'json2url' ? 'json' : 'javascript';
    const outputLanguage = mode === 'json2url' ? 'javascript' : 'json';

    // 输入占位符
    const inputPlaceholder = mode === 'json2url'
        ? `在此粘贴或输入 JSON，例如：
{
  "name": "张三",
  "age": 28,
  "tags": ["开发", "设计"],
  "active": true
}`
        : `在此粘贴 URL 或查询参数，例如：
?name=%E5%BC%A0%E4%B8%89&age=28&tags[]=%E5%BC%80%E5%8F%91&tags[]=%E8%AE%BE%E8%AE%A1&active=true

或完整 URL：
https://example.com/api?name=zhangsan&page=1`;

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    return (
        <ToolCard
            title="JSON ↔ URL 参数"
            description="JSON 对象与 URL 查询参数实时互转"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换和选项 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="转换模式"
                        size="small"
                    >
                        <ToggleButton value="json2url" aria-label="JSON 转 URL 参数">
                            JSON → URL
                        </ToggleButton>
                        <ToggleButton value="url2json" aria-label="URL 参数转 JSON">
                            URL → JSON
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* 交换按钮 */}
                    <Tooltip title="交换输入输出">
                        <IconButton
                            onClick={handleSwap}
                            disabled={!output.trim()}
                            size="small"
                            sx={{
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.04)',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.12)'
                                        : 'rgba(0,0,0,0.08)',
                                },
                            }}
                        >
                            <SwapHorizIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* 选项 - 仅在 JSON → URL 模式显示 */}
                {mode === 'json2url' && (
                    <>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={options.encodeValues}
                                        onChange={handleOptionChange('encodeValues')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">URL 编码值</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={options.includePrefix}
                                        onChange={handleOptionChange('includePrefix')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">包含 ? 前缀</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={options.flattenArrays}
                                        onChange={handleOptionChange('flattenArrays')}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">展开数组</Typography>}
                            />
                        </Box>

                        {/* 基础 URL 输入 */}
                        <TextField
                            size="small"
                            placeholder="可选：输入基础 URL，如 https://example.com/api"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            sx={{
                                width: '100%',
                                maxWidth: 500,
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                }
                            }}
                        />
                    </>
                )}
            </Box>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 双栏编辑器 */}
            <Grid container spacing={2}>
                {/* 输入区域 */}
                <Grid item xs={12} md={6}>
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
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输入 ({mode === 'json2url' ? 'JSON' : 'URL'})
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language={inputLanguage}
                            placeholder={inputPlaceholder}
                            height="350px"
                        />
                    </Paper>
                </Grid>

                {/* 输出区域 */}
                <Grid item xs={12} md={6}>
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
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输出 ({mode === 'json2url' ? 'URL 参数' : 'JSON'})
                            </Typography>
                            <Tooltip title={copied ? '已复制!' : '复制'}>
                                <IconButton
                                    onClick={handleCopy}
                                    disabled={!output}
                                    size="small"
                                    color={copied ? 'success' : 'default'}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <CodeEditor
                            value={output}
                            language={outputLanguage}
                            placeholder={`输入${mode === 'json2url' ? ' JSON ' : ' URL '}后将实时显示转换结果...`}
                            height="350px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 功能说明 */}
            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    💡 使用提示
                </Typography>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2, m: 0 }}>
                    <li>JSON → URL：将 JSON 对象转换为 URL 查询字符串，支持嵌套对象和数组</li>
                    <li>URL → JSON：解析 URL 或查询参数为 JSON 对象，自动识别数字、布尔值</li>
                    <li>可选填入基础 URL，将自动拼接生成完整 URL</li>
                    <li>数组默认展开为多个同名参数（如 <code>tags[]=a&tags[]=b</code>）</li>
                    <li>支持解析完整 URL 或仅查询参数部分</li>
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default JsonUrl;
