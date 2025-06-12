# Video Highlight Tool

Demo Link：http://43.100.1.216/highlight/index.html

The UI is built with React and Ant Design, with component customization done via plain, hand-written CSS layered on top of the standard AntD components.

## Folder Structure

```
/
├─ public/
│  ├─ mock.json              ← AI response
│  └─ test.mp4               ← sample 60 s video
├─ src/
│  ├─ components/
│  │  ├─ VideoUpload/        ← upload & mock fetch
│  │  ├─ transcript/         ← editing panel
│  │  └─ preview/            ← stitched player
│  ├─ App.jsx
│  └─ index.css
├─ vite.config.js
└─ tailwind.config.js
```



## Local Development

```bash
# Node 18+
npm install
npm run dev      # http://localhost:5173
```



## Production Build

```bash
npm run build    # outputs to /dist
```



## Mock assets

| File               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `public/mock.json` | Simulated AI transcript/section data used by the Transcript panel. |
| `public/test.mp4`  | Sample 60 s video used by the Preview panel (overridden when user uploads their own video). |

If you replace either file, keep the JSON shape the same and place the video under `public/` or adjust the path in `App.jsx`.



## Extending the Mock API

Replace `public/mock.json` with your own transcript.

```json
{
  "full_transcript": "...",
  "sections": [
    {
      "title": "Section1",
      "start": 0,
      "end": 20,
      "sentences": [
        {
          "text": "...",
          "start": 5,
          "end": 8,
          "highlight": true
        }
      ]
    },
    {
      "title": "Section2",
      "start": 20,
      "end": 45,
      "sentences": [
        {
          "text": "...",
          "start": 20,
          "end": 24,
          "highlight": false
        }
      ]
    }
  ]
}
```

