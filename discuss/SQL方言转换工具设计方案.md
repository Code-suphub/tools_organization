# SQL 方言转换工具设计方案

## 1. 功能概述

实现一个 **PostgreSQL ↔ MySQL SQL 语句互转工具**，支持将一种数据库的 SQL 语句转换为另一种数据库的等效语句。

## 2. 支持的转换场景

### 2.1 DDL 转换（CREATE TABLE）

| PostgreSQL | MySQL | 说明 |
|------------|-------|------|
| `BIGSERIAL` | `BIGINT AUTO_INCREMENT` | 自增主键 |
| `SERIAL` | `INT AUTO_INCREMENT` | 自增 |
| `SMALLSERIAL` | `SMALLINT AUTO_INCREMENT` | 小整数自增 |
| `BOOLEAN` | `TINYINT(1)` | 布尔类型 |
| `BYTEA` | `BLOB` / `LONGBLOB` | 二进制 |
| `TEXT` | `TEXT` / `LONGTEXT` | 大文本 |
| `TIMESTAMP` | `TIMESTAMP` / `DATETIME` | 时间戳 |
| `TIMESTAMPTZ` | `TIMESTAMP` | 带时区时间戳 |
| `UUID` | `CHAR(36)` / `VARCHAR(36)` | UUID 类型 |
| `JSONB` | `JSON` | JSON 类型 |
| `DOUBLE PRECISION` | `DOUBLE` | 双精度浮点 |
| `REAL` | `FLOAT` | 单精度浮点 |
| `CHARACTER VARYING(n)` | `VARCHAR(n)` | 变长字符串 |
| `INTEGER` | `INT` | 整数 |

### 2.2 语法差异

| 特性 | PostgreSQL | MySQL |
|------|------------|-------|
| 标识符引用 | 双引号 `"table"` | 反引号 `` `table` `` |
| 字符串 | 单引号 `'str'` | 单引号 `'str'` |
| 布尔值 | `TRUE` / `FALSE` | `1` / `0` 或 `TRUE` / `FALSE` |
| 自增 | `SERIAL` / `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` |
| 注释语法 | `COMMENT ON TABLE/COLUMN ...` | `COMMENT '...'` 内联 |
| 默认时间戳 | `DEFAULT NOW()` 或 `DEFAULT CURRENT_TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| 表选项 | 无 | `ENGINE=InnoDB CHARSET=utf8mb4` |

### 2.3 函数转换

| PostgreSQL | MySQL | 说明 |
|------------|-------|------|
| `NOW()` | `NOW()` | 当前时间（相同） |
| `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` | 相同 |
| `COALESCE()` | `COALESCE()` / `IFNULL()` | 空值处理 |
| `CONCAT_WS()` | `CONCAT_WS()` | 相同 |
| `SUBSTRING()` | `SUBSTRING()` / `SUBSTR()` | 相同 |
| `LENGTH()` | `CHAR_LENGTH()` | 字符长度 |
| `OCTET_LENGTH()` | `LENGTH()` | 字节长度 |
| `||` (字符串连接) | `CONCAT()` | 字符串拼接 |
| `ILIKE` | `LIKE` (不区分大小写需配合 COLLATE) | 模糊匹配 |
| `LIMIT x OFFSET y` | `LIMIT y, x` 或 `LIMIT x OFFSET y` | 分页 |

## 3. UI 设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQL 方言转换工具                              │
│   将 PostgreSQL 和 MySQL 的 SQL 语句相互转换                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   转换方向：  [PostgreSQL → MySQL]   [MySQL → PostgreSQL]        │
│                                                                  │
│   转换类型：  [DDL (CREATE TABLE)]  [DML (SELECT/INSERT)]        │
│                                                                  │
├────────────────────────┬────────────────────────────────────────┤
│   输入源 SQL            │   转换结果                              │
│   ┌──────────────────┐ │   ┌────────────────────────────────────┐│
│   │                  │ │   │                                    ││
│   │  (代码编辑器)     │ │   │  (只读代码编辑器)                   ││
│   │                  │ │   │                                    ││
│   └──────────────────┘ │   └────────────────────────────────────┘│
├────────────────────────┴────────────────────────────────────────┤
│   选项：                                                         │
│   [ ] 保留注释                                                   │
│   [ ] 格式化输出                                                 │
│   [ ] 添加表选项 (MySQL: ENGINE=InnoDB CHARSET=utf8mb4)          │
│   [ ] 生成 COMMENT ON 语句 (PG) / 内联 COMMENT (MySQL)           │
└─────────────────────────────────────────────────────────────────┘
```

