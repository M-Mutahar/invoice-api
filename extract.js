// api/extract.js
//
// This is the ENTIRE product. It's one endpoint:
//   POST /api/extract
// It takes an invoice/receipt (as an image or PDF, sent as base64) and returns
// clean JSON: vendor, date, total, line items.
//
// How it works, in plain terms:
// 1. Someone calls your API with a document + their API key (RapidAPI checks the key for you).
// 2. This function sends that document to Claude with instructions to extract specific fields.
// 3. Claude reads the image/PDF and replies with ONLY a JSON object.
// 4. We send that JSON straight back to the customer.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { file_base64, media_type } = req.body;

  // Basic validation - if they forgot to send a file, tell them clearly
  if (!file_base64 || !media_type) {
    return res.status(400).json({
      error: 'Missing file_base64 or media_type. media_type should be like "image/jpeg", "image/png", or "application/pdf".',
    });
  }

  try {
    // This is the ONE call to Claude. We use Haiku because it's the cheapest
    // model and this task (reading a document, pulling out fields) doesn't
    // need a more expensive model.
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // set this in Vercel, never in code
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: media_type === 'application/pdf' ? 'document' : 'image',
                source: {
                  type: 'base64',
                  media_type,
                  data: file_base64,
                },
              },
              {
                type: 'text',
                text: `Extract data from this invoice/receipt. Respond with ONLY a raw JSON object, no other text, no markdown formatting, in exactly this shape:
{
  "vendor": string or null,
  "date": string or null (format YYYY-MM-DD if possible),
  "total": number or null,
  "currency": string or null (e.g. "USD"),
  "line_items": [ { "description": string, "amount": number } ]
}
If a field can't be found, use null. If there are no clear line items, use an empty array.`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Something went wrong on Claude's side - pass a clean error back
      return res.status(502).json({ error: 'Extraction failed', details: data });
    }

    // Claude's reply is in data.content[0].text - it should be raw JSON already
    const rawText = data.content?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch (parseErr) {
      // If Claude added any stray text, we still return something useful
      return res.status(502).json({ error: 'Could not parse extracted data', raw: rawText });
    }

    return res.status(200).json(extracted);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
