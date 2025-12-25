const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

const CHESS_ANALYSIS_PROMPT = `You are a chess diagram reader. Analyze chess positions from photos of books, screens, or physical boards.

STEP 1 - Read each rank from top to bottom:
For each rank (8 down to 1), list what's on each square (a-h).
Use: K=King, Q=Queen, R=Rook, B=Bishop, N=Knight, P=Pawn
Prefix with 'w' for white (hollow/outline pieces) or 'b' for black (solid/filled pieces).
Use '-' for empty squares.

STEP 2 - Write the FEN:
Convert your rank-by-rank reading into FEN notation.

Example output format:
Rank 8: bR - bB - bR - bK -
Rank 7: bP - - - - bP bP bP
...
Rank 1: wR - - - wR - wK -
FEN: r1b1r1k1/p4ppp/...

IMPORTANT: In printed chess diagrams:
- White pieces are HOLLOW/OUTLINE (you can see through them)
- Black pieces are SOLID/FILLED (completely dark)
- The board is usually shown from White's perspective (rank 1 at bottom)`;

export async function analyzeChessPosition(base64Image, apiKey) {
  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-vision-1212',
      messages: [
        {
          role: 'system',
          content: CHESS_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: `Read this chess diagram carefully. Go rank by rank from 8 to 1, listing each piece you see. Then provide the FEN.

Remember: hollow/outline pieces = WHITE, solid/filled pieces = BLACK.`
            }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 800,
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

  // Extract FEN from the response (look for FEN: line or a FEN-like pattern)
  const fenMatch = content.match(/FEN:\s*([rnbqkpRNBQKP1-8\/]+\s+[wb]\s+[KQkq-]+\s+[a-h1-8-]+\s+\d+\s+\d+)/i);
  if (fenMatch) {
    return fenMatch[1].trim();
  }

  // Try to find any FEN-like string (8 ranks separated by /)
  const fenPattern = content.match(/([rnbqkpRNBQKP1-8]{1,8}\/){7}[rnbqkpRNBQKP1-8]{1,8}(\s+[wb]\s+[KQkq-]+\s+[a-h1-8-]+\s+\d+\s+\d+)?/);
  if (fenPattern) {
    return fenPattern[0].trim();
  }

  // Return full content if no FEN found (might be an error message)
  return content;
}
