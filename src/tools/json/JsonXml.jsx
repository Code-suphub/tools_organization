import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, FormControlLabel, Checkbox } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * JSON ↔ XML 转换工具
 * 
 * 功能：
 * - 实时 JSON 转 XML
 * - 实时 XML 转 JSON
 * - 一键交换输入输出
 * - 语法高亮显示
 * - 可配置选项（缩进、属性前缀等）
 */
function JsonXml() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('json2xml'); // 'json2xml' | 'xml2json'
    const [copied, setCopied] = useState(false);

    // 配置选项
    const [options, setOptions] = useState({
        indent: true,           // 是否格式化缩进
        ignoreAttributes: false, // 是否忽略 XML 属性
        preserveOrder: false,    // 是否保持顺序
    });

    /**
     * XML 解析器配置
     */
    const xmlParser = new XMLParser({
        ignoreAttributes: options.ignoreAttributes,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        preserveOrder: options.preserveOrder,
        trimValues: true,
    });

    /**
     * XML 构建器配置
     */
    const xmlBuilder = new XMLBuilder({
        ignoreAttributes: options.ignoreAttributes,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: options.indent,
        indentBy: '  ',
        suppressEmptyNode: true,
    });

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
            if (mode === 'json2xml') {
                // JSON → XML
                const parsed = JSON.parse(input);
                // 如果 JSON 是数组或没有根元素，添加一个默认根元素
                let dataToConvert = parsed;
                const needsRoot = Array.isArray(parsed) || Object.keys(parsed).length > 1;
                if (needsRoot) {
                    dataToConvert = { root: parsed };
                }
                const result = xmlBuilder.build(dataToConvert);
                // 添加 XML 声明
                const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
                setOutput(xmlDeclaration + result);
                setError(null);
            } else {
                // XML → JSON
                const parsed = xmlParser.parse(input);
                const result = JSON.stringify(parsed, null, options.indent ? 2 : 0);
                setOutput(result);
                setError(null);
            }
        } catch (err) {
            const errorType = mode === 'json2xml' ? 'JSON' : 'XML';
            setError(`${errorType} 语法错误: ${err.message}`);
            setOutput('');
        }
    }, [input, mode, options]);

    /**
     * 切换模式
     */
    const handleModeChange = (_, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            // 切换模式时，清空内容以避免混淆
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
     * 将输出内容设置为输入，并切换转换方向
     */
    const handleSwap = useCallback(() => {
        if (!output.trim()) return;

        // 移除 XML 声明（如果有）
        let newInput = output;
        if (mode === 'json2xml') {
            newInput = output.replace(/^<\?xml[^?]*\?>\s*/i, '');
        }

        setInput(newInput);
        setMode(prevMode => prevMode === 'json2xml' ? 'xml2json' : 'json2xml');
    }, [output, mode]);

    /**
     * 清空所有内容
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
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
    const inputLanguage = mode === 'json2xml' ? 'json' : 'xml';
    const outputLanguage = mode === 'json2xml' ? 'xml' : 'json';

    // 输入占位符
    const inputPlaceholder = mode === 'json2xml'
        ? `在此粘贴或输入 JSON，例如：
{
  "user": {
    "name": "张三",
    "age": 28,
    "email": "zhangsan@example.com"
  }
}`
        : `在此粘贴或输入 XML，例如：
<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>张三</name>
  <age>28</age>
  <email>zhangsan@example.com</email>
</user>`;

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
            title="JSON ↔ XML"
            description="JSON 与 XML 格式实时互转，支持语法高亮"
            actions={actions}
            copyContent={output}
        >
            {/* 模式切换和选项 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="转换模式"
                        size="small"
                    >
                        <ToggleButton value="json2xml" aria-label="JSON 转 XML">
                            JSON → XML
                        </ToggleButton>
                        <ToggleButton value="xml2json" aria-label="XML 转 JSON">
                            XML → JSON
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

                {/* 选项 */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.indent}
                                onChange={handleOptionChange('indent')}
                                size="small"
                            />
                        }
                        label={<Typography variant="body2">格式化缩进</Typography>}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={options.ignoreAttributes}
                                onChange={handleOptionChange('ignoreAttributes')}
                                size="small"
                            />
                        }
                        label={<Typography variant="body2">忽略 XML 属性</Typography>}
                    />
                </Box>
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
                                输入 ({inputLanguage.toUpperCase()})
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language={inputLanguage}
                            placeholder={inputPlaceholder}
                            height="400px"
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
                                输出 ({outputLanguage.toUpperCase()})
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
                            placeholder={`输入 ${inputLanguage.toUpperCase()} 后将实时显示 ${outputLanguage.toUpperCase()} 结果...`}
                            height="400px"
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
                    <li>JSON → XML：将 JSON 数据转换为 XML 格式，自动添加 XML 声明</li>
                    <li>XML → JSON：将 XML 格式转换为 JSON 对象</li>
                    <li>XML 属性会以 <code>@_</code> 前缀保存到 JSON 中</li>
                    <li>点击 <SwapHorizIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> 可快速交换输入输出内容</li>
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default JsonXml;
