import { Client } from 'basic-ftp'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'out')
const phpDir = path.join(root, 'deploy-php')
const remoteBase = '/public_html/cgiterate.com/orb.me'

const client = new Client(120000)
client.ftp.verbose = false

async function uploadDir(localDir, remoteDir) {
  await client.ensureDir(remoteDir)
  await client.clearWorkingDir()
  await client.uploadFromDir(localDir)
}

async function main() {
  console.log('Connecting…')
  const host = process.env.FTP_HOST
  const user = process.env.FTP_USER
  const password = process.env.FTP_PASS
  if (!host || !user || !password) {
    throw new Error('Set FTP_HOST, FTP_USER, and FTP_PASS env vars')
  }
  await client.access({ host, user, password, secure: false })

  console.log('Uploading static site to', remoteBase)
  await client.ensureDir(remoteBase)
  await client.cd(remoteBase)
  await client.clearWorkingDir()
  await client.uploadFromDir(outDir)

  console.log('Uploading PHP API…')
  const apiRemote = remoteBase + '/api'
  await client.ensureDir(apiRemote)
  await client.cd(apiRemote)
  await client.clearWorkingDir()
  await client.uploadFromDir(phpDir)

  console.log('Done.')
  client.close()
}

main().catch((err) => {
  console.error(err)
  client.close()
  process.exit(1)
})
