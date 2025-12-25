const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

const CHESS_ANALYSIS_PROMPT = `Analyze this chess diagram and return the FEN notation.

CRITICAL - PIECE COLORS:
- WHITE pieces = HOLLOW/OUTLINE (empty inside, light)
- BLACK pieces = SOLID/FILLED (dark, shaded)

PIECE SHAPES:
- King: tall with cross on top
- Queen: crown with ball/spikes
- Rook: castle tower with battlements
- Bishop: tall with diagonal slit/cut
- Knight: horse head
- Pawn: small, round top

READ CAREFULLY:
1. Start from rank 8 (top row) to rank 1 (bottom row)
2. Read each rank left to right (a-h files)
3. The board is shown from White's perspective (white pieces at bottom)

VERIFY:
- Each side should have at most 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights, 8 pawns
- Total max 16 pieces per side

Return ONLY the FEN string. Example format:
r1b1r1k1/pp3ppp/2n1pn2/3p2N1/8/1B4P1/PP2PPBP/R2QR1K1 w - - 0 1`;

export async function analyzeChessPosition(base64Image, apiKey) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      max_output_tokens: 150,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high'
            },
            {
              type: 'input_text',
              text: CHESS_ANALYSIS_PROMPT
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('OpenAI response:', JSON.stringify(data, null, 2));

  // Try different response formats
  if (data.output_text) {
    return data.output_text.trim();
  }

  if (data.output && data.output[0] && data.output[0].content) {
    const content = data.output[0].content;
    if (Array.isArray(content)) {
      const textContent = content.find(c => c.type === 'output_text');
      if (textContent) return textContent.text.trim();
    }
    if (typeof content === 'string') return content.trim();
  }

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content.trim();
  }

  throw new Error('Invalid API response format: ' + JSON.stringify(data));
}
