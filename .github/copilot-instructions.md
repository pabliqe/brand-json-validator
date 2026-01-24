# Copilot Instructions

This project is a **Brand JSON Validator** using DTCG (Design Tokens Community Group) standard.

## Project Overview

- **Type**: Vite + React + Tailwind CSS
- **Purpose**: Validate and correct brand.json files
- **Deployment**: Netlify + GitHub (free tier)
- **Backend**: None (fully client-side)

## Key Features

1. **DTCG Validation** - Validates against DTCG standard
2. **Multiple Inputs** - Drag-drop, paste, file upload
3. **Smart Corrections** - Auto-fix JSON issues
4. **Download Results** - Export corrected JSON
5. **Optional Gemini AI** - Enhanced hints via Google API

## Development Workflow

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── JsonInput.jsx        # Input handling
│   └── ValidationResults.jsx # Results display
├── lib/
│   └── dtcgValidator.js    # DTCG validation logic
├── App.jsx                  # Main component
├── main.jsx                 # Entry point
└── index.css               # Styles

netlify.toml                # Netlify config
.env.example                # Environment template
```

## Deployment

### GitHub + Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Netlify auto-builds and deploys from `dist/`

### Environment Variables (on Netlify)

```
VITE_GEMINI_API_KEY=your_key (optional)
VITE_GEMINI_MODEL=gemini-2.0-flash (optional)
```

## Important Files

- [src/lib/dtcgValidator.js](src/lib/dtcgValidator.js) - Core validation logic
- [src/components/JsonInput.jsx](src/components/JsonInput.jsx) - Input handling
- [README.md](README.md) - User documentation
- [netlify.toml](netlify.toml) - Deployment config

## Next Steps (Future Features)

- [ ] Integrate Gemini API for AI-powered suggestions
- [ ] Add visual token preview
- [ ] Support batch validation
- [ ] Export to additional formats
