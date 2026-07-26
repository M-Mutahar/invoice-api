# Invoice Extraction API — Deploy Guide (Day 1)

Follow these steps in order. Don't skip ahead.

## Step A — Put this code on GitHub
1. Go to github.com, log in (or sign up, it's free).
2. Click the "+" top right → "New repository". Name it `invoice-api`. Keep it Public. Click "Create repository".
3. On the new repo page, click "uploading an existing file".
4. Drag in the three files from this folder: `api/extract.js`, `package.json`, `README.md` (keep the `api` folder structure — GitHub will preserve it if you drag the whole folder, or create the `api` folder manually on GitHub first and upload `extract.js` into it).
5. Click "Commit changes".

## Step B — Connect it to Vercel
1. Go to vercel.com, log in with the same GitHub account.
2. Click "Add New" → "Project".
3. Find `invoice-api` in the list and click "Import".
4. Before clicking Deploy, click "Environment Variables" and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste the API key you copied from console.anthropic.com)
5. Click "Deploy".
6. When it finishes (about 1 minute), Vercel gives you a live URL like:
   `https://invoice-api-yourname.vercel.app`
   Your live endpoint is: `https://invoice-api-yourname.vercel.app/api/extract`

## Step C — Test it works
Before listing it anywhere, test it yourself. Easiest way: use a free tool called Postman, or run this from any computer with Python installed — replace the URL and use any invoice image you have:

```python
import requests, base64

with open("sample_invoice.jpg", "rb") as f:
    encoded = base64.b64encode(f.read()).decode()

response = requests.post(
    "https://invoice-api-yourname.vercel.app/api/extract",
    json={"file_base64": encoded, "media_type": "image/jpeg"}
)
print(response.json())
```

If you get back a JSON object with vendor/date/total/line_items — it works. That's Day 1 done.

## Step D — Day 2: List it on RapidAPI
Once Step C works, come back and I'll walk you through the exact RapidAPI listing form, field by field.
