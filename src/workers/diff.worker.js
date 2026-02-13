import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

self.onmessage = (e) => {
    const { left, right, mode = 'lines', wrapJson = false } = e.data;
    const start = performance.now();

    try {
        let l = left;
        let r = right;

        // 如果是 JSON 模式，且开启了自动格式化，在 Worker 中处理，避免主线程卡死
        if (wrapJson) {
            try {
                const parsedL = JSON.parse(left);
                l = JSON.stringify(parsedL, null, 2);
            } catch (e) {
                // Ignore parse errors, use raw text
            }
            try {
                const parsedR = JSON.parse(right);
                r = JSON.stringify(parsedR, null, 2);
            } catch (e) {
                // Ignore parse errors, use raw text
            }
        }

        let diffs;
        if (mode === 'lines') {
            const a = dmp.diff_linesToChars_(l, r);
            const lineText1 = a.chars1;
            const lineText2 = a.chars2;
            const lineArray = a.lineArray;
            diffs = dmp.diff_main(lineText1, lineText2, false);
            dmp.diff_charsToLines_(diffs, lineArray);
        } else {
            diffs = dmp.diff_main(l, r);
            if (mode === 'words') {
                dmp.diff_cleanupSemantic(diffs);
            }
        }

        // Flatten diffs into lines for efficient virtualization
        // Each line: { type: 'added'|'removed'|'unchanged', content: string, originalIndex: number }
        const lines = [];
        const diffIndices = []; // Indices of lines that are changes

        diffs.forEach(([op, text], chunkIndex) => {
            const type = op === 1 ? 'added' : op === -1 ? 'removed' : 'unchanged';
            // Important: split but keep trailing newlines logic consistent
            // diff-match-patch might end chunks with or without \n
            const chunkLines = text.split('\n');

            chunkLines.forEach((lineText, i) => {
                // If it's the last empty string from split, and it wasn't the only thing, skip it
                // (unless the text actually ended with a \n)
                if (i === chunkLines.length - 1 && lineText === '' && chunkLines.length > 1) return;

                if (type !== 'unchanged') {
                    diffIndices.push(lines.length);
                }

                lines.push({
                    type,
                    content: lineText,
                    chunkIndex
                });
            });
        });

        const end = performance.now();
        self.postMessage({
            result: lines,
            diffIndices,
            duration: Math.round(end - start),
            stats: calculateStats(diffs)
        });
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};

function calculateStats(diffs) {
    let added = 0;
    let removed = 0;
    diffs.forEach(([op, text]) => {
        if (op === 1) added += text.split('\n').filter(l => l.trim()).length || 1;
        if (op === -1) removed += text.split('\n').filter(l => l.trim()).length || 1;
    });
    return { added, removed };
}
