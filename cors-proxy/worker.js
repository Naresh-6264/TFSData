/**
 * Casepoint CORS Proxy — Cloudflare Worker
 *
 * SETUP:
 *   1. Go to https://workers.cloudflare.com and sign up (free)
 *   2. Click "Create a Service" → give it a name (e.g., "casepoint-proxy")
 *   3. Paste this entire file into the editor
 *   4. Click "Save and Deploy"
 *   5. Your proxy URL will be: https://casepoint-proxy.<your-subdomain>.workers.dev/?url=
 *   6. Paste that URL into the "CORS Proxy URL" field in any tool
 *
 * HOW IT WORKS:
 *   The tool sends: https://your-proxy.workers.dev/?url=https%3A%2F%2Ftfs.casepoint.in%2F...
 *   This worker fetches the TFS URL server-side (no CORS issue) and returns the
 *   response with Access-Control-Allow-Origin headers so the browser accepts it.
 *
 * SECURITY:
 *   - Only allows requests to tfs.casepoint.in (configurable below)
 *   - Forwards Authorization headers (PAT) directly to TFS
 *   - Does not store or log any data
 */

const ALLOWED_ORIGINS = ['https://tfs.casepoint.in'];

export default {
    async fetch(request) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }

        // Extract target URL
        const url = new URL(request.url);
        const target = url.searchParams.get('url') || decodeURIComponent(url.pathname.slice(1));

        if (!target) {
            return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Security: only allow requests to TFS
        const targetUrl = new URL(target);
        const isAllowed = ALLOWED_ORIGINS.some(origin => target.startsWith(origin));
        if (!isAllowed) {
            return new Response(JSON.stringify({ error: 'Target not in allowed origins' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Forward the request to TFS
        const headers = new Headers();
        const authHeader = request.headers.get('Authorization');
        if (authHeader) headers.set('Authorization', authHeader);
        headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json');

        try {
            const resp = await fetch(target, {
                method: request.method,
                headers: headers,
                body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text()
            });

            // Return response with CORS headers
            const newHeaders = new Headers(resp.headers);
            newHeaders.set('Access-Control-Allow-Origin', '*');
            newHeaders.set('Access-Control-Expose-Headers', '*');

            return new Response(resp.body, {
                status: resp.status,
                statusText: resp.statusText,
                headers: newHeaders
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Proxy fetch failed: ' + err.message }), {
                status: 502,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
    }
};
