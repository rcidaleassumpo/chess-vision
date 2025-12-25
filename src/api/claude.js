const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const CHESS_ANALYSIS_PROMPT = `Look at this chess diagram. Return ONLY the FEN string, nothing else.

In printed diagrams: WHITE pieces are HOLLOW (outline), BLACK pieces are SOLID (filled).

Example FEN format: r1b1r1k1/pp3ppp/2n1pn2/3p2N1/8/1B4P1/PP2PPBP/R2QR1K1 w - - 0 1`;

export async function analyzeChessPosition(base64Image, apiKey) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: CHESS_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Invalid API response format');
  }

  return data.content[0].text.trim();
}
