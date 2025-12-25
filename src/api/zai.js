const ZAI_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

const CHESS_ANALYSIS_PROMPT = `You are a chess diagram reader. Analyze the chess position in this image.

Read the board square by square, from rank 8 (top) to rank 1 (bottom), file a to h (left to right).

In printed chess diagrams:
- WHITE pieces are HOLLOW/OUTLINE (unfilled, you can see through them)
- BLACK pieces are SOLID/FILLED (completely dark/shaded)

Return ONLY the FEN string for this position. Nothing else.
Example: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;

export async function analyzeChessPosition(base64Image, apiKey) {
  const response = await fetch(ZAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4.6v',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: CHESS_ANALYSIS_PROMPT
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid API response format');
  }

  const content = data.choices[0].message.content.trim();

  // Try to extract just the FEN if there's extra text
  const fenPattern = content.match(/([rnbqkpRNBQKP1-8]{1,8}\/){7}[rnbqkpRNBQKP1-8]{1,8}(\s+[wb]\s+[KQkq-]+\s+[a-h1-8-]+\s+\d+\s+\d+)?/);
  if (fenPattern) {
    return fenPattern[0].trim();
  }

  return content;
}
