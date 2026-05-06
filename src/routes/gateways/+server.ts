import { request as httpRequest } from 'node:http';

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 3000;

function buildGetBody(path: string, url: URL): string | null {
    if (path === 'gateways') {
        return JSON.stringify({
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: Number(url.searchParams.get('pageSize') ?? 20),
            search: url.searchParams.get('search') ?? undefined
        });
    }

    return null;
}

async function proxy(request: Request, path: string) {
    const url = new URL(request.url);
    const backendPath = `/api/${path}`;

    let body: string | null = null;

    if (request.method === 'GET') {
        body = buildGetBody(path, url);
    } else {
        body = await request.text();
    }

    return new Promise<Response>((resolve, reject) => {
        const headers: Record<string, string | number> = {
            'Content-Type': 'application/json'
        };

        const cookie = request.headers.get('cookie');
        if (cookie) headers.Cookie = cookie;

        if (body) headers['Content-Length'] = Buffer.byteLength(body);

        const req = httpRequest(
            {
                hostname: BACKEND_HOST,
                port: BACKEND_PORT,
                path: backendPath,
                method: request.method,
                headers
            },
            (res) => {
                const chunks: Buffer[] = [];

                res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

                res.on('end', () => {
                    const responseHeaders = new Headers();

                    responseHeaders.set(
                        'Content-Type',
                        String(res.headers['content-type'] ?? 'application/json')
                    );

                    const setCookie = res.headers['set-cookie'];
                    if (setCookie) {
                        for (const cookie of setCookie) {
                            responseHeaders.append('Set-Cookie', cookie);
                        }
                    }

                    resolve(
                        new Response(Buffer.concat(chunks).toString('utf-8'), {
                            status: res.statusCode ?? 500,
                            headers: responseHeaders
                        })
                    );
                });
            }
        );

        req.on('error', reject);

        if (body) req.write(body);
        req.end();
    });
}

export async function GET({ params }: { params: { path: string } }) {
    return Response.json({
        ok: true,
        path: params.path
    });
}

export async function POST({ params }: { params: { path: string } }) {
    return Response.json({
        ok: true,
        path: params.path
    });
}

export async function PATCH({
                                request,
                                params
                            }: {
    request: Request;
    params: { path: string[] };
}) {
    return proxy(request, params.path.join('/'));
}

export async function DELETE({
                                 request,
                                 params
                             }: {
    request: Request;
    params: { path: string[] };
}) {
    return proxy(request, params.path.join('/'));
}