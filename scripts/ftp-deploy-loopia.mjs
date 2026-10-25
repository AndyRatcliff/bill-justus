import { Client } from 'basic-ftp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'out')
const phpDir = path.join(root, 'deploy-php')
const remoteBase = '/orb.me/public_html/JustUs'

const client = new Client(120000)
client.ftp.verbose = false

async function main() {
  console.log('Connecting to Loopia…')
  const host = process.env.FTP_HOST || 'ftpcluster.loopia.se'
  const user = process.env.FTP_USER
  const password = process.env.FTP_PASS
  if (!user || !password) {
    throw new Error('Set FTP_USER and FTP_PASS env vars')
  }
  await client.access({ host, user, password, secure: false })

  // Do not clearWorkingDir — Loopia caches HTML (~5m); wiping chunks mid-cache
  // causes "Application error" when old HTML references deleted JS.
  console.log('Uploading static site to', remoteBase)
  await client.ensureDir(remoteBase)
  await client.uploadFromDir(outDir, remoteBase)

  console.log('Uploading PHP API…')
  const apiRemote = remoteBase + '/api'
  await client.ensureDir(apiRemote)
  await client.uploadFromDir(phpDir, apiRemote)

  console.log('Done.')
  client.close()
}

main().catch((err) => {
  console.error(err)
  client.close()
  process.exit(1)
})
