# SQL 对比工具设计方案

## 1. 需求分析

### 1.1 功能需求来源
根据「工具网站功能需求汇总.md」中的描述：

> **SQL 对比工具** - 比较两个 SQL 脚本的差异
> - 逐字符/逐单词比较
> - 高亮显示添加/删除的内容
> - 支持粘贴文本或上传文件

### 1.2 用户场景
1. **数据库迁移**：对比新旧版本的建表语句、存储过程
2. **代码审查**：检查 SQL 查询语句的变更
3. **问题排查**：快速定位两个查询语句的差异
4. **版本管理**：比较不同版本的 DDL 脚本

---

## 2. 功能设计

### 2.1 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 实时对比 | 输入内容后自动计算并显示差异 | 必须 |
| 多种对比模式 | 支持逐行、逐词、逐字符对比 | 必须 |
| 差异高亮 | 红色标记删除、绿色标记新增 | 必须 |
| 格式化预处理 | 先格式化 SQL 再对比（消除格式干扰） | 建议 |
| 忽略选项 | 忽略大小写/忽略空白/忽略注释 | 建议 |
| 语法高亮 | 输入区域支持 SQL 语法高亮 | 建议 |
| 交换左右 | 一键交换原始/修改内容 | 必须 |
| 统计信息 | 显示新增/删除的行数或字符数 | 必须 |

### 2.2 可选增强功能

| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 文件上传 | 支持上传 .sql 文件进行对比 | ⭐ |
| 结果导出 | 导出 HTML/Markdown 格式的对比报告 | ⭐⭐ |
| SQL 方言选择 | 不同方言（MySQL/PostgreSQL/Oracle）的格式化 | ⭐⭐ |
| 并排视图 | 左右并排显示差异（类似 Git diff） | ⭐⭐⭐ |

---

## 3. 技术方案

### 3.1 方案 A：基于 TextDiff 扩展（推荐）

**思路**：复用现有的 `TextDiff` 组件逻辑，增加 SQL 特有的预处理和配置选项。

**优点**：
- 复用成熟的 diff 算法（`diff` 库）
- 开发速度快，代码复用度高
- UI 风格与现有工具保持一致

**实现步骤**：
1. 创建 `SqlDiff.jsx` 组件
2. 使用 `CodeEditor` 组件替代 `TextField`（提供 SQL 语法高亮）
3. 增加"格式化后对比"选项（调用 `sql-formatter`）
4. 增加忽略选项（大小写、空白、注释）
5. 复用 TextDiff 的 diff 渲染逻辑

**核心代码结构**：
```jsx
import { format } from 'sql-formatter';
import { diffLines, diffWords, diffChars } from 'diff';
import CodeEditor from '../../components/CodeEditor';

function SqlDiff() {
    const [leftSql, setLeftSql] = useState('');
    const [rightSql, setRightSql] = useState('');
    const [diffMode, setDiffMode] = useState('lines');
    const [formatBeforeDiff, setFormatBeforeDiff] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    
    // 预处理 SQL
    const preprocess = (sql) => {
        let result = sql;
        if (formatBeforeDiff) {
            result = format(result, { language: 'mysql' });
        }
        if (ignoreCase) {
            result = result.toLowerCase();
        }
        if (ignoreWhitespace) {
            result = result.replace(/\s+/g, ' ').trim();
        }
        return result;
    };
    
    // 计算 diff
    const diffResult = useMemo(() => {
        const left = preprocess(leftSql);
        const right = preprocess(rightSql);
        return diffLines(left, right);
    }, [leftSql, rightSql, ...options]);
    
    // ... 渲染逻辑
}
```

### 3.2 方案 B：并排差异视图

**思路**：实现类似于 GitHub/VS Code 的并排 diff 视图，左右同时显示对应的行。

**优点**：
- 视觉效果更专业
- 行号对齐，便于定位

**缺点**：
- 实现复杂度较高
- 需要处理行号同步、滚动同步等问题

