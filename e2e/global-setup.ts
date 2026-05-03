import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ADMIN_API_DIR = resolve(__dirname, '..', '..', 'admin-api')

async function globalSetup(): Promise<void> {
  execSync('yarn truncate:e2e', {
    cwd: ADMIN_API_DIR,
    stdio: 'inherit',
  })
}

export default globalSetup
