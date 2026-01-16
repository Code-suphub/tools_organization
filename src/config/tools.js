/**
 * 工具注册配置
 * 定义所有工具的元信息，用于导航、搜索和渲染
 */

// 工具分类定义
export const categories = [
    {
        id: 'json',
        name: 'JSON 工具',
        icon: 'DataObject',
        description: 'JSON 格式化、校验、对比等功能',
    },
    {
        id: 'time',
        name: '时间工具',
        icon: 'Schedule',
        description: '时间戳转换、日期计算等功能',
    },
    {
        id: 'encode',
        name: '编码工具',
        icon: 'Code',
        description: 'Base64、URL 编码解码等功能',
    },
    {
        id: 'hash',
        name: '加密哈希',
        icon: 'Lock',
        description: 'MD5、SHA 等哈希算法',
    },
    {
        id: 'text',
        name: '文本处理',
        icon: 'TextFields',
        description: '文本对比、格式转换等功能',
    },
    {
        id: 'uuid',
        name: '标识符生成',
        icon: 'Fingerprint',
        description: 'UUID、Token 生成等功能',
    },
    {
        id: 'qrcode',
        name: '二维码工具',
        icon: 'QrCode',
        description: '二维码生成与解码',
    },
    {
        id: 'format',
        name: '代码格式化',
        icon: 'FormatAlignLeft',
        description: 'HTML、CSS、SQL 等格式化',
    },
];

// 工具列表定义
export const tools = [
    // JSON 工具集
    {
        id: 'json-format',
        name: 'JSON 格式化',
        description: '美化、压缩和校验 JSON 数据',
        category: 'json',
        path: '/tools/json/format',
        icon: 'DataObject',
        tags: ['json', 'format', 'beautify', 'validate', '格式化', '美化'],
        isNew: true,
        priority: 'P0',
    },
    {
        id: 'json-diff',
        name: 'JSON 对比',
        description: '比较两个 JSON 结构的差异',
        category: 'json',
        path: '/tools/json/diff',
        icon: 'Compare',
        tags: ['json', 'diff', 'compare', '对比', '差异'],
        priority: 'P0',
    },

    // 时间工具集
    {
        id: 'timestamp',
        name: '时间戳转换',
        description: 'Unix 时间戳与人类可读时间互转',
        category: 'time',
        path: '/tools/time/timestamp',
        icon: 'Schedule',
        tags: ['timestamp', 'unix', 'date', 'time', '时间戳', '日期'],
        isNew: true,
        priority: 'P0',
    },

    // 编码工具集
    {
        id: 'base64',
        name: 'Base64 编码',
        description: 'Base64 编码与解码转换',
        category: 'encode',
        path: '/tools/encode/base64',
        icon: 'Code',
        tags: ['base64', 'encode', 'decode', '编码', '解码'],
        priority: 'P0',
    },
    {
        id: 'url-encode',
        name: 'URL 编码',
        description: 'URL 参数编码与解码',
        category: 'encode',
        path: '/tools/encode/url',
        icon: 'Link',
        tags: ['url', 'encode', 'decode', 'percent', '编码', '解码'],
        priority: 'P0',
    },

    // 哈希工具集
    {
        id: 'hash',
        name: '哈希生成',
        description: 'MD5、SHA-1、SHA-256 等哈希算法',
        category: 'hash',
        path: '/tools/hash/generator',
        icon: 'Lock',
        tags: ['md5', 'sha', 'hash', '哈希', '加密'],
        priority: 'P0',
    },

    // 文本工具集
    {
        id: 'text-diff',
        name: '文本对比',
        description: '比较两段文本的差异，高亮显示变更',
        category: 'text',
        path: '/tools/text/diff',
        icon: 'Difference',
        tags: ['text', 'diff', 'compare', '文本', '对比'],
        priority: 'P0',
    },

    // UUID 工具
    {
        id: 'uuid',
        name: 'UUID 生成器',
        description: '生成各版本的 UUID 唯一标识符',
        category: 'uuid',
        path: '/tools/uuid/generator',
        icon: 'Fingerprint',
        tags: ['uuid', 'guid', 'unique', '唯一标识'],
        isNew: true,
        priority: 'P0',
    },

    // 二维码工具
    {
        id: 'qrcode-generate',
        name: '二维码生成',
        description: '根据文本或 URL 生成二维码图片',
        category: 'qrcode',
        path: '/tools/qrcode/generate',
        icon: 'QrCode',
        tags: ['qrcode', 'qr', 'generate', '二维码', '生成'],
        priority: 'P0',
    },
];

/**
 * 按分类获取工具列表
 * @param {string} categoryId - 分类 ID
 * @returns {Array} 该分类下的工具列表
 */
export const getToolsByCategory = (categoryId) => {
    return tools.filter(tool => tool.category === categoryId);
};

/**
 * 根据关键词搜索工具
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 匹配的工具列表
 */
export const searchTools = (keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return tools.filter(tool =>
        tool.name.toLowerCase().includes(lowerKeyword) ||
        tool.description.toLowerCase().includes(lowerKeyword) ||
        tool.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
};

/**
 * 获取 P0 优先级的工具（首页推荐）
 * @returns {Array} P0 工具列表
 */
export const getFeaturedTools = () => {
    return tools.filter(tool => tool.priority === 'P0');
};

/**
 * 获取新工具（带 NEW 标签）
 * @returns {Array} 新工具列表
 */
export const getNewTools = () => {
    return tools.filter(tool => tool.isNew);
};

export default tools;