## 4. 技术实现

### 4.1 核心模块

```javascript
// 转换器接口
interface SQLConverter {
    convert(sql: string, options: ConvertOptions): ConvertResult;
}

// 转换选项
interface ConvertOptions {
    direction: 'pg2mysql' | 'mysql2pg';
    type: 'ddl' | 'dml' | 'auto';
    preserveComments: boolean;
    formatOutput: boolean;
    addTableOptions: boolean;  // MySQL 专用
    generateCommentOn: boolean; // PG 专用
}

// 转换结果
interface ConvertResult {
    success: boolean;
    output: string;
    warnings: string[];  // 可能的兼容性警告
}
```

### 4.2 DDL 转换流程

```
输入 SQL
    ↓
预处理（移除/提取注释）
    ↓
解析 CREATE TABLE 结构
    ↓
转换类型映射
    ↓
转换语法（标识符引用、约束语法等）
    ↓
转换注释格式
    ↓
添加目标数据库特定选项
    ↓
格式化输出
```

### 4.3 实现复杂度评估

| 功能模块 | 复杂度 | 优先级 |
|---------|--------|--------|
| DDL CREATE TABLE 转换 | 中 | P0 |
| 数据类型映射 | 低 | P0 |
| 注释格式转换 | 中 | P1 |
| DML SELECT 转换 | 高 | P2 |
| DML INSERT/UPDATE 转换 | 中 | P2 |
| 函数转换 | 高 | P2 |
| 存储过程转换 | 极高 | P3（暂不支持）|

## 5. 第一版实现范围（MVP）

### 包含功能：
1. ✅ PostgreSQL → MySQL DDL 转换
2. ✅ MySQL → PostgreSQL DDL 转换
3. ✅ 数据类型自动映射
4. ✅ 注释格式转换（COMMENT ON ↔ 内联 COMMENT）
5. ✅ 标识符引用转换（双引号 ↔ 反引号）
6. ✅ 自增语法转换（SERIAL ↔ AUTO_INCREMENT）
7. ✅ 格式化输出选项

### 暂不支持：
- ❌ DML 语句转换（SELECT/INSERT/UPDATE/DELETE）
- ❌ 复杂函数转换
- ❌ 存储过程/触发器转换
- ❌ 索引语法差异处理

## 6. 文件结构

```
src/tools/sql/
├── SqlToEntity.jsx          # 已有：SQL 转实体类
├── SqlDialectConvert.jsx    # 新增：SQL 方言转换工具
└── utils/
    ├── mysqlParser.js       # MySQL 解析器（可复用部分）
    ├── postgresParser.js    # PostgreSQL 解析器（可复用部分）
    └── dialectConverter.js  # 转换核心逻辑
```

## 7. 转换示例

### PostgreSQL → MySQL

**输入：**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.name IS '用户名';
```

**输出：**
```sql
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT '用户名',
    `email` TEXT,
    `is_active` TINYINT(1) DEFAULT 1,
    `data` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### MySQL → PostgreSQL

**输入：**
```sql
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `total` DECIMAL(10,2) NOT NULL,
    `status` TINYINT(1) DEFAULT 0 COMMENT '订单状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

**输出：**
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.user_id IS '用户ID';
COMMENT ON COLUMN orders.status IS '订单状态';
```

## 8. 待确认问题

1. **DML 转换是否需要**？如果需要，优先支持哪些语句？
2. **是否需要支持批量转换**？（多个 CREATE TABLE 语句一次性转换）
3. **转换时遇到不支持的语法如何处理**？（报错 vs 跳过 + 警告）
4. **是否需要保存转换历史**？

---

*请评审以上设计方案，确认后我将开始实现。*
