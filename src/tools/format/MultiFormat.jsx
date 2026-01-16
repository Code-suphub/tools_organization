import React, { useState, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, Alert, Tabs, Tab } from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { html as beautifyHtml, css as beautifyCss, js as beautifyJs } from 'js-beautify';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * 格式化类型配置
 */
const formatTypes = [
    { id: 'html', label: 'HTML', language: 'html' },
    { id: 'css', label: 'CSS', language: 'css' },
    { id: 'javascript', label: 'JavaScript', language: 'javascript' },
    { id: 'xml', label: 'XML', language: 'xml' },
];

/**
 * 多格式化工具
 * 
 * 功能：
 * - HTML 格式化/压缩
 * - CSS 格式化/压缩
 * - JavaScript 格式化/压缩
 * - XML 格式化/压缩
 */
function MultiFormat() {
    const theme = useTheme();

    // 状态管理
    const [activeTab, setActiveTab] = useState(0);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);

    const currentType = formatTypes[activeTab];

    /**
     * 格式化代码
     */
    const handleFormat = useCallback(() => {
        if (!input.trim()) {
            setError('请输入要格式化的代码');
            return;
        }

        try {
            let result = '';
            const options = {
                indent_size: 2,
                indent_char: ' ',
                max_preserve_newlines: 2,
                preserve_newlines: true,
                wrap_line_length: 0,
            };

            switch (currentType.id) {
                case 'html':
                case 'xml':
                    result = beautifyHtml(input, {
                        ...options,
                        indent_inner_html: true,
                        unformatted: [],
                        content_unformatted: ['pre', 'code'],
                    });
                    break;
                case 'css':
                    result = beautifyCss(input, {
                        ...options,
                        selector_separator_newline: true,
                        newline_between_rules: true,
                    });
                    break;
                case 'javascript':
                    result = beautifyJs(input, {
                        ...options,
                        space_in_empty_paren: false,
                        brace_style: 'collapse',
                    });
                    break;
                default:
                    result = input;
            }

            setOutput(result);
            setError(null);
        } catch (err) {
            setError('格式化失败: ' + err.message);
            setOutput('');
        }
    }, [input, currentType]);

    /**
     * 压缩代码
     */
    const handleMinify = useCallback(() => {
        if (!input.trim()) {
            setError('请输入要压缩的代码');
            return;
        }

        try {
            let result = input;

            switch (currentType.id) {
                case 'html':
                case 'xml':
                    // 移除注释、多余空格
                    result = result.replace(/<!--[\s\S]*?-->/g, ''); // 移除注释
                    result = result.replace(/>\s+</g, '><'); // 移除标签间空白
                    result = result.replace(/\s+/g, ' '); // 多空格变单空格
                    result = result.trim();
                    break;
                case 'css':
                    result = result.replace(/\/\*[\s\S]*?\*\//g, ''); // 移除注释
                    result = result.replace(/\s+/g, ' '); // 多空格变单空格
                    result = result.replace(/\s*([{}:;,])\s*/g, '$1'); // 移除符号周围空格
                    result = result.replace(/;}/g, '}'); // 移除最后的分号
                    result = result.trim();
                    break;
                case 'javascript':
                    // 简单压缩（不是完整的 minifier）
                    result = result.replace(/\/\/.*$/gm, ''); // 移除单行注释
                    result = result.replace(/\/\*[\s\S]*?\*\//g, ''); // 移除多行注释
                    result = result.replace(/\s+/g, ' '); // 多空格变单空格
                    result = result.replace(/\s*([{}();,:])\s*/g, '$1'); // 移除符号周围空格
                    result = result.trim();
                    break;
                default:
                    result = result.replace(/\s+/g, ' ').trim();
            }

            setOutput(result);
            setError(null);
        } catch (err) {
            setError('压缩失败: ' + err.message);
            setOutput('');
        }
    }, [input, currentType]);

    /**
     * 清空
     */
    const handleClear = useCallback(() => {
        setInput('');
        setOutput('');
        setError(null);
    }, []);

    /**
     * 切换标签
     */
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setInput('');
        setOutput('');
        setError(null);
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Format',
            icon: <FormatAlignLeftIcon fontSize="small" />,
            onClick: handleFormat,
        },
        {
            label: 'Minify',
            icon: <CompressIcon fontSize="small" />,
            onClick: handleMinify,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    // 占位符文本
    const placeholders = {
        html: '<div class="container"><h1>Hello World</h1><p>This is a paragraph.</p></div>',
        css: '.container{display:flex;justify-content:center;align-items:center;height:100vh;}',
        javascript: 'function hello(name){const greeting="Hello, "+name+"!";console.log(greeting);return greeting;}',
        xml: '<?xml version="1.0"?><root><item id="1"><name>Test</name><value>123</value></item></root>',
    };

    return (
        <ToolCard
            title="代码格式化"
            description={`美化和压缩 ${currentType.label} 代码，提高代码可读性`}
            actions={actions}
            copyContent={output}
        >
            {/* 类型选择 */}
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                    mb: 2,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                }}
            >
                {formatTypes.map((type) => (
                    <Tab key={type.id} label={type.label} />
                ))}
            </Tabs>

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
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输入 {currentType.label}
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language={currentType.language}
                            placeholder={`输入 ${currentType.label} 代码，例如：\n${placeholders[currentType.id]}`}
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
                            }}
                        >
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                输出结果
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={output}
                            language={currentType.language}
                            placeholder="格式化后的代码将显示在这里..."
                            height="400px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default MultiFormat;
