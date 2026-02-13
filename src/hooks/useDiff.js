import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 高性能对比 Hook
 * 使用 Web Worker 处理计算逻辑
 */
export const useDiff = (left, right, mode = 'lines', options = {}) => {
    const [result, setResult] = useState(null);
    const [diffIndices, setDiffIndices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [stats, setStats] = useState({ added: 0, removed: 0 });
    const workerRef = useRef(null);

    useEffect(() => {
        // 初始化 Worker
        // 注意：在 Vite 中使用 new Worker(new URL(path, import.meta.url))
        workerRef.current = new Worker(
            new URL('../workers/diff.worker.js', import.meta.url),
            { type: 'module' }
        );

        workerRef.current.onmessage = (e) => {
            const { result, diffIndices, duration, stats, error } = e.data;
            if (error) {
                console.error('Diff Worker Error:', error);
            } else {
                setResult(result);
                setDiffIndices(diffIndices || []);
                setDuration(duration);
                setStats(stats);
            }
            setLoading(false);
        };

        return () => {
            workerRef.current.terminate();
        };
    }, []);

    useEffect(() => {
        if (!left && !right) {
            setResult(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            workerRef.current.postMessage({ left, right, mode, ...options });
        }, 400); // 防抖

        return () => clearTimeout(timer);
    }, [left, right, mode, JSON.stringify(options)]);

    return { result, diffIndices, loading, duration, stats };
};
