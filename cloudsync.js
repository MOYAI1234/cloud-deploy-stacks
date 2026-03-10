/**
 * CloudSync — 本地优先 + 云端同步模块
 *
 * 用法：
 *   1. 在应用启动前调用 CloudSync.pull()，从 D1 拉取最新数据写入 localStorage
 *   2. 在每次数据写入 localStorage 后调用 CloudSync.schedulePush()，1秒防抖后推送
 *
 * 冲突策略：时间戳比较，云端更新才覆盖本地（保护断网离线修改）
 *
 * 使用示例：
 *   CloudSync.pull().finally(() => {
 *       // 渲染应用
 *   });
 */
const CloudSync = (() => {
    const API_URL = '/api/data';

    // 需要同步的 localStorage key 列表，按实际应用修改
    const SYNC_KEYS = [
        'your_key_1',
        'your_key_2',
        // ...
    ];

    let pushTimer = null;

    const pull = async () => {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) return;
            const { data, updated_at } = await res.json();
            if (!data || Object.keys(data).length === 0) return;

            // 时间戳比较：只有云端更新时才覆盖本地
            const localUpdatedAt = localStorage.getItem('_local_updated_at');
            if (localUpdatedAt && updated_at && updated_at <= localUpdatedAt) return;

            Object.entries(data).forEach(([key, val]) => {
                if (!key.startsWith('_')) {
                    localStorage.setItem(key, JSON.stringify(val));
                }
            });
            if (updated_at) localStorage.setItem('_local_updated_at', updated_at);
        } catch (e) {
            console.warn('[CloudSync] pull failed:', e.message);
        }
    };

    const push = async () => {
        const payload = {};
        SYNC_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) {
                try { payload[key] = JSON.parse(val); } catch {}
            }
        });
        try {
            const res = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) localStorage.setItem('_local_updated_at', new Date().toISOString());
        } catch (e) {
            console.warn('[CloudSync] push failed:', e.message);
        }
    };

    const schedulePush = () => {
        clearTimeout(pushTimer);
        pushTimer = setTimeout(push, 1000);
    };

    return { pull, push, schedulePush };
})();
