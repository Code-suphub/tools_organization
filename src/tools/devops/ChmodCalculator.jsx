import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    Checkbox,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ToolCard from '../../components/ToolCard';

/**
 * 权限角色定义
 */
const roles = [
    { id: 'owner', label: 'Owner (所有者)', icon: '👤' },
    { id: 'group', label: 'Group (组)', icon: '👥' },
    { id: 'public', label: 'Public (其他用户)', icon: '🌐' },
];

/**
 * 权限类型定义
 */
const permissions = [
    { id: 'read', label: 'Read (读取)', value: 4, code: 'r' },
    { id: 'write', label: 'Write (写入)', value: 2, code: 'w' },
    { id: 'execute', label: 'Execute (执行)', value: 1, code: 'x' },
];

/**
 * Linux 权限计算器
 */
function ChmodCalculator() {
    const theme = useTheme();

    // 状态：owner, group, public 每组的 read, write, execute 状态
    const [state, setState] = useState({
        owner: { read: true, write: true, execute: false }, // 默认 6
        group: { read: true, write: false, execute: false }, // 默认 4
        public: { read: true, write: false, execute: false }, // 默认 4
    });

    const [octal, setOctal] = useState('644');
    const [symbolic, setSymbolic] = useState('-rw-r--r--');

    // 当 State 改变时，更新 Octal 和 Symbolic
    useEffect(() => {
        let newOctal = '';
        let newSymbolic = '-';

        roles.forEach(role => {
            let roleVal = 0;
            permissions.forEach(perm => {
                if (state[role.id][perm.id]) {
                    roleVal += perm.value;
                    newSymbolic += perm.code;
                } else {
                    newSymbolic += '-';
                }
            });
            newOctal += roleVal;
        });

        setOctal(newOctal);
        setSymbolic(newSymbolic);
    }, [state]);

    /**
     * 处理 Checkbox 变化
     */
    const handleCheckChange = (role, perm) => {
        setState(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [perm]: !prev[role][perm]
            }
        }));
    };

    /**
     * 处理 Octal 输入变化
     */
    const handleOctalChange = (e) => {
        const val = e.target.value;
        if (val.length > 3) return;
        if (!/^[0-7]*$/.test(val)) return;

        setOctal(val);

        if (val.length === 3) {
            const nums = val.split('').map(Number);
            const newState = { ...state };

            roles.forEach((role, idx) => {
                const num = nums[idx];
                newState[role.id] = {
                    read: (num & 4) === 4,
                    write: (num & 2) === 2,
                    execute: (num & 1) === 1,
                };
            });
            setState(newState);
        }
    };

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    return (
        <ToolCard
            title="Chmod 权限计算器"
            description="Linux 文件权限计算，可视化转换 rwx 权限和八进制数值"
            showToolbar={false}
        >
            <Grid container spacing={3}>
                {/* 权限选择表格 */}
                <Grid item xs={12} md={7}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                                    <TableRow>
                                        <TableCell>角色 / 权限</TableCell>
                                        {permissions.map(perm => (
                                            <TableCell key={perm.id} align="center">
                                                {perm.label} ({perm.value})
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {roles.map(role => (
                                        <TableRow key={role.id}>
                                            <TableCell component="th" scope="row">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography fontSize="1.2rem">{role.icon}</Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {role.label}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            {permissions.map(perm => (
                                                <TableCell key={perm.id} align="center">
                                                    <Checkbox
                                                        checked={state[role.id][perm.id]}
                                                        onChange={() => handleCheckChange(role.id, perm.id)}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* 结果展示 */}
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '100%',
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            权限结果
                        </Typography>

                        {/* 八进制 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Linux 权限值 (Octal)
                            </Typography>
                            <TextField
                                fullWidth
                                value={octal}
                                onChange={handleOctalChange}
                                placeholder="例如 755"
                                inputProps={{ maxLength: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <Tooltip title="复制命令">
                                            <IconButton onClick={() => copyToClipboard(`chmod ${octal} filename`)}>
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    ),
                                    sx: { fontFamily: 'Fira Code, monospace', fontSize: '1.2rem', fontWeight: 600 }
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                命令: chmod {octal} filename
                            </Typography>
                        </Box>

                        {/* 符号表示 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                符号表示 (Symbolic)
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    borderRadius: 1,
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '1.1rem',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                <Box sx={{ flex: 1 }}>{symbolic}</Box>
                                <Tooltip title="复制">
                                    <IconButton size="small" onClick={() => copyToClipboard(symbolic)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* 常见权限说明 */}
                        <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>常见权限：</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Tooltip title="所有者完全控制，其他人只读">
                                <Box component="span" sx={{ cursor: 'pointer', border: `1px solid ${theme.palette.divider}`, px: 1, borderRadius: 1 }} onClick={() => handleOctalChange({ target: { value: '644' } })}>
                                    644 (文件)
                                </Box>
                            </Tooltip>
                            <Tooltip title="所有者完全控制，其他人读/执行">
                                <Box component="span" sx={{ cursor: 'pointer', border: `1px solid ${theme.palette.divider}`, px: 1, borderRadius: 1 }} onClick={() => handleOctalChange({ target: { value: '755' } })}>
                                    755 (目录/脚本)
                                </Box>
                            </Tooltip>
                            <Tooltip title="所有人完全控制 (危险)">
                                <Box component="span" sx={{ cursor: 'pointer', border: `1px solid ${theme.palette.divider}`, px: 1, borderRadius: 1 }} onClick={() => handleOctalChange({ target: { value: '777' } })}>
                                    777 (全开)
                                </Box>
                            </Tooltip>
                            <Tooltip title="仅所有者可读写">
                                <Box component="span" sx={{ cursor: 'pointer', border: `1px solid ${theme.palette.divider}`, px: 1, borderRadius: 1 }} onClick={() => handleOctalChange({ target: { value: '600' } })}>
                                    600 (私密)
                                </Box>
                            </Tooltip>
                        </Box>

                    </Paper>
                </Grid>
            </Grid>
        </ToolCard>
    );
}

export default ChmodCalculator;
