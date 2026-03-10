// HTTP Basic Auth 中间件
// 在 Cloudflare Pages 环境变量中设置 AUTH_PASSWORD
export async function onRequest({ request, next, env }) {
    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Basic ')) {
        const base64 = authHeader.slice(6);
        const decoded = atob(base64);
        const colonIndex = decoded.indexOf(':');
        const password = decoded.slice(colonIndex + 1);
        const expected = env.AUTH_PASSWORD;

        if (expected && password === expected) {
            return next();
        }
    }

    return new Response('Unauthorized', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="App"',
            'Content-Type': 'text/plain'
        }
    });
}
