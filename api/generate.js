// Vercel Serverless Function (/api/generate)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST 요청만 허용됩니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY가 환경 변수로 설정되어 있지 않습니다. Vercel 설정(Settings > Environment Variables)에서 추가해주세요.' 
    });
  }

  try {
    const { prompt, imageBase64, mimeType = 'image/png', model = 'gemini-3-flash-preview' } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: '프롬프트 또는 이미지 데이터가 필요합니다.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts = [];
    if (prompt) parts.push({ text: prompt });
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: parts }] })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.',
        details: data 
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
  }
}