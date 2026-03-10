// GET /api/data — 返回全量数据（含 updated_at 用于多端冲突判断）
export async function onRequestGet({ env }) {
    try {
        const row = await env.DB.prepare(
            'SELECT payload, updated_at FROM app_data WHERE id = 1'
        ).first();

        if (!row) {
            return Response.json({ ok: true, data: {}, updated_at: null });
        }

        return Response.json({
            ok: true,
            data: JSON.parse(row.payload),
            updated_at: row.updated_at
        });
    } catch (e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 });
    }
}

// PUT /api/data — 覆盖保存全量数据
export async function onRequestPut({ request, env }) {
    try {
        const payload = await request.json();
        const now = new Date().toISOString();

        await env.DB.prepare(
            `INSERT INTO app_data (id, payload, updated_at) VALUES (1, ?1, ?2)
             ON CONFLICT(id) DO UPDATE SET payload = ?1, updated_at = ?2`
        ).bind(JSON.stringify(payload), now).run();

        return Response.json({ ok: true });
    } catch (e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 });
    }
}
