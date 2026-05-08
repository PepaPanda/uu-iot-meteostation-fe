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

    if (path === 'notifications') {
        return JSON.stringify({
            onlyUnacknowledged:
                url.searchParams.get('onlyUnacknowledged') === 'true'
        });
    }

    if (path === 'users') {
        return JSON.stringify({
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: Number(url.searchParams.get('pageSize') ?? 20),
            role: url.searchParams.get('role') ?? undefined,
            search: url.searchParams.get('search') ?? undefined
        });
    }

    if (path.startsWith('telemetry/history/')) {
        return JSON.stringify({
            from: url.searchParams.get('from'),
            to: url.searchParams.get('to'),
            limit: Number(url.searchParams.get('limit') ?? 500)
        });
    }

    if (path.startsWith('telemetry/trends/')) {
        return JSON.stringify({
            from: url.searchParams.get('from'),
            to: url.searchParams.get('to'),
            bucket: url.searchParams.get('bucket') ?? '1h'
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

        if (cookie) {
            headers.Cookie = cookie;
        }

        if (body) {
            headers['Content-Length'] = Buffer.byteLength(body);
        }

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

                res.on('data', (chunk) => {
                    chunks.push(Buffer.from(chunk));
                });

                res.on('end', () => {
                    const responseHeaders = new Headers();

                    responseHeaders.set(
                        'Content-Type',
                        String(
                            res.headers['content-type'] ??
                            'application/json'
                        )
                    );

                    const setCookie = res.headers['set-cookie'];

                    if (setCookie) {
                        for (const cookie of setCookie) {
                            responseHeaders.append('Set-Cookie', cookie);
                        }
                    }

                    const status = res.statusCode ?? 500;

                    const responseBody =
                        status === 204 || status === 304
                            ? null
                            : Buffer.concat(chunks).toString('utf-8');

                    resolve(
                        new Response(responseBody, {
                            status,
                            headers: responseHeaders
                        })
                    );
                });
            }
        );

        req.on('error', reject);

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

export async function GET({
                              request,
                              params
                          }: {
    request: Request;
    params: { path: string };
}) {
    return proxy(request, params.path);
}

export async function POST({
                               request,
                               params
                           }: {
    request: Request;
    params: { path: string };
}) {
    return proxy(request, params.path);
}

export async function PATCH({
                                request,
                                params
                            }: {
    request: Request;
    params: { path: string };
}) {
    return proxy(request, params.path);
}

export async function DELETE({
                                 request,
                                 params
                             }: {
    request: Request;
    params: { path: string };
}) {
    return proxy(request, params.path);
}