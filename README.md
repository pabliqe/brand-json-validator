# Brand JSON Validator

A standalone validator for `brand.json` files using the **DTCG (Design Tokens Community Group)** standard.

## Features

✨ **Complete DTCG Validation** - Validates brand.json files against the DTCG standard specification

📥 **Multiple Input Methods**
- Drag & drop JSON files
- Copy & paste JSON content
- File upload via file picker

💾 **Smart Corrections** - Automatically applies suggested fixes and downloads corrected JSON

🎨 **User-Friendly** - Clear error messages with helpful hints and suggestions

🤖 **Optional Gemini AI** - Enhanced validation hints powered by Google Gemini API (optional)

🚀 **Zero Backend** - Fully client-side validation, runs anywhere

## Tech Stack

- **Vite** - Lightning-fast build tool
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **DTCG Validator** - Custom validation library

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build

```bash
npm run build
```

Produces optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Load JSON**: Drag & drop your `brand.json` file, paste content, or upload via file picker
2. **Validate**: The validator automatically checks DTCG compliance
3. **Review Results**: See errors, warnings, and suggestions
4. **Download**: Get your corrected JSON with auto-applied fixes

## DTCG Standard

The validator checks for:

- ✓ Valid JSON structure
- ✓ Token group organization
- ✓ Required `value` properties
- ✓ Token type consistency
- ✓ Color format validation (hex, rgb)
- ✓ Dimension format validation
- ✓ Font family definitions
- ✓ Brand metadata

### Example brand.json

```json
{
  "brand": {
    "name": "My Brand",
    "siteTitle": "My Brand Co.",
    "siteUrl": "https://mybrand.com",
    "description": "A great brand"
  },
  "colors": {
    "primary": {
      "value": "#E00069",
      "$type": "color"
    },
    "secondary": {
      "blue": {
        "value": "#4c53fb",
        "$type": "color"
      }
    }
  },
  "typography": {
    "fontFamilies": {
      "primary": {
        "value": "Inter",
        "$type": "fontFamily"
      }
    }
  }
}
```

## Optional Gemini API Integration

For enhanced validation hints powered by AI:

1. Create `.env.local` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash
```

2. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Deployment

### Netlify (Recommended)

The project includes a `netlify.toml` configuration for easy deployment:

```bash
# Deploy from GitHub
1. Push to GitHub
2. Connect repo to Netlify
3. Netlify will auto-build and deploy

# Or deploy manually
npm run build
netlify deploy --prod --dir=dist
```

Environment variables on Netlify:
- `VITE_GEMINI_API_KEY` (optional)
- `VITE_GEMINI_MODEL` (optional)

### Other Hosting

Any static host works (Vercel, GitHub Pages, CloudFlare Pages, etc.):

```bash
npm run build
# Deploy the dist/ folder
```

## Project Structure

```
src/
├── components/
│   ├── ui/
│   │   └── index.jsx        # Reusable UI components
│   ├── JsonInput.jsx         # Input handling (drag-drop, paste, upload)
│   └── ValidationResults.jsx # Results display & download
├── lib/
│   └── dtcgValidator.js     # DTCG validation logic
├── App.jsx                   # Main app component
├── main.jsx                  # Entry point
└── index.css                 # Styles
```

## Future Enhancements

- 🤖 Gemini API integration for AI-powered suggestions
- 🌐 Support for additional design token standards
- 📊 Token statistics and analysis
- 🎨 Visual preview of design tokens
- 📱 Mobile app version
- 🔄 Batch validation
- 📤 Export to different formats

## Learning Resources

- [DTCG Standard](https://design-tokens.github.io/community-group/format/)
- [Tokens.studio Blog](https://tokens.studio/blog/design-tokens-community-group)
- [Design Tokens 101](https://www.w3.org/TR/design-tokens-1/)

## License

MIT

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## Support

For questions or issues, open an issue on GitHub or contact the maintainers.

---

Built with ❤️ for the design tokens community
