import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const brandPath = path.join(rootDir, 'brand.json')

// Detect framework and resolve HTML path
async function detectFramework() {
  const commonPaths = [
    'index.html',
    'public/index.html',
    'dist/index.html',
  ]

  for (const relativePath of commonPaths) {
    const fullPath = path.join(rootDir, relativePath)
    if (existsSync(fullPath)) {
      return { type: 'static', htmlPath: fullPath }
    }
  }

  return { error: 'No HTML file found' }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceMeta(html, attr, key, value) {
  const regex = new RegExp(`(<meta[^>]*${attr}\\s*=\\s*"${escapeRegex(key)}"[^>]*content\\s*=\\s*")(.*?)(")`, 'i')
  return html.replace(regex, `$1${value}$3`)
}

async function updateStaticHtml(filePath, brand, ogImageUrl) {
  const siteName = brand?.brand?.name || 'Brand Validator'
  const siteDescription = brand?.brand?.description || 'DTCG Design Tokens Validator'

  const html = await readFile(filePath, 'utf8')

  let updated = html
  updated = updated.replace(/<title>.*?<\/title>/i, `<title>${siteName}</title>`)
  updated = replaceMeta(updated, 'name', 'description', siteDescription)
  updated = replaceMeta(updated, 'property', 'og:title', siteName)
  updated = replaceMeta(updated, 'property', 'og:description', siteDescription)
  updated = replaceMeta(updated, 'property', 'og:image', ogImageUrl)
  updated = replaceMeta(updated, 'name', 'twitter:title', siteName)
  updated = replaceMeta(updated, 'name', 'twitter:description', siteDescription)
  updated = replaceMeta(updated, 'name', 'twitter:image', ogImageUrl)

  if (updated !== html) {
    await writeFile(filePath, updated)
    return true
  }
  return false
}

async function syncMeta() {
  const detection = await detectFramework()
  if (detection.error) {
    console.error(`[sync-meta] ${detection.error}`)
    process.exit(1)
  }

  const brandRaw = await readFile(brandPath, 'utf8')
  const brand = JSON.parse(brandRaw)

  // Prefer absolute URL for social crawlers: Netlify env → brand.siteUrl → root-relative fallback
  const baseUrl = (process.env.URL || process.env.DEPLOY_URL || brand?.brand?.siteUrl || '').replace(/\/$/, '')
  const ogImageUrl = baseUrl ? `${baseUrl}/og-image.png` : '/og-image.png'

  const htmlPath = detection.htmlPath
  console.log(`[sync-meta] Updating: ${path.relative(rootDir, htmlPath)}`)

  try {
    const changed = await updateStaticHtml(htmlPath, brand, ogImageUrl)
    if (changed) {
      console.log('[sync-meta] ✓ Updated meta tags')
    } else {
      console.log('[sync-meta] ℹ No changes needed')
    }
  } catch (error) {
    console.error('[sync-meta] ✗ Error:', error.message)
    process.exit(1)
  }
}

syncMeta().catch(err => {
  console.error(err)
  process.exit(1)
})
