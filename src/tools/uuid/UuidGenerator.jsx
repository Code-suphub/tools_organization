import React, { useState, useCallback } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Slider,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { v4 as uuidv4 } from 'uuid';

import ToolCard from '../../components/ToolCard';

/**
 * UUID 生成器
 * 
 * 功能：
 * - 生成 UUID v4
 * - 批量生成
 * - 一键复制
 */
function UuidGenerator() {
    const theme = useTheme();

    // 状态管理
    const [count, setCount] = useState(1);
    const [uuids, setUuids] = useState([]);
    const [uppercase, setUppercase] = useState(false);
    const [withHyphens, setWithHyphens] = useState(true);

    /**
     * 生成 UUID
     */
    const generateUuids = useCallback(() => {
        const newUuids = [];
        for (let i = 0; i < count; i++) {
            let uuid = uuidv4();

            // 处理格式
            if (!withHyphens) {
                uuid = uuid.replace(/-/g, '');
            }
            if (uppercase) {
                uuid = uuid.toUpperCase();
            }

            newUuids.push(uuid);
        }
        setUuids(newUuids);
    }, [count, uppercase, withHyphens]);

    /**
     * 复制单个 UUID
     */
    const copySingle = async (uuid) => {
        try {
            await navigator.clipboard.writeText(uuid);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    /**
     * 复制所有 UUID
     */
    const copyAll = async () => {
        try {
            await navigator.clipboard.writeText(uuids.join('\n'));
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    /**
     * 清空
     */
    const handleClear = () => {
        setUuids([]);
    };

    // 工具栏按钮配置
    const actions = [
        {
            label: uppercase ? '大写 ✓' : '大写',
            onClick: () => setUppercase(!uppercase),
            variant: uppercase ? 'contained' : 'outlined',
            color: uppercase ? 'primary' : 'inherit',
        },
        {
            label: withHyphens ? '带连字符 ✓' : '无连字符',
            onClick: () => setWithHyphens(!withHyphens),
            variant: withHyphens ? 'contained' : 'outlined',
            color: withHyphens ? 'primary' : 'inherit',
        },
    ];

    return (
        <ToolCard
            title="UUID 生成器"
            description="生成符合 RFC 4122 规范的 UUID v4 唯一标识符"
            actions={actions}
            copyContent={uuids.join('\n')}
            onClear={handleClear}
        >
            <Grid container spacing={3}>
                {/* 生成配置 */}
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
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            生成配置
                        </Typography>

                        <Grid container spacing={3} alignItems="center">
                            {/* 数量滑块 */}
                            <Grid item xs={12} sm={8}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    生成数量: {count}
                                </Typography>
                                <Slider
                                    value={count}
                                    onChange={(_, value) => setCount(value)}
                                    min={1}
                                    max={50}
                                    marks={[
                                        { value: 1, label: '1' },
                                        { value: 10, label: '10' },
                                        { value: 25, label: '25' },
                                        { value: 50, label: '50' },
                                    ]}
                                    sx={{ width: '100%' }}
                                />
                            </Grid>

                            {/* 数量输入 */}
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    type="number"
                                    label="数量"
                                    value={count}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setCount(Math.min(Math.max(val, 1), 100));
                                    }}
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 1, max: 100 }}
                                />
                            </Grid>
                        </Grid>

                        {/* 生成按钮 */}
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<RefreshIcon />}
                            onClick={generateUuids}
                            fullWidth
                            sx={{ mt: 3 }}
                        >
                            生成 {count} 个 UUID
                        </Button>
                    </Paper>
                </Grid>

                {/* 生成结果 */}
                {uuids.length > 0 && (
                    <Grid item xs={12}>
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
                                    py: 1.5,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.02)'
                                        : 'rgba(0,0,0,0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Typography variant="body2" fontWeight={500} color="text.secondary">
                                    生成结果 ({uuids.length} 个)
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<ContentCopyIcon fontSize="small" />}
                                    onClick={copyAll}
                                >
                                    复制全部
                                </Button>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    maxHeight: 400,
                                    overflow: 'auto',
                                }}
                            >
                                {uuids.map((uuid, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 1.5,
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? 'rgba(255,255,255,0.03)'
                                                : 'rgba(0,0,0,0.02)',
                                            '&:last-child': { mb: 0 },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ width: 24, textAlign: 'right' }}
                                            >
                                                {index + 1}.
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: 'Fira Code, monospace',
                                                    fontSize: '14px',
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                {uuid}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="复制">
                                            <IconButton
                                                size="small"
                                                onClick={() => copySingle(uuid)}
                                            >
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                )}

                {/* 说明 */}
                <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                        💡 <strong>UUID v4</strong> 是一种基于随机数生成的通用唯一标识符，
                        格式为 <code style={{
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'Fira Code, monospace',
                        }}>xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</code>。
                        理论上碰撞概率极低，可安全用于分布式系统中的唯一标识。
                    </Typography>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default UuidGenerator;
