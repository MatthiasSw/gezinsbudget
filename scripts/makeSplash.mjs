// Renders the splash image of the portable exe to resources/splash.bmp. Run with: npx electron scripts/makeSplash.mjs
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

app.commandLine.appendSwitch('force-device-scale-factor', '1')

const width = 460
const height = 230
const root = join(import.meta.dirname, '..')
const icon = readFileSync(join(root, 'resources', 'icon.png')).toString('base64')

const html = `<!doctype html>
<html>
  <body style="margin:0;width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;gap:22px;background:linear-gradient(120deg,#4a4ad8,#7a5af0);font-family:'Segoe UI',sans-serif;color:white;overflow:hidden">
    <img src="data:image/png;base64,${icon}" width="84" height="84" />
    <div>
      <div style="font-size:34px;font-weight:700;letter-spacing:-0.01em">Gezinsbudget</div>
    </div>
  </body>
</html>`

function toBmp(bitmap, imageWidth, imageHeight) {
  const rowSize = Math.ceil((imageWidth * 3) / 4) * 4
  const pixelBytes = rowSize * imageHeight
  const file = Buffer.alloc(54 + pixelBytes)
  file.write('BM', 0)
  file.writeUInt32LE(file.length, 2)
  file.writeUInt32LE(54, 10)
  file.writeUInt32LE(40, 14)
  file.writeInt32LE(imageWidth, 18)
  file.writeInt32LE(imageHeight, 22)
  file.writeUInt16LE(1, 26)
  file.writeUInt16LE(24, 28)
  file.writeUInt32LE(pixelBytes, 34)
  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const source = ((imageHeight - 1 - y) * imageWidth + x) * 4
      const target = 54 + y * rowSize + x * 3
      file[target] = bitmap[source]
      file[target + 1] = bitmap[source + 1]
      file[target + 2] = bitmap[source + 2]
    }
  }
  return file
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width,
    height,
    show: false,
    useContentSize: true,
    frame: false
  })
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  const image = await window.webContents.capturePage()
  const size = image.getSize()
  writeFileSync(
    join(root, 'resources', 'splash.bmp'),
    toBmp(image.toBitmap(), size.width, size.height)
  )
  if (process.env.SPLASH_PNG) writeFileSync(process.env.SPLASH_PNG, image.toPNG())
  app.quit()
})
