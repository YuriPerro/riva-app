const OWNER = 'yuribaumgartner';
const REPO = 'riva';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response('Server misconfigured', { status: 500 });
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

  const latestJsonAsset = release.assets.find(
    (a: { name: string }) => a.name === 'latest.json',
  );

  if (!latestJsonAsset) {
    return new Response('latest.json not found in release', { status: 404 });
  }

  const jsonRes = await fetch(latestJsonAsset.url, {
    headers: { ...headers, Accept: 'application/octet-stream' },
    redirect: 'follow',
  });

  if (!jsonRes.ok) {
    return new Response('Failed to fetch latest.json', { status: 502 });
  }

  const latestJson = await jsonRes.json();

  const proxyBaseUrl = new URL(req.url).origin;

  if (latestJson.platforms) {
    for (const platform of Object.values(latestJson.platforms) as { url: string }[]) {
      if (platform.url) {
        const filename = platform.url.split('/').pop();
        platform.url = `${proxyBaseUrl}/download/${filename}`;
      }
    }
  }

  return new Response(JSON.stringify(latestJson), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
