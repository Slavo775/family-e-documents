import 'dotenv/config'

if (process.env['NODE_ENV'] === 'production') {
  console.error('ERROR: Seed script must not be run in production.')
  process.exit(1)
}

import bcrypt from 'bcryptjs'
import { PrismaClient } from './generated/prisma/index.js'
import { UserFactory } from './factories/User.js'
import { DocumentFactory } from './factories/Document.js'

const prisma = new PrismaClient()

const SEED_ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@family.local'
const SEED_ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin123!'

// ─── Folder tree as defined in PROJECT_SPEC.md ──────────────────────────────

type FolderSeed = { name: string; parentKey: string | null; key: string }

const FOLDER_TREE: FolderSeed[] = [
  { key: 'root',              name: '/',                 parentKey: null },
  { key: 'shared',            name: 'Shared',            parentKey: 'root' },
  { key: 'legal',             name: 'Legal',             parentKey: 'root' },
  { key: 'finance',           name: 'Finance',           parentKey: 'root' },
  { key: 'finance-tax',       name: 'Tax Returns',       parentKey: 'finance' },
  { key: 'finance-receipts',  name: 'Receipts',          parentKey: 'finance' },
  { key: 'medical',           name: 'Medical',           parentKey: 'root' },
  { key: 'medical-family',    name: 'Family',            parentKey: 'medical' },
  { key: 'medical-mom',       name: 'Mom',               parentKey: 'medical' },
  { key: 'medical-dad',       name: 'Dad',               parentKey: 'medical' },
  { key: 'kids',              name: 'Kids',              parentKey: 'root' },
  { key: 'kids-school',       name: 'School',            parentKey: 'kids' },
  { key: 'kids-activities',   name: 'Activities',        parentKey: 'kids' },
]

async function seedFolders(createdById: string): Promise<Record<string, string>> {
  const idMap: Record<string, string> = {}

  for (const entry of FOLDER_TREE) {
    const parentId = entry.parentKey ? (idMap[entry.parentKey] ?? null) : null

    const existing = await prisma.folder.findFirst({
      where: { name: entry.name, parentId },
    })

    if (existing) {
      idMap[entry.key] = existing.id
    } else {
      const folder = await prisma.folder.create({
        data: { name: entry.name, parentId, createdById },
      })
      idMap[entry.key] = folder.id
    }
  }

  return idMap
}

async function main(): Promise<void> {
  console.log('Seeding database...')

  // Admin user — credentials driven by SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars
  const adminPasswordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12)
  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: {},
    create: { email: SEED_ADMIN_EMAIL, passwordHash: adminPasswordHash, name: 'Admin', role: 'ADMIN' },
  })
  console.log(`Admin: ${admin.email} (${admin.id})`)

  // Regular user
  const userFactory = await UserFactory.createUser('user@family.local', 'User123!', 'Family User')
  const user = await prisma.user.upsert({
    where: { email: userFactory.user.email },
    update: {},
    create: userFactory.user,
  })
  console.log(`User: ${user.email} (${user.id})`)

  // Folder tree
  const folders = await seedFolders(admin.id)
  console.log(`Folders seeded: ${Object.keys(folders).length}`)

  // Sample documents spread across folders
  const sampleFolders: Array<keyof typeof folders> = [
    'shared', 'legal', 'finance-tax', 'finance-receipts', 'medical-family',
    'kids-school',
  ]

  for (let i = 0; i < sampleFolders.length; i++) {
    const folderKey = sampleFolders[i]!
    const folderId = folders[folderKey]!
    const uploader = i % 2 === 0 ? admin : user
    const docFactory = new DocumentFactory(folderId, uploader.id)

    await prisma.document.upsert({
      where: { id: docFactory.document.id },
      update: {},
      create: docFactory.document,
    })
  }
  console.log(`Documents seeded: ${sampleFolders.length}`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
