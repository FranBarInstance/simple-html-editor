import * as esbuild from "esbuild"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const distDir = path.join(projectRoot, "dist")

const LICENSE_BANNER = `/*!
 * Simple HTML Editor v2.0.1
 * See license: https://github.com/FranBarInstance/simple-html-editor
 */`

async function build() {
  // Explicit load order - dependencies must be loaded first
  const sourceFiles = [
    // 1. Base constants
    "src/icons.js",
    // 2. Core classes (no dependencies on editor)
    "src/restorable.js",
    "src/moveable.js",
    // 3. Editor modules (must be in order - init first)
    "src/editor-init.js",
    "src/editor-utils.js",
    "src/editor-navigation.js",
    "src/editor-clipboard.js",
    "src/editor-content.js",
    "src/editor-ui.js",
    // 4. Dialog modules (extend ncSimpleHtmlEditor prototype)
    "src/dialogs/code.js",
    "src/dialogs/text.js",
    "src/dialogs/image.js",
    "src/dialogs/link.js",
    "src/dialogs/head.js",
    "src/dialogs/clientagent.js",
    // 5. ClientAgentJS global library
    "src/clientagentjs.global.js",
    // 6. Agent module (extends editor, uses clientagent dialog)
    "src/agent.js",
    // 7. Auto-initialization (must be last)
    "src/autoinit.js"
  ]
  // 1. Clean dist
  await fs.rm(distDir, { recursive: true, force: true })
  await fs.mkdir(distDir, { recursive: true })

  // 2. Build CSS
  console.log("Building CSS...")
  const cssSource = path.join(projectRoot, "src", "simplehtmleditor.css")
  const cssClientAgent = path.join(projectRoot, "src", "clientagentjs-dialogs.css")
  const cssDest = path.join(distDir, "simplehtmleditor.min.css")
  const tmpDir = os.tmpdir()
  try {
    // Concatenate CSS files in temp directory
    const mainCss = await fs.readFile(cssSource, "utf-8")
    const clientCss = await fs.readFile(cssClientAgent, "utf-8")
    const combinedCss = mainCss + "\n" + clientCss
    const combinedCssPath = path.join(tmpDir, "ncsedt-combined.css")
    await fs.writeFile(combinedCssPath, combinedCss)

    await esbuild.build({
      entryPoints: [combinedCssPath],
      bundle: true,
      minify: true,
      outfile: cssDest,
    })

    // Clean up temp file
    await fs.rm(combinedCssPath, { force: true })

    // Copy to root for CDN compatibility
    await fs.copyFile(cssDest, path.join(projectRoot, "simplehtmleditor.min.css"))
    console.log("- dist/simplehtmleditor.min.css")
  } catch (err) {
    console.warn("Warning: Could not build CSS:", err.message)
  }

  // 3. Concatenate all JS files
  console.log("Concatenating JS files...")
  let combinedJs = ""

  for (const file of sourceFiles) {
    const filePath = path.join(projectRoot, file)
    try {
      let content = await fs.readFile(filePath, "utf-8")

      // Remove all export statements (ES6)
      content = content.replace(/export\s+\{[^}]*\};?\s*$/gm, "")
      content = content.replace(/export\s+default\s+[^;]+;?\s*$/gm, "")
      content = content.replace(/export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, "")

      // Remove module.exports sections
      content = content.replace(/\/\/ Export for both module[\s\S]*$/, "")

      combinedJs += "\n" + content + "\n"
    } catch (err) {
      console.warn(`Warning: Could not read ${file}:`, err.message)
    }
  }

  // 5. Write combined file
  const combinedPath = path.join(distDir, "simplehtmleditor.combined.js")
  await fs.writeFile(combinedPath, LICENSE_BANNER + "\n" + combinedJs)

  // 6. Minify
  console.log("Minifying...")
  await esbuild.build({
    entryPoints: [combinedPath],
    bundle: false,
    minify: true,
    outfile: path.join(distDir, "simplehtmleditor.min.js"),
    banner: { js: LICENSE_BANNER }
  })

  // 7. Clean up
  await fs.rm(combinedPath)

  // Copy to root for CDN compatibility
  const jsDest = path.join(distDir, "simplehtmleditor.min.js")
  await fs.copyFile(jsDest, path.join(projectRoot, "simplehtmleditor.min.js"))

  console.log("\n✓ Build completed!")
  console.log("  dist/simplehtmleditor.min.js")
  console.log("  dist/simplehtmleditor.min.css")
  console.log("  (copied to root for CDN)")
}

build().catch((err) => {
  console.error("Build failed:", err)
  process.exit(1)
})
