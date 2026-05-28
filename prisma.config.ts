import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { defineConfig } from 'prisma/config'
// Prisma CLI does not load .env.local automatically — load it explicitly
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })

const directUrl = process.env.DIRECT_URL

export default defineConfig({
  datasource: {
    url: directUrl!,
  },
})