**适用场景**：如果用户需要更专业的代码审查体验

---

## 4. UI 设计

### 4.1 布局方案

**推荐：三栏布局**（与现有 TextDiff、JsonDiff 保持一致）

```
┌─────────────────────────────────────────────────────────────┐
│  SQL 对比工具                                    [交换] [清空] │
├─────────────────────────────────────────────────────────────┤
│        [逐行]  [逐词]  [逐字符]                              │
│  [ ] 格式化后对比  [ ] 忽略大小写  [ ] 忽略空白  SQL方言: [MySQL▼] │
├─────────────────┬─────────────────┬─────────────────────────┤
│   原始 SQL      │   对比结果       │   修改后 SQL            │
│                 │  -3 行 +5 行     │                         │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────────────┐  │
│  │ SELECT    │  │  │ SELECT... │  │  │ SELECT            │  │
│  │ FROM      │  │  │ -FROM old │  │  │ FROM              │  │
│  │ WHERE     │  │  │ +FROM new │  │  │ JOIN              │  │
│  │           │  │  │           │  │  │ WHERE             │  │
│  └───────────┘  │  └───────────┘  │  └───────────────────┘  │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 4.2 配置选项区

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 对比模式 | Toggle | 逐行 | 逐行/逐词/逐字符 |
| 格式化后对比 | Checkbox | 关 | 先格式化 SQL 再进行对比 |
| 忽略大小写 | Checkbox | 关 | 对比时不区分大小写 |
| 忽略空白 | Checkbox | 关 | 忽略空格和换行差异 |
| SQL 方言 | Select | MySQL | MySQL/PostgreSQL/Oracle/SQL Server |

---

## 5. 实现计划

### 5.1 阶段一：基础功能（推荐先实现）

- [x] 创建 `SqlDiff.jsx` 组件
- [x] 使用 CodeEditor 实现带语法高亮的输入
- [x] 实现三种对比模式（逐行/逐词/逐字符）
- [x] 实现差异高亮显示
- [x] 添加统计信息（新增/删除数量）
- [x] 添加交换和清空按钮

### 5.2 阶段二：增强功能

- [ ] 格式化后对比选项
- [ ] 忽略大小写选项
- [ ] 忽略空白选项
- [ ] SQL 方言选择

### 5.3 阶段三：高级功能（可选）

- [ ] 文件上传 .sql
- [ ] 导出对比报告
- [ ] 并排视图模式

---

## 6. 与现有工具的关系

| 工具 | 定位 | 区别 |
|------|------|------|
| 文本对比 | 通用文本差异对比 | 无语法高亮，无格式化预处理 |
| JSON 对比 | JSON 结构差异对比 | 针对 JSON 语义对比 |
| **SQL 对比** | SQL 脚本差异对比 | SQL 语法高亮，支持格式化、忽略选项 |

---

## 7. 讨论问题

### Q1: 是否需要"格式化后对比"功能？

**背景**：两个功能相同但格式不同的 SQL 可能产生大量无意义的差异。

**选项**：
- A. 必须有，是 SQL 对比的核心价值
- B. 作为可选功能，默认关闭
- C. 暂不实现，后续加入

### Q2: 是否需要支持并排视图？

**背景**：并排视图更专业，但实现复杂度较高。

**选项**：
- A. 首版就支持
- B. 作为二期功能
- C. 不需要，三栏布局已足够

### Q3: 忽略注释功能是否需要？

**背景**：SQL 注释（`--` 和 `/* */`）有时会干扰对比结果。

**选项**：
- A. 需要，加入忽略选项
- B. 不需要，用户可手动删除注释

---

## 8. 结论

**推荐方案**：基于 TextDiff 扩展（方案 A），采用三栏布局

**预计开发时间**：
- 基础功能：1-2 小时
- 增强功能：1 小时
- 总计：约 2-3 小时

**下一步**：请确认设计方案后开始实现。

---

*文档创建时间：2026-01-21*
*作者：AI Assistant*
