import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    Alert,
    Chip,
    Switch,
    FormControlLabel,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * PostgreSQL 到 MySQL 的类型映射
 */
const PG_TO_MYSQL_TYPES = {
    // 自增类型
    'bigserial': { type: 'BIGINT', autoIncrement: true },
    'serial8': { type: 'BIGINT', autoIncrement: true },
    'serial': { type: 'INT', autoIncrement: true },
    'serial4': { type: 'INT', autoIncrement: true },
    'smallserial': { type: 'SMALLINT', autoIncrement: true },
    'serial2': { type: 'SMALLINT', autoIncrement: true },
    // 整数类型
    'bigint': 'BIGINT',
    'int8': 'BIGINT',
    'integer': 'INT',
    'int': 'INT',
    'int4': 'INT',
    'smallint': 'SMALLINT',
    'int2': 'SMALLINT',
    // 浮点类型
    'double precision': 'DOUBLE',
    'float8': 'DOUBLE',
    'real': 'FLOAT',
    'float4': 'FLOAT',
    'numeric': 'DECIMAL',
    'decimal': 'DECIMAL',
    'money': 'DECIMAL(19,2)',
    // 字符串类型
    'character varying': 'VARCHAR',
    'varchar': 'VARCHAR',
    'character': 'CHAR',
    'char': 'CHAR',
    'text': 'TEXT',
    'citext': 'TEXT',
    // JSON 类型
    'json': 'JSON',
    'jsonb': 'JSON',
    // 布尔类型
    'boolean': 'TINYINT(1)',
    'bool': 'TINYINT(1)',
    // 二进制类型
    'bytea': 'LONGBLOB',
    // 时间类型
    'timestamp': 'TIMESTAMP',
    'timestamp without time zone': 'TIMESTAMP',
    'timestamp with time zone': 'TIMESTAMP',
    'timestamptz': 'TIMESTAMP',
    'date': 'DATE',
    'time': 'TIME',
    'time without time zone': 'TIME',
    'time with time zone': 'TIME',
    'timetz': 'TIME',
    'interval': 'VARCHAR(100)',
    // 特殊类型
    'uuid': 'CHAR(36)',
    'inet': 'VARCHAR(45)',
    'cidr': 'VARCHAR(45)',
    'macaddr': 'VARCHAR(17)',
};

/**
 * MySQL 到 PostgreSQL 的类型映射
 */
const MYSQL_TO_PG_TYPES = {
    // 整数类型
    'bigint': 'BIGINT',
    'int': 'INTEGER',
    'integer': 'INTEGER',
    'mediumint': 'INTEGER',
    'smallint': 'SMALLINT',
    'tinyint': 'SMALLINT',
    // 浮点类型
    'double': 'DOUBLE PRECISION',
    'float': 'REAL',
    'decimal': 'DECIMAL',
    'numeric': 'NUMERIC',
    // 字符串类型
    'varchar': 'VARCHAR',
    'char': 'CHAR',
    'tinytext': 'TEXT',
    'text': 'TEXT',
    'mediumtext': 'TEXT',
    'longtext': 'TEXT',
    'enum': 'VARCHAR(255)',
    'set': 'VARCHAR(255)',
    // JSON 类型
    'json': 'JSONB',
    // 布尔类型（MySQL 没有真正的布尔，用 TINYINT(1)）
    // 注意：会在解析时特殊处理
    // 二进制类型
    'binary': 'BYTEA',
    'varbinary': 'BYTEA',
    'tinyblob': 'BYTEA',
    'blob': 'BYTEA',
    'mediumblob': 'BYTEA',
    'longblob': 'BYTEA',
    // 时间类型
    'datetime': 'TIMESTAMP',
    'timestamp': 'TIMESTAMP',
    'date': 'DATE',
    'time': 'TIME',
    'year': 'SMALLINT',
};

/**
 * 解析 PostgreSQL CREATE TABLE 语句
 */
function parsePostgresTable(sql) {
    const result = {
        tableName: '',
        columns: [],
        primaryKeys: [],
        uniqueKeys: [],
        indexes: [],
        tableComment: '',
        columnComments: {},
        warnings: [],
    };

    // 移除 SQL 注释
    let cleanSql = sql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--[^\n]*/g, '');

    // 解析 COMMENT ON 语句
    const tableCommentMatch = sql.match(/COMMENT\s+ON\s+TABLE\s+[\w.]+\s+IS\s+'([^']+)'/i);
    if (tableCommentMatch) {
        result.tableComment = tableCommentMatch[1];
    }

    const columnCommentRegex = /COMMENT\s+ON\s+COLUMN\s+[\w.]+\.(\w+)\s+IS\s+'([^']+)'/gi;
    let match;
    while ((match = columnCommentRegex.exec(sql)) !== null) {
        result.columnComments[match[1]] = match[2];
    }

    // 提取表名
    const tableMatch = cleanSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w]+\.)?["']?(\w+)["']?\s*\(/i);
    if (!tableMatch) {
        throw new Error('无法解析表名，请确保输入的是有效的 CREATE TABLE 语句');
    }
    result.tableName = tableMatch[1];

    // 提取括号内的内容
    const contentMatch = cleanSql.match(/CREATE\s+TABLE[^(]+\(([\s\S]+?)\)(?:\s*;|\s*$|\s+WITH|\s+TABLESPACE)/i);
    if (!contentMatch) {
        throw new Error('无法解析表结构');
    }

    const content = contentMatch[1];

    // 分割各个定义
    const definitions = [];
    let current = '';
    let depth = 0;
    for (const char of content) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
            definitions.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        definitions.push(current.trim());
    }

    // 解析每个定义
    for (const def of definitions) {
        if (!def) continue;

        // PRIMARY KEY
        const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
            const keys = pkMatch[1].split(',').map(k => k.trim().replace(/["`']/g, ''));
            result.primaryKeys.push(...keys);
            continue;
        }

        // UNIQUE
        if (/^UNIQUE/i.test(def) || /UNIQUE\s*\(/i.test(def)) {
            const ukMatch = def.match(/UNIQUE\s*\(([^)]+)\)/i);
            if (ukMatch) {
                const keys = ukMatch[1].split(',').map(k => k.trim().replace(/["`']/g, ''));
                result.uniqueKeys.push(keys);
            }
            continue;
        }

        // CONSTRAINT
        if (/^CONSTRAINT/i.test(def)) {
            result.warnings.push(`跳过约束定义: ${def.substring(0, 50)}...`);
            continue;
        }

        // 解析列定义
        const colNameMatch = def.match(/^["']?(\w+)["']?\s+(.+)$/i);
        if (colNameMatch) {
            const colName = colNameMatch[1];
            let rest = colNameMatch[2].trim();

            // 约束关键词
            const constraintKeywords = /^(NOT|NULL|DEFAULT|PRIMARY|UNIQUE|REFERENCES|CHECK|CONSTRAINT)\b/i;

            let rawType = '';
            let length = null;
            let precision = null;
            let constraints = '';

            // 检查是否有括号
            const parenMatch = rest.match(/^([^(]+)\(([^)]+)\)(.*)$/);
            if (parenMatch) {
                rawType = parenMatch[1].trim().toLowerCase();
                const params = parenMatch[2];
                if (params.includes(',')) {
                    const parts = params.split(',');
                    length = parts[0].trim();
                    precision = parts[1].trim();
                } else {
                    length = params.trim();
                }
                constraints = parenMatch[3].trim();
            } else {
                const parts = rest.split(/\s+/);
                const typeParts = [];
                let foundConstraint = false;

                for (let i = 0; i < parts.length; i++) {
                    if (constraintKeywords.test(parts[i])) {
                        constraints = parts.slice(i).join(' ');
                        foundConstraint = true;
                        break;
                    }
                    typeParts.push(parts[i]);
                }

                rawType = typeParts.join(' ').trim().toLowerCase();
            }

            // 检查是否为 SERIAL 类型
            const isSerial = ['serial', 'bigserial', 'smallserial', 'serial2', 'serial4', 'serial8'].includes(rawType);

            const column = {
                name: colName,
                type: rawType,
                length: length,
                precision: precision,
                notNull: /NOT\s+NULL/i.test(constraints) || isSerial,
                autoIncrement: isSerial,
                defaultValue: null,
                comment: result.columnComments[colName] || '',
                isPrimaryKey: /PRIMARY\s+KEY/i.test(constraints) || /PRIMARY\s+KEY/i.test(def),
            };

            // 提取默认值
            const defaultMatch = constraints.match(/DEFAULT\s+(?:'([^']*)'|([^\s,]+))/i);
            if (defaultMatch) {
                column.defaultValue = defaultMatch[1] !== undefined ? `'${defaultMatch[1]}'` : defaultMatch[2];
            }

            if (column.isPrimaryKey) {
                result.primaryKeys.push(colName);
            }

            result.columns.push(column);
        }
    }

    return result;
}

/**
 * 解析 MySQL CREATE TABLE 语句
 */
function parseMySQLTable(sql) {
    const result = {
        tableName: '',
        columns: [],
        primaryKeys: [],
        uniqueKeys: [],
        indexes: [],
        tableComment: '',
        columnComments: {},
        warnings: [],
        tableOptions: {},
    };

    // 移除 SQL 注释
    let cleanSql = sql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--[^\n]*/g, '');

    // 提取表名
    const tableMatch = cleanSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/i);
    if (!tableMatch) {
        throw new Error('无法解析表名，请确保输入的是有效的 CREATE TABLE 语句');
    }
    result.tableName = tableMatch[1];

    // 提取表选项和注释
    const lastParenIndex = cleanSql.lastIndexOf(')');
    if (lastParenIndex !== -1) {
        const options = cleanSql.substring(lastParenIndex + 1);
        const commentMatch = options.match(/COMMENT\s*=?\s*['"]([^'"]+)['"]/i);
        if (commentMatch) {
            result.tableComment = commentMatch[1];
        }
    }

    // 提取括号内的内容
    const contentMatch = cleanSql.match(/CREATE\s+TABLE[^(]+\(([\s\S]+)\)[^)]*$/i);
    if (!contentMatch) {
        throw new Error('无法解析表结构');
    }

    const content = contentMatch[1];

    // 分割各个定义
    const definitions = [];
    let current = '';
    let depth = 0;
    for (const char of content) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
            definitions.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        definitions.push(current.trim());
    }

    // 解析每个定义
    for (const def of definitions) {
        if (!def) continue;

        // PRIMARY KEY
        const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
            const keys = pkMatch[1].split(',').map(k => k.trim().replace(/[`"']/g, ''));
            result.primaryKeys.push(...keys);
            continue;
        }

        // UNIQUE KEY
        if (/^UNIQUE\s+(?:KEY|INDEX)/i.test(def)) {
            const ukMatch = def.match(/UNIQUE\s+(?:KEY|INDEX)\s+[`"']?\w+[`"']?\s*\(([^)]+)\)/i);
            if (ukMatch) {
                const keys = ukMatch[1].split(',').map(k => k.trim().replace(/[`"']/g, ''));
                result.uniqueKeys.push(keys);
            }
            continue;
        }

        // INDEX / KEY
        if (/^(?:INDEX|KEY)\s+/i.test(def)) {
            result.warnings.push(`跳过索引定义: ${def.substring(0, 50)}...`);
            continue;
        }

        // CONSTRAINT
        if (/^CONSTRAINT/i.test(def)) {
            result.warnings.push(`跳过约束定义: ${def.substring(0, 50)}...`);
            continue;
        }

        // 解析列定义
        const colMatch = def.match(/^[`"']?(\w+)[`"']?\s+(\w+)(?:\s*\(([^)]+)\))?(.*)$/i);
        if (colMatch) {
            const colName = colMatch[1];
            let rawType = colMatch[2].toLowerCase();
            const params = colMatch[3] || null;
            const constraints = colMatch[4] || '';

            let length = null;
            let precision = null;
            if (params) {
                if (params.includes(',')) {
                    const parts = params.split(',');
                    length = parts[0].trim();
                    precision = parts[1].trim();
                } else {
                    length = params.trim();
                }
            }

            // 检查是否为布尔类型（TINYINT(1)）
            const isBoolean = rawType === 'tinyint' && length === '1';

            const column = {
                name: colName,
                type: rawType,
                length: length,
                precision: precision,
                unsigned: /UNSIGNED/i.test(constraints),
                notNull: /NOT\s+NULL/i.test(constraints),
                autoIncrement: /AUTO_INCREMENT/i.test(constraints),
                defaultValue: null,
                comment: '',
                isBoolean: isBoolean,
            };

            // 提取默认值
            const defaultMatch = constraints.match(/DEFAULT\s+(?:'([^']*)'|"([^"]*)"|([^\s,]+))/i);
            if (defaultMatch) {
                column.defaultValue = defaultMatch[1] || defaultMatch[2] || defaultMatch[3];
            }

            // 提取注释
            const commentMatch = constraints.match(/COMMENT\s+(['"])(.*?)\1/i);
            if (commentMatch) {
                column.comment = commentMatch[2];
            }

            result.columns.push(column);
        }
    }

    return result;
}

/**
 * PostgreSQL → MySQL 转换
 */
function convertPgToMysql(table, options) {
    const lines = [];
    const warnings = [...table.warnings];

    // 表头
    lines.push(`CREATE TABLE \`${table.tableName}\` (`);

    // 列定义
    const columnDefs = [];
    for (const col of table.columns) {
        let def = `    \`${col.name}\``;

        // 类型转换
        const typeMapping = PG_TO_MYSQL_TYPES[col.type];
        let mysqlType;
        let isAutoIncrement = col.autoIncrement;

        if (typeof typeMapping === 'object') {
            mysqlType = typeMapping.type;
            isAutoIncrement = typeMapping.autoIncrement || col.autoIncrement;
        } else if (typeMapping) {
            mysqlType = typeMapping;
        } else {
            mysqlType = col.type.toUpperCase();
            warnings.push(`类型 "${col.type}" 可能不兼容，已直接使用`);
        }

        // 添加长度/精度
        if (col.length && !mysqlType.includes('(')) {
            if (col.precision) {
                mysqlType += `(${col.length},${col.precision})`;
            } else {
                mysqlType += `(${col.length})`;
            }
        }

        def += ` ${mysqlType}`;

        // NOT NULL
        if (col.notNull || isAutoIncrement) {
            def += ' NOT NULL';
        }

        // AUTO_INCREMENT
        if (isAutoIncrement) {
            def += ' AUTO_INCREMENT';
        }

        // DEFAULT
        if (col.defaultValue && !isAutoIncrement) {
            let defaultVal = col.defaultValue;
            // 转换布尔值
            if (defaultVal.toUpperCase() === 'TRUE') {
                defaultVal = '1';
            } else if (defaultVal.toUpperCase() === 'FALSE') {
                defaultVal = '0';
            } else if (defaultVal.toUpperCase() === 'NOW()') {
                defaultVal = 'CURRENT_TIMESTAMP';
            }
            def += ` DEFAULT ${defaultVal}`;
        }

        // COMMENT
        if (col.comment) {
            def += ` COMMENT '${col.comment.replace(/'/g, "\\'")}'`;
        }

        columnDefs.push(def);
    }

    // PRIMARY KEY
    if (table.primaryKeys.length > 0) {
        columnDefs.push(`    PRIMARY KEY (\`${table.primaryKeys.join('`, `')}\`)`);
    }

    // UNIQUE KEY
    for (let i = 0; i < table.uniqueKeys.length; i++) {
        const keys = table.uniqueKeys[i];
        columnDefs.push(`    UNIQUE KEY \`uk_${table.tableName}_${i + 1}\` (\`${keys.join('`, `')}\`)`);
    }

    lines.push(columnDefs.join(',\n'));
    lines.push(')');

    // 表选项
    if (options.addTableOptions) {
        let tableOptions = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
        if (table.tableComment) {
            tableOptions += ` COMMENT='${table.tableComment.replace(/'/g, "\\'")}'`;
        }
        lines[lines.length - 1] += ` ${tableOptions}`;
    } else if (table.tableComment) {
        lines[lines.length - 1] += ` COMMENT='${table.tableComment.replace(/'/g, "\\'")}'`;
    }

    lines[lines.length - 1] += ';';

    return {
        sql: lines.join('\n'),
        warnings: warnings,
    };
}

/**
 * MySQL → PostgreSQL 转换
 */
function convertMysqlToPg(table, options) {
    const lines = [];
    const commentLines = [];
    const warnings = [...table.warnings];

    // 表头
    lines.push(`CREATE TABLE ${table.tableName} (`);

    // 列定义
    const columnDefs = [];
    let inlinePrimaryKey = table.primaryKeys.length === 1;

    for (const col of table.columns) {
        let def = `    ${col.name}`;

        // 类型转换
        let pgType;
        if (col.autoIncrement) {
            // 自增类型
            if (col.type === 'bigint') {
                pgType = 'BIGSERIAL';
            } else if (col.type === 'smallint' || col.type === 'tinyint') {
                pgType = 'SMALLSERIAL';
            } else {
                pgType = 'SERIAL';
            }
            // SERIAL 类型暗含 PRIMARY KEY，如果是单一主键
            if (inlinePrimaryKey && table.primaryKeys.includes(col.name)) {
                def += ` ${pgType} PRIMARY KEY`;
                inlinePrimaryKey = false; // 已处理
            } else {
                def += ` ${pgType}`;
            }
        } else if (col.isBoolean) {
            pgType = 'BOOLEAN';
        } else {
            pgType = MYSQL_TO_PG_TYPES[col.type];
            if (!pgType) {
                pgType = col.type.toUpperCase();
                warnings.push(`类型 "${col.type}" 可能不兼容，已直接使用`);
            }
        }

        // 添加长度/精度
        if (col.length && !col.autoIncrement && !col.isBoolean && !pgType.includes('(')) {
            if (['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC'].includes(pgType)) {
                if (col.precision) {
                    pgType += `(${col.length},${col.precision})`;
                } else {
                    pgType += `(${col.length})`;
                }
            }
        }

        if (!col.autoIncrement) {
            def += ` ${pgType}`;
        }

        // NOT NULL
        if (col.notNull && !col.autoIncrement) {
            def += ' NOT NULL';
        }

        // DEFAULT
        if (col.defaultValue && !col.autoIncrement) {
            let defaultVal = col.defaultValue;
            // 转换布尔值
            if (col.isBoolean) {
                if (defaultVal === '1' || defaultVal === "'1'") {
                    defaultVal = 'TRUE';
                } else if (defaultVal === '0' || defaultVal === "'0'") {
                    defaultVal = 'FALSE';
                }
            } else if (defaultVal.toUpperCase() === 'CURRENT_TIMESTAMP') {
                defaultVal = 'NOW()';
            }
            def += ` DEFAULT ${defaultVal}`;
        }

        columnDefs.push(def);

        // 收集注释
        if (col.comment) {
            commentLines.push(`COMMENT ON COLUMN "${table.tableName}"."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`);
        }
    }

    // PRIMARY KEY（如果不是单一主键或未内联处理）
    if (table.primaryKeys.length > 1 || (table.primaryKeys.length === 1 && inlinePrimaryKey)) {
        columnDefs.push(`    PRIMARY KEY (${table.primaryKeys.join(', ')})`);
    }

    // UNIQUE
    for (const keys of table.uniqueKeys) {
        columnDefs.push(`    UNIQUE (${keys.join(', ')})`);
    }

    lines.push(columnDefs.join(',\n'));
    lines.push(');');

    // 表注释
    if (table.tableComment) {
        commentLines.unshift(`COMMENT ON TABLE "${table.tableName}" IS '${table.tableComment.replace(/'/g, "''")}';`);
    }

    // 合并输出
    let output = lines.join('\n');
    if (commentLines.length > 0 && options.generateCommentOn) {
        output += '\n\n' + commentLines.join('\n');
    }

    return {
        sql: output,
        warnings: warnings,
    };
}

/**
 * SQL 方言转换工具
 */
function SqlDialectConvert() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [direction, setDirection] = useState('pg2mysql'); // 'pg2mysql' | 'mysql2pg'

    // 选项
    const [options, setOptions] = useState({
        addTableOptions: true,      // MySQL: 添加 ENGINE=InnoDB CHARSET=utf8mb4
        generateCommentOn: true,    // PG: 生成 COMMENT ON 语句
        formatOutput: true,
    });

    /**
     * 实时转换
     */
    const { output, error, warnings } = useMemo(() => {
        if (!input.trim()) {
            return { output: '', error: null, warnings: [] };
        }

        try {
            let result;
            if (direction === 'pg2mysql') {
                const table = parsePostgresTable(input);
                result = convertPgToMysql(table, options);
            } else {
                const table = parseMySQLTable(input);
                result = convertMysqlToPg(table, options);
            }
            return { output: result.sql, error: null, warnings: result.warnings };
        } catch (err) {
            return { output: '', error: err.message, warnings: [] };
        }
    }, [input, direction, options]);

    /**
     * 清空
     */
    const handleClear = useCallback(() => {
        setInput('');
    }, []);

    /**
     * 粘贴
     */
    const handlePaste = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInput(text);
        } catch (err) {
            console.error('粘贴失败:', err);
        }
    }, []);

    /**
     * 切换方向
     */
    const handleSwapDirection = useCallback(() => {
        setDirection(prev => prev === 'pg2mysql' ? 'mysql2pg' : 'pg2mysql');
        // 同时将输出变为输入（如果有的话）
        if (output) {
            setInput(output);
        }
    }, [output]);

    /**
     * 更新选项
     */
    const updateOption = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    // 获取源和目标方言
    const sourceDialect = direction === 'pg2mysql' ? 'PostgreSQL' : 'MySQL';
    const targetDialect = direction === 'pg2mysql' ? 'MySQL' : 'PostgreSQL';

    // 工具栏按钮配置
    const actions = [
        {
            label: 'Paste',
            icon: <ContentPasteIcon fontSize="small" />,
            onClick: handlePaste,
        },
        {
            label: 'Clear',
            icon: <DeleteOutlineIcon fontSize="small" />,
            onClick: handleClear,
        },
    ];

    // 示例 SQL
    const getPlaceholder = () => {
        if (direction === 'pg2mysql') {
            return `输入 PostgreSQL CREATE TABLE 语句，例如：

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.name IS '用户名';`;
        } else {
            return `输入 MySQL CREATE TABLE 语句，例如：

CREATE TABLE \`users\` (
    \`id\` BIGINT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(100) NOT NULL COMMENT '用户名',
    \`email\` TEXT,
    \`is_active\` TINYINT(1) DEFAULT 1,
    \`data\` JSON,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB COMMENT='用户表';`;
        }
    };

    return (
        <ToolCard
            title="SQL 方言转换"
            description="在 PostgreSQL 和 MySQL 的 DDL 语句之间进行转换"
            actions={actions}
            copyContent={output}
        >
            {/* 转换方向选择 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                    label="PostgreSQL"
                    color={direction === 'pg2mysql' ? 'primary' : 'default'}
                    variant={direction === 'pg2mysql' ? 'filled' : 'outlined'}
                />
                <Box
                    onClick={handleSwapDirection}
                    sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(99, 102, 241, 0.1)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(99, 102, 241, 0.3)'
                                : 'rgba(99, 102, 241, 0.2)',
                            transform: 'scale(1.1)',
                        },
                    }}
                >
                    <SwapHorizIcon color="primary" />
                </Box>
                <Chip
                    label="MySQL"
                    color={direction === 'mysql2pg' ? 'primary' : 'default'}
                    variant={direction === 'mysql2pg' ? 'filled' : 'outlined'}
                />
            </Box>

            {/* 选项面板 */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(99, 102, 241, 0.05)'
                        : 'rgba(99, 102, 241, 0.03)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    {direction === 'pg2mysql' && (
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={options.addTableOptions}
                                        onChange={(e) => updateOption('addTableOptions', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="添加 ENGINE/CHARSET"
                            />
                        </Grid>
                    )}
                    {direction === 'mysql2pg' && (
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={options.generateCommentOn}
                                        onChange={(e) => updateOption('generateCommentOn', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="生成 COMMENT ON 语句"
                            />
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* 错误提示 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 警告提示 */}
            {warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>转换警告：</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {warnings.map((w, i) => (
                            <li key={i}><Typography variant="body2">{w}</Typography></li>
                        ))}
                    </ul>
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
                                输入 {sourceDialect} SQL
                            </Typography>
                            <Chip label={sourceDialect} size="small" color="default" sx={{ height: 20, fontSize: 11 }} />
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language="sql"
                            placeholder={getPlaceholder()}
                            height="500px"
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
                                转换结果
                            </Typography>
                            <Chip label={targetDialect} size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
                        </Box>
                        <CodeEditor
                            value={output}
                            language="sql"
                            placeholder="输入 SQL 后将实时转换..."
                            height="500px"
                            readOnly
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* 使用说明 */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>提示：</strong>
                    支持 DDL（CREATE TABLE）语句转换。自动处理数据类型映射、注释格式转换、标识符引用转换（双引号↔反引号）、自增语法转换（SERIAL↔AUTO_INCREMENT）。
                    点击中间的箭头可以快速切换转换方向并将输出作为新的输入。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default SqlDialectConvert;
