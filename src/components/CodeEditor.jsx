import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { yaml } from '@codemirror/lang-yaml';
import { Box, useTheme } from '@mui/material';

/**
 * 语言扩展映射
 */
const languageExtensions = {
    json: json,
    javascript: javascript,
    js: javascript,
    sql: sql,
    xml: xml,
    html: html,
    css: css,
    yaml: yaml,
};

/**
 * CodeMirror 代码编辑器封装组件
 * 
 * 功能：
 * - 语法高亮
 * - 主题适配（深色/浅色）
 * - 支持多种语言
 * 
 * @param {Object} props
 * @param {string} props.value - 编辑器内容
 * @param {Function} props.onChange - 内容变化回调
 * @param {string} props.language - 语言类型（json、javascript、sql 等）
 * @param {string} props.placeholder - 占位符文本
 * @param {boolean} props.readOnly - 是否只读
 * @param {string} props.height - 编辑器高度
 * @param {number} props.minHeight - 最小高度
 */
function CodeEditor({
    value = '',
    onChange,
    language = 'json',
    placeholder = '在此输入内容...',
    readOnly = false,
    height = '400px',
    minHeight = 200,
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // 获取语言扩展
    const extensions = useMemo(() => {
        const langFn = languageExtensions[language.toLowerCase()];
        return langFn ? [langFn()] : [];
    }, [language]);

    // 处理内容变化
    const handleChange = (val) => {
        if (onChange) {
            onChange(val);
        }
    };

    return (
        <Box
            className="code-editor-container"
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                '& .cm-editor': {
                    fontSize: '14px',
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                },
                '& .cm-gutters': {
                    backgroundColor: isDark ? '#27272a' : '#fafafa',
                    borderRight: `1px solid ${theme.palette.divider}`,
                },
                '& .cm-activeLineGutter, & .cm-activeLine': {
                    backgroundColor: isDark
                        ? 'rgba(0, 102, 255, 0.1)'
                        : 'rgba(0, 102, 255, 0.05)',
                },
                '& .cm-selectionBackground': {
                    backgroundColor: isDark
                        ? 'rgba(0, 102, 255, 0.3) !important'
                        : 'rgba(0, 102, 255, 0.2) !important',
                },
            }}
        >
            <CodeMirror
                value={value}
                height={height}
                minHeight={`${minHeight}px`}
                extensions={extensions}
                onChange={handleChange}
                placeholder={placeholder}
                readOnly={readOnly}
                theme={isDark ? 'dark' : 'light'}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: false,
                    highlightSelectionMatches: true,
                }}
            />
        </Box>
    );
}

export default CodeEditor;
