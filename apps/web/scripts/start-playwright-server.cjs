const fs = require('fs')
const path = require('path')

const standaloneRoot = path.resolve(__dirname, '../.next/standalone/apps/web')
const standaloneStaticDir = path.join(standaloneRoot, '.next', 'static')
const buildStaticDir = path.resolve(__dirname, '../.next/static')
const publicSourceDir = path.resolve(__dirname, '../public')
const publicTargetDir = path.join(standaloneRoot, 'public')

function syncDir(source, target) {
  if (!fs.existsSync(source)) {
    return
  }

  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.cpSync(source, target, { recursive: true })
}

syncDir(buildStaticDir, standaloneStaticDir)
syncDir(publicSourceDir, publicTargetDir)

process.env.PORT = process.argv[2] || process.env.PORT || '3100'
process.env.HOSTNAME = process.env.HOSTNAME || '127.0.0.1'

process.chdir(standaloneRoot)
require(path.join(standaloneRoot, 'server.js'))
