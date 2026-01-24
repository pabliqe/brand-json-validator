import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function loadJson(relativePath) {
  const filePath = path.join(rootDir, relativePath)
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function getValue(obj, defaultValue) {
  if (!obj) return defaultValue
  return obj.$value || obj.value || defaultValue
}

async function generateOgImage() {
  const pkg = await loadJson('package.json')
  const brand = await loadJson('brand.json')

  const siteName = brand?.brand?.name || pkg?.name || 'BRAND VALIDATOR'
  const siteTitle = brand?.brand?.siteTitle || brand?.brand?.name || 'DTCG STANDARD'
  const versionLabel = pkg?.version ? `v${pkg.version}` : 'v0.0.0'

  const colors = {
    primary: getValue(brand?.colors?.primary, '#E00069'),
    accent: getValue(brand?.colors?.secondary?.blue, '#4c53fb'),
    neutralBg: getValue(brand?.colors?.neutral?.['50'], '#fffdfd'),
    text: getValue(brand?.colors?.neutral?.['900'], '#443d3d')
  }

  const width = 1200
  const height = 630

  console.log('[og-image] Generating OG image...')

  // font stack
  const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
      text { font-family: ${fontFamily}; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${colors.neutralBg}" />
  
  <circle cx="${width - 100}" cy="100" r="150" fill="${colors.primary}" fill-opacity="0.05" />
  <circle cx="100" cy="${height - 100}" r="200" fill="${colors.accent}" fill-opacity="0.05" />

  <text x="120" y="300" font-size="120" font-weight="700" fill="${colors.text}" letter-spacing="-0.05em">${siteName}</text>
  <text x="120" y="390" font-size="48" font-weight="400" fill="${colors.text}" opacity="0.6">${siteTitle}</text>
  <text x="120" y="460" font-size="40" font-weight="700" fill="${colors.primary}">${versionLabel}</text>
  
  <rect x="0" y="${height - 20}" width="${width}" height="20" fill="${colors.primary}" />
  <rect x="0" y="${height - 20}" width="${width / 3}" height="20" fill="${colors.accent}" />
</svg>`

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: true
    }
  })

  const pngData = resvg.render().asPng()

  const outDir = path.join(rootDir, 'public')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'og-image.png'), pngData)
  console.log('[og-image] ✓ Generated successfully')
}

generateOgImage().catch((error) => {
  console.error('[og-image] generation failed:', error)
  process.exit(1)
})
