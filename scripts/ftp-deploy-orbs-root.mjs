import { Client } from 'basic-ftp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localRoot = path.resolve(__dirname, '../../webxr-birds')
const remoteBase = '/orb.me/public_html'

const client = new Client(120000)
client.ftp.verbose = false

async function uploadTree(localDir, remoteDir) {
  await client.ensureDir(remoteDir)
  await client.uploadFromDir(localDir, remoteDir)
}

async function main() {
  const host = process.env.FTP_HOST || 'ftpcluster.loopia.se'
  const user = process.env.FTP_USER
  const password = process.env.FTP_PASS
  if (!user || !password) throw new Error('Set FTP_USER and FTP_PASS env vars')

  console.log('Connecting to Loopia…')
  await client.access({ host, user, password, secure: false })

  // Upload orbs page files to site root without wiping JustUs / we.
  // Do not clearWorkingDir — preserves sibling apps and Loopia HTML cache safety.
  console.log('Uploading orbs page to', remoteBase)
  await client.ensureDir(remoteBase)

  for (const name of ['index.html', 'lavaorb.html', 'robots.txt', '.htaccess']) {
    const local = path.join(localRoot, name)
    try {
      await client.uploadFrom(local, `${remoteBase}/${name}`)
      console.log('  +', name)
    } catch (err) {
      if (name === 'lavaorb.html') continue
      throw err
    }
  }

  console.log('  + src/')
  await uploadTree(path.join(localRoot, 'src'), `${remoteBase}/src`)
  console.log('  + assets/')
  await uploadTree(path.join(localRoot, 'assets'), `${remoteBase}/assets`)

  // Re-assert noindex robots at root (in case an older upload drifted).
  await client.uploadFrom(
    path.join(localRoot, 'robots.txt'),
    `${remoteBase}/robots.txt`,
  )
  console.log('robots.txt confirmed at root (Disallow: /)')
  console.log('Done.')
  client.close()
}

main().catch((err) => {
  console.error(err)
  client.close()
  process.exit(1)
})
