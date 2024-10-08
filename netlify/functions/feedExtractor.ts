import { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
  const url = event.queryStringParameters?.url

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL parameter is required' }),
    }
  }

  console.log(`Fetching ${url}`);

  try {
    const html = await fetchHtml(url)
    if (html.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Cannot fetch HTML' }),
      }
    }

    const urls = extractFeedUrls(html, url)

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        // from https://rss2json.com/
        "Access-Control-Expose-Headers": "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range",
      },
      body: JSON.stringify({ urls }),
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch or parse the webpage' }),
    }
  }
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.text()
}

function extractFeedUrls(html: string, baseUrl: string): string[] {
  const regex = /<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const feedUrls: string[] = []
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const feedUrl = new URL(match[1], baseUrl).href
    feedUrls.push(feedUrl)
  }

  return feedUrls
}

export { handler }
