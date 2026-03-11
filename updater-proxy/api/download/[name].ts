const OWNER = 'YuriPerro';
const REPO = 'riva-app';

const PLATFORM_PATTERNS: Record<string, RegExp> = {
  mac: /\.dmg$/,
  'mac-intel': /x86_64\.dmg$/,
  'mac-arm': /aarch64\.dmg$/,
  windows: /\.msi$/,
  linux: /\.AppImage$/,
};

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response('Server misconfigured', { status: 500 });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const nameParam = decodeURIComponent(segments[segments.length - 1]);

  if (!nameParam) {
    return new Response('Missing asset name', { status: 400 });
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'riva-updater-proxy',
  };

  const releaseRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
    { headers },
  );

  if (!releaseRes.ok) {
    return new Response('No release found', { status: 404 });
  }

  const release = await releaseRes.json();

  const pattern = PLATFORM_PATTERNS[nameParam];
  const asset = pattern
    ? release.assets.find((a: { name: string }) => pattern.test(a.name))
    : release.assets.find((a: { name: string }) => a.name === nameParam);

  if (!asset) {
    return new Response(`Asset "${nameParam}" not found`, { status: 404 });
  }

  const downloadRes = await fetch(asset.url, {
    headers: { ...headers, Accept: 'application/octet-stream' },
    redirect: 'manual',
  });

  const redirectUrl = downloadRes.headers.get('Location');

  if (!redirectUrl) {
    return new Response('Failed to get download URL', { status: 502 });
  }

  return Response.redirect(redirectUrl, 302);
}
