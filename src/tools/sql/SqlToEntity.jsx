import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    useTheme,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

import ToolCard from '../../components/ToolCard';
import CodeEditor from '../../components/CodeEditor';

/**
 * SQL 类型到各语言类型的映射
 */
const TYPE_MAPPINGS = {
    go: {
        // 整数类型
        'tinyint': 'int8',
        'smallint': 'int16',
        'mediumint': 'int32',
        'int': 'int32',
        'integer': 'int32',
        'bigint': 'int64',
        'tinyint unsigned': 'uint8',
        'smallint unsigned': 'uint16',
        'mediumint unsigned': 'uint32',
        'int unsigned': 'uint32',
        'integer unsigned': 'uint32',
        'bigint unsigned': 'uint64',
        // 浮点类型
        'float': 'float32',
        'double': 'float64',
        'decimal': 'float64',
        'numeric': 'float64',
        // 字符串类型
        'char': 'string',
        'varchar': 'string',
        'tinytext': 'string',
        'text': 'string',
        'mediumtext': 'string',
        'longtext': 'string',
        'json': 'string',
        'enum': 'string',
        'set': 'string',
        // 二进制类型
        'binary': '[]byte',
        'varbinary': '[]byte',
        'tinyblob': '[]byte',
        'blob': '[]byte',
        'mediumblob': '[]byte',
        'longblob': '[]byte',
        // 时间类型
        'date': 'time.Time',
        'datetime': 'time.Time',
        'timestamp': 'time.Time',
        'time': 'string',
        'year': 'int',
        // 布尔
        'bool': 'bool',
        'boolean': 'bool',
        'bit': 'bool',
    },
    java: {
        // 整数类型
        'tinyint': 'Byte',
        'smallint': 'Short',
        'mediumint': 'Integer',
        'int': 'Integer',
        'integer': 'Integer',
        'bigint': 'Long',
        'tinyint unsigned': 'Short',
        'smallint unsigned': 'Integer',
        'mediumint unsigned': 'Integer',
        'int unsigned': 'Long',
        'integer unsigned': 'Long',
        'bigint unsigned': 'BigInteger',
        // 浮点类型
        'float': 'Float',
        'double': 'Double',
        'decimal': 'BigDecimal',
        'numeric': 'BigDecimal',
        // 字符串类型
        'char': 'String',
        'varchar': 'String',
        'tinytext': 'String',
        'text': 'String',
        'mediumtext': 'String',
        'longtext': 'String',
        'json': 'String',
        'enum': 'String',
        'set': 'String',
        // 二进制类型
        'binary': 'byte[]',
        'varbinary': 'byte[]',
        'tinyblob': 'byte[]',
        'blob': 'byte[]',
        'mediumblob': 'byte[]',
        'longblob': 'byte[]',
        // 时间类型
        'date': 'LocalDate',
        'datetime': 'LocalDateTime',
        'timestamp': 'LocalDateTime',
        'time': 'LocalTime',
        'year': 'Integer',
        // 布尔
        'bool': 'Boolean',
        'boolean': 'Boolean',
        'bit': 'Boolean',
    },
    typescript: {
        // 整数类型
        'tinyint': 'number',
        'smallint': 'number',
        'mediumint': 'number',
        'int': 'number',
        'integer': 'number',
        'bigint': 'number',
        'tinyint unsigned': 'number',
        'smallint unsigned': 'number',
        'mediumint unsigned': 'number',
        'int unsigned': 'number',
        'integer unsigned': 'number',
        'bigint unsigned': 'number',
        // 浮点类型
        'float': 'number',
        'double': 'number',
        'decimal': 'number',
        'numeric': 'number',
        // 字符串类型
        'char': 'string',
        'varchar': 'string',
        'tinytext': 'string',
        'text': 'string',
        'mediumtext': 'string',
        'longtext': 'string',
        'json': 'any',
        'enum': 'string',
        'set': 'string',
        // 二进制类型
        'binary': 'Buffer',
        'varbinary': 'Buffer',
        'tinyblob': 'Buffer',
        'blob': 'Buffer',
        'mediumblob': 'Buffer',
        'longblob': 'Buffer',
        // 时间类型
        'date': 'Date',
        'datetime': 'Date',
        'timestamp': 'Date',
        'time': 'string',
        'year': 'number',
        // 布尔
        'bool': 'boolean',
        'boolean': 'boolean',
        'bit': 'boolean',
    },
    python: {
        // 整数类型
        'tinyint': 'int',
        'smallint': 'int',
        'mediumint': 'int',
        'int': 'int',
        'integer': 'int',
        'bigint': 'int',
        'tinyint unsigned': 'int',
        'smallint unsigned': 'int',
        'mediumint unsigned': 'int',
        'int unsigned': 'int',
        'integer unsigned': 'int',
        'bigint unsigned': 'int',
        // 浮点类型
        'float': 'float',
        'double': 'float',
        'decimal': 'Decimal',
        'numeric': 'Decimal',
        // 字符串类型
        'char': 'str',
        'varchar': 'str',
        'tinytext': 'str',
        'text': 'str',
        'mediumtext': 'str',
        'longtext': 'str',
        'json': 'dict',
        'enum': 'str',
        'set': 'str',
        // 二进制类型
        'binary': 'bytes',
        'varbinary': 'bytes',
        'tinyblob': 'bytes',
        'blob': 'bytes',
        'mediumblob': 'bytes',
        'longblob': 'bytes',
        // 时间类型
        'date': 'date',
        'datetime': 'datetime',
        'timestamp': 'datetime',
        'time': 'time',
        'year': 'int',
        // 布尔
        'bool': 'bool',
        'boolean': 'bool',
        'bit': 'bool',
    },
};

/**
 * 目标语言配置
 */
const TARGET_LANGUAGES = [
    { value: 'go-gorm', label: 'Go (GORM)', lang: 'go' },
    { value: 'go-struct', label: 'Go (纯 Struct)', lang: 'go' },
    { value: 'java-jpa', label: 'Java (JPA Entity)', lang: 'java' },
    { value: 'java-mybatis', label: 'Java (MyBatis)', lang: 'java' },
    { value: 'typescript', label: 'TypeScript (Interface)', lang: 'typescript' },
    { value: 'python-dataclass', label: 'Python (dataclass)', lang: 'python' },
    { value: 'python-sqlalchemy', label: 'Python (SQLAlchemy)', lang: 'python' },
];

/**
 * 解析 CREATE TABLE 语句
 */
function parseCreateTable(sql) {
    const result = {
        tableName: '',
        columns: [],
        primaryKeys: [],
        uniqueKeys: [],
        indexes: [],
        tableComment: '',
    };

    // 提取表名
    const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/i);
    if (!tableMatch) {
        throw new Error('无法解析表名，请确保输入的是有效的 CREATE TABLE 语句');
    }
    result.tableName = tableMatch[1];

    // 提取表注释
    const tableCommentMatch = sql.match(/\)\s*(?:ENGINE\s*=\s*\w+)?\s*(?:DEFAULT\s+CHARSET\s*=\s*\w+)?\s*COMMENT\s*=?\s*['"]([^'"]+)['"]/i);
    if (tableCommentMatch) {
        result.tableComment = tableCommentMatch[1];
    }

    // 提取括号内的内容
    const contentMatch = sql.match(/CREATE\s+TABLE[^(]+\(([\s\S]+)\)[^)]*$/i);
    if (!contentMatch) {
        throw new Error('无法解析表结构');
    }

    const content = contentMatch[1];

    // 分割各个定义（考虑括号嵌套）
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
        // 跳过空定义
        if (!def) continue;

        // PRIMARY KEY
        const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
            const keys = pkMatch[1].split(',').map(k => k.trim().replace(/[`"']/g, ''));
            result.primaryKeys.push(...keys);
            continue;
        }

        // UNIQUE KEY
        const ukMatch = def.match(/UNIQUE\s+(?:KEY|INDEX)\s+[`"']?\w+[`"']?\s*\(([^)]+)\)/i);
        if (ukMatch) {
            const keys = ukMatch[1].split(',').map(k => k.trim().replace(/[`"']/g, ''));
            result.uniqueKeys.push(keys);
            continue;
        }

        // INDEX / KEY
        const idxMatch = def.match(/(?:INDEX|KEY)\s+[`"']?\w+[`"']?\s*\(([^)]+)\)/i);
        if (idxMatch) {
            const keys = idxMatch[1].split(',').map(k => k.trim().replace(/[`"']/g, ''));
            result.indexes.push(keys);
            continue;
        }

        // CONSTRAINT（跳过外键等）
        if (/^CONSTRAINT/i.test(def)) {
            continue;
        }

        // 解析列定义
        const colMatch = def.match(/^[`"']?(\w+)[`"']?\s+(\w+)(?:\s*\(([^)]+)\))?(.*)$/i);
        if (colMatch) {
            const column = {
                name: colMatch[1],
                type: colMatch[2].toLowerCase(),
                length: colMatch[3] || null,
                unsigned: /UNSIGNED/i.test(colMatch[4]),
                notNull: /NOT\s+NULL/i.test(colMatch[4]),
                autoIncrement: /AUTO_INCREMENT/i.test(colMatch[4]),
                defaultValue: null,
                comment: '',
            };

            // 提取默认值
            const defaultMatch = colMatch[4].match(/DEFAULT\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i);
            if (defaultMatch) {
                column.defaultValue = defaultMatch[1] || defaultMatch[2] || defaultMatch[3];
            }

            // 提取注释
            const commentMatch = colMatch[4].match(/COMMENT\s+['"]([^'"]+)['"]/i);
            if (commentMatch) {
                column.comment = commentMatch[1];
            }

            // 处理 unsigned
            if (column.unsigned) {
                column.type = column.type + ' unsigned';
            }

            result.columns.push(column);
        }
    }

    return result;
}

/**
 * 下划线转驼峰（首字母小写）
 */
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 下划线转帕斯卡（首字母大写）
 */
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * 获取语言对应的类型
 */
function getTypeForLanguage(sqlType, language) {
    const lang = language.split('-')[0]; // 'go-gorm' -> 'go'
    const mapping = TYPE_MAPPINGS[lang] || TYPE_MAPPINGS.go;
    return mapping[sqlType] || 'string';
}

/**
 * 生成 Go GORM 结构体
 */
function generateGoGorm(table, options) {
    const structName = toPascalCase(table.tableName);
    let code = '';

    // 添加包声明和导入
    if (options.includePackage) {
        code += 'package model\n\n';
        const needTime = table.columns.some(c =>
            ['datetime', 'timestamp', 'date'].includes(c.type.replace(' unsigned', ''))
        );
        if (needTime) {
            code += 'import "time"\n\n';
        }
    }

    // 表注释
    if (table.tableComment) {
        code += `// ${structName} ${table.tableComment}\n`;
    }

    code += `type ${structName} struct {\n`;

    for (const col of table.columns) {
        const fieldName = toPascalCase(col.name);
        const goType = getTypeForLanguage(col.type, 'go');

        // 构建 GORM tag
        const gormTags = [`column:${col.name}`];
        if (table.primaryKeys.includes(col.name)) {
            gormTags.push('primaryKey');
        }
        if (col.autoIncrement) {
            gormTags.push('autoIncrement');
        }
        if (col.type.includes('varchar') && col.length) {
            gormTags.push(`type:varchar(${col.length})`);
        }
        if (col.notNull && !col.autoIncrement) {
            gormTags.push('not null');
        }
        if (col.defaultValue && col.defaultValue !== 'NULL') {
            gormTags.push(`default:${col.defaultValue}`);
        }

        // 构建 JSON tag
        const jsonTag = options.includeJsonTag ? ` json:"${col.name}"` : '';

        // 构建完整 tag
        const tag = `\`gorm:"${gormTags.join(';')}"${jsonTag}\``;

        // 注释
        const comment = col.comment ? ` // ${col.comment}` : '';

        code += `    ${fieldName} ${goType} ${tag}${comment}\n`;
    }

    code += '}\n';

    // 表名方法
    if (options.includeTableName) {
        code += `\n// TableName 指定表名\n`;
        code += `func (${structName}) TableName() string {\n`;
        code += `    return "${table.tableName}"\n`;
        code += '}\n';
    }

    return code;
}

/**
 * 生成 Go 纯 Struct
 */
function generateGoStruct(table, options) {
    const structName = toPascalCase(table.tableName);
    let code = '';

    if (options.includePackage) {
        code += 'package model\n\n';
        const needTime = table.columns.some(c =>
            ['datetime', 'timestamp', 'date'].includes(c.type.replace(' unsigned', ''))
        );
        if (needTime) {
            code += 'import "time"\n\n';
        }
    }

    if (table.tableComment) {
        code += `// ${structName} ${table.tableComment}\n`;
    }

    code += `type ${structName} struct {\n`;

    for (const col of table.columns) {
        const fieldName = toPascalCase(col.name);
        const goType = getTypeForLanguage(col.type, 'go');
        const jsonTag = options.includeJsonTag ? ` \`json:"${col.name}"\`` : '';
        const comment = col.comment ? ` // ${col.comment}` : '';
        code += `    ${fieldName} ${goType}${jsonTag}${comment}\n`;
    }

    code += '}\n';
    return code;
}

/**
 * 生成 Java JPA Entity
 */
function generateJavaJpa(table, options) {
    const className = toPascalCase(table.tableName);
    let code = '';

    if (options.includePackage) {
        code += 'package com.example.entity;\n\n';
        code += 'import jakarta.persistence.*;\n';
        const needTime = table.columns.some(c =>
            ['datetime', 'timestamp', 'date', 'time'].includes(c.type.replace(' unsigned', ''))
        );
        if (needTime) {
            code += 'import java.time.*;\n';
        }
        const needBigDecimal = table.columns.some(c =>
            ['decimal', 'numeric'].includes(c.type.replace(' unsigned', ''))
        );
        if (needBigDecimal) {
            code += 'import java.math.BigDecimal;\n';
        }
        code += '\n';
    }

    if (table.tableComment) {
        code += `/**\n * ${table.tableComment}\n */\n`;
    }

    code += '@Entity\n';
    code += `@Table(name = "${table.tableName}")\n`;
    code += `public class ${className} {\n\n`;

    for (const col of table.columns) {
        const fieldName = toCamelCase(col.name);
        const javaType = getTypeForLanguage(col.type, 'java');

        // 注释
        if (col.comment) {
            code += `    /** ${col.comment} */\n`;
        }

        // 主键注解
        if (table.primaryKeys.includes(col.name)) {
            code += '    @Id\n';
            if (col.autoIncrement) {
                code += '    @GeneratedValue(strategy = GenerationType.IDENTITY)\n';
            }
        }

        // Column 注解
        const colAttrs = [`name = "${col.name}"`];
        if (col.length && col.type.includes('varchar')) {
            colAttrs.push(`length = ${col.length}`);
        }
        if (col.notNull) {
            colAttrs.push('nullable = false');
        }
        code += `    @Column(${colAttrs.join(', ')})\n`;

        code += `    private ${javaType} ${fieldName};\n\n`;
    }

    // Getter/Setter
    if (options.includeGetterSetter) {
        for (const col of table.columns) {
            const fieldName = toCamelCase(col.name);
            const javaType = getTypeForLanguage(col.type, 'java');
            const methodName = toPascalCase(col.name);

            code += `    public ${javaType} get${methodName}() {\n`;
            code += `        return ${fieldName};\n`;
            code += '    }\n\n';

            code += `    public void set${methodName}(${javaType} ${fieldName}) {\n`;
            code += `        this.${fieldName} = ${fieldName};\n`;
            code += '    }\n\n';
        }
    }

    code += '}\n';
    return code;
}

/**
 * 生成 Java MyBatis 实体
 */
function generateJavaMyBatis(table, options) {
    const className = toPascalCase(table.tableName);
    let code = '';

    if (options.includePackage) {
        code += 'package com.example.entity;\n\n';
        code += 'import lombok.Data;\n';
        const needTime = table.columns.some(c =>
            ['datetime', 'timestamp', 'date', 'time'].includes(c.type.replace(' unsigned', ''))
        );
        if (needTime) {
            code += 'import java.time.*;\n';
        }
        const needBigDecimal = table.columns.some(c =>
            ['decimal', 'numeric'].includes(c.type.replace(' unsigned', ''))
        );
        if (needBigDecimal) {
            code += 'import java.math.BigDecimal;\n';
        }
        code += '\n';
    }

    if (table.tableComment) {
        code += `/**\n * ${table.tableComment}\n */\n`;
    }

    code += '@Data\n';
    code += `public class ${className} {\n\n`;

    for (const col of table.columns) {
        const fieldName = toCamelCase(col.name);
        const javaType = getTypeForLanguage(col.type, 'java');

        if (col.comment) {
            code += `    /** ${col.comment} */\n`;
        }
        code += `    private ${javaType} ${fieldName};\n\n`;
    }

    code += '}\n';
    return code;
}

/**
 * 生成 TypeScript Interface
 */
function generateTypeScript(table, options) {
    const interfaceName = toPascalCase(table.tableName);
    let code = '';

    if (table.tableComment) {
        code += `/** ${table.tableComment} */\n`;
    }

    code += `export interface ${interfaceName} {\n`;

    for (const col of table.columns) {
        const fieldName = options.useCamelCase ? toCamelCase(col.name) : col.name;
        const tsType = getTypeForLanguage(col.type, 'typescript');
        const optional = !col.notNull && !table.primaryKeys.includes(col.name) ? '?' : '';
        const comment = col.comment ? ` // ${col.comment}` : '';
        code += `    ${fieldName}${optional}: ${tsType};${comment}\n`;
    }

    code += '}\n';
    return code;
}

/**
 * 生成 Python dataclass
 */
function generatePythonDataclass(table, options) {
    const className = toPascalCase(table.tableName);
    let code = '';

    code += 'from dataclasses import dataclass\n';
    const needDatetime = table.columns.some(c =>
        ['datetime', 'timestamp', 'date', 'time'].includes(c.type.replace(' unsigned', ''))
    );
    if (needDatetime) {
        code += 'from datetime import datetime, date, time\n';
    }
    const needDecimal = table.columns.some(c =>
        ['decimal', 'numeric'].includes(c.type.replace(' unsigned', ''))
    );
    if (needDecimal) {
        code += 'from decimal import Decimal\n';
    }
    code += 'from typing import Optional\n\n';

    if (table.tableComment) {
        code += `# ${table.tableComment}\n`;
    }

    code += '@dataclass\n';
    code += `class ${className}:\n`;

    if (table.columns.length === 0) {
        code += '    pass\n';
    } else {
        for (const col of table.columns) {
            const fieldName = col.name; // Python 保持下划线
            const pyType = getTypeForLanguage(col.type, 'python');
            const optional = !col.notNull && !table.primaryKeys.includes(col.name);
            const typeHint = optional ? `Optional[${pyType}]` : pyType;
            const defaultVal = optional ? ' = None' : '';
            const comment = col.comment ? `  # ${col.comment}` : '';
            code += `    ${fieldName}: ${typeHint}${defaultVal}${comment}\n`;
        }
    }

    return code;
}

/**
 * 生成 Python SQLAlchemy
 */
function generatePythonSQLAlchemy(table, options) {
    const className = toPascalCase(table.tableName);
    let code = '';

    code += 'from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, DECIMAL\n';
    code += 'from sqlalchemy.ext.declarative import declarative_base\n\n';
    code += 'Base = declarative_base()\n\n';

    if (table.tableComment) {
        code += `# ${table.tableComment}\n`;
    }

    code += `class ${className}(Base):\n`;
    code += `    __tablename__ = "${table.tableName}"\n\n`;

    for (const col of table.columns) {
        const fieldName = col.name;
        let saType = 'String';
        const baseType = col.type.replace(' unsigned', '');

        if (['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint'].includes(baseType)) {
            saType = 'Integer';
        } else if (['datetime', 'timestamp'].includes(baseType)) {
            saType = 'DateTime';
        } else if (['bool', 'boolean', 'bit'].includes(baseType)) {
            saType = 'Boolean';
        } else if (['text', 'mediumtext', 'longtext'].includes(baseType)) {
            saType = 'Text';
        } else if (['decimal', 'numeric'].includes(baseType)) {
            saType = 'DECIMAL';
        } else if (col.type.includes('varchar') && col.length) {
            saType = `String(${col.length})`;
        }

        const attrs = [];
        if (table.primaryKeys.includes(col.name)) {
            attrs.push('primary_key=True');
        }
        if (col.autoIncrement) {
            attrs.push('autoincrement=True');
        }
        if (col.notNull && !table.primaryKeys.includes(col.name)) {
            attrs.push('nullable=False');
        }

        const attrStr = attrs.length > 0 ? `, ${attrs.join(', ')}` : '';
        const comment = col.comment ? `  # ${col.comment}` : '';
        code += `    ${fieldName} = Column(${saType}${attrStr})${comment}\n`;
    }

    return code;
}

/**
 * 根据目标语言生成代码
 */
function generateCode(table, targetLang, options) {
    switch (targetLang) {
        case 'go-gorm':
            return generateGoGorm(table, options);
        case 'go-struct':
            return generateGoStruct(table, options);
        case 'java-jpa':
            return generateJavaJpa(table, options);
        case 'java-mybatis':
            return generateJavaMyBatis(table, options);
        case 'typescript':
            return generateTypeScript(table, options);
        case 'python-dataclass':
            return generatePythonDataclass(table, options);
        case 'python-sqlalchemy':
            return generatePythonSQLAlchemy(table, options);
        default:
            return '// 不支持的目标语言';
    }
}

/**
 * SQL 转实体类工具
 */
function SqlToEntity() {
    const theme = useTheme();

    // 状态管理
    const [input, setInput] = useState('');
    const [targetLang, setTargetLang] = useState('go-gorm');

    // 选项
    const [options, setOptions] = useState({
        includePackage: true,
        includeJsonTag: true,
        includeTableName: true,
        includeGetterSetter: false,
        useCamelCase: true,
    });

    /**
     * 实时转换
     */
    const { output, error, tableInfo } = useMemo(() => {
        if (!input.trim()) {
            return { output: '', error: null, tableInfo: null };
        }

        try {
            const table = parseCreateTable(input);
            const code = generateCode(table, targetLang, options);
            return { output: code, error: null, tableInfo: table };
        } catch (err) {
            return { output: '', error: err.message, tableInfo: null };
        }
    }, [input, targetLang, options]);

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
     * 更新选项
     */
    const updateOption = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    // 获取输出语言（用于语法高亮）
    const outputLang = TARGET_LANGUAGES.find(l => l.value === targetLang)?.lang || 'go';

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

    return (
        <ToolCard
            title="SQL 转实体类"
            description="将 CREATE TABLE 语句转换为 Go、Java、TypeScript、Python 等语言的实体类/结构体"
            actions={actions}
            copyContent={output}
        >
            {/* 目标语言选择 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {TARGET_LANGUAGES.map((lang) => (
                    <Chip
                        key={lang.value}
                        label={lang.label}
                        onClick={() => setTargetLang(lang.value)}
                        color={targetLang === lang.value ? 'primary' : 'default'}
                        variant={targetLang === lang.value ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                    />
                ))}
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
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={options.includePackage}
                                    onChange={(e) => updateOption('includePackage', e.target.checked)}
                                    size="small"
                                />
                            }
                            label="包含 package/import"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={options.includeJsonTag}
                                    onChange={(e) => updateOption('includeJsonTag', e.target.checked)}
                                    size="small"
                                />
                            }
                            label="包含 JSON tag"
                        />
                    </Grid>
                    {targetLang === 'go-gorm' && (
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={options.includeTableName}
                                        onChange={(e) => updateOption('includeTableName', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="生成 TableName 方法"
                            />
                        </Grid>
                    )}
                    {targetLang === 'java-jpa' && (
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={options.includeGetterSetter}
                                        onChange={(e) => updateOption('includeGetterSetter', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="生成 Getter/Setter"
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

            {/* 表信息提示 */}
            {tableInfo && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    解析成功：表 <strong>{tableInfo.tableName}</strong>，共 {tableInfo.columns.length} 个字段
                    {tableInfo.tableComment && `（${tableInfo.tableComment}）`}
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
                                输入 CREATE TABLE 语句
                            </Typography>
                        </Box>
                        <CodeEditor
                            value={input}
                            onChange={setInput}
                            language="sql"
                            placeholder={`输入 CREATE TABLE 语句，例如：

CREATE TABLE \`users\` (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
    \`name\` varchar(100) NOT NULL COMMENT '用户名',
    \`email\` varchar(255) DEFAULT NULL COMMENT '邮箱',
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB COMMENT='用户表';`}
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
                                生成结果
                            </Typography>
                            <Chip
                                label={TARGET_LANGUAGES.find(l => l.value === targetLang)?.label}
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: 11 }}
                            />
                        </Box>
                        <CodeEditor
                            value={output}
                            language={outputLang}
                            placeholder="输入 SQL 后将实时生成对应的实体类..."
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
                    支持解析 MySQL、PostgreSQL 等数据库的 CREATE TABLE 语句，包括字段类型、主键、自增、默认值、注释等属性。
                    生成的代码会自动处理类型映射和命名转换（下划线→驼峰）。
                </Typography>
            </Box>
        </ToolCard>
    );
}

export default SqlToEntity;
