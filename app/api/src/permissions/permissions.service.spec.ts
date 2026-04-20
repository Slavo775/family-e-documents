import { NotFoundException } from '@nestjs/common'
import { FolderAction } from '@family-docs/db'
import { PermissionsService } from './permissions.service'

// ─── Mock helpers ────────────────────────────────────────────────────────────

type PrismaMock = {
  folder: { findUnique: jest.Mock }
  folderPermission: { findUnique: jest.Mock; findMany: jest.Mock; upsert: jest.Mock; delete: jest.Mock }
  user: { findUnique: jest.Mock }
}

function buildPrismaMock(): PrismaMock {
  return {
    folder: { findUnique: jest.fn() },
    folderPermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  }
}

const permEntry = (overrides = {}) => ({
  folderId: 'f1',
  userId: 'u1',
  actions: [FolderAction.VIEW, FolderAction.UPLOAD],
  inherited: false,
  user: { id: 'u1', name: 'Alice' },
  ...overrides,
})

// ─── listForFolder() ──────────────────────────────────────────────────────────

describe('PermissionsService.listForFolder', () => {
  it('returns entries with inherited=false and no inheritedFrom', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue({ id: 'f1', parentId: 'root' })
    prisma.folderPermission.findMany.mockResolvedValue([permEntry()])

    const svc = new PermissionsService(prisma as never)
    const result = await svc.listForFolder('f1')

    expect(result).toHaveLength(1)
    expect(result[0]!).toMatchObject({ userId: 'u1', userName: 'Alice', inherited: false })
    expect(result[0]!.inheritedFrom).toBeUndefined()
  })

  it('resolves inheritedFrom for inherited entries', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique
      .mockResolvedValueOnce({ id: 'f1', parentId: 'parent' }) // listForFolder folder check
      .mockResolvedValueOnce({ id: 'f1', parentId: 'parent' }) // resolveInheritedFrom — get parent of f1
      .mockResolvedValue(null) // resolveInheritedFrom — stop walking
    prisma.folderPermission.findMany.mockResolvedValue([permEntry({ inherited: true })])
    prisma.folderPermission.findUnique.mockResolvedValue({ folderId: 'parent', userId: 'u1', actions: [FolderAction.VIEW] })

    const svc = new PermissionsService(prisma as never)
    const result = await svc.listForFolder('f1')

    expect(result[0]!.inherited).toBe(true)
    expect(result[0]!.inheritedFrom).toBe('parent')
  })

  it('returns empty array when no permission rows exist', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue({ id: 'f1', parentId: null })
    prisma.folderPermission.findMany.mockResolvedValue([])

    const svc = new PermissionsService(prisma as never)
    const result = await svc.listForFolder('f1')

    expect(result).toEqual([])
  })

  it('throws NotFoundException when folder does not exist', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue(null)

    const svc = new PermissionsService(prisma as never)
    await expect(svc.listForFolder('no-such-folder')).rejects.toThrow(NotFoundException)
  })
})

// ─── upsertForFolder() ────────────────────────────────────────────────────────

describe('PermissionsService.upsertForFolder', () => {
  it('creates a new row with inherited=false', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue({ id: 'f1' })
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Alice' })
    prisma.folderPermission.upsert.mockResolvedValue({
      folderId: 'f1',
      userId: 'u1',
      actions: [FolderAction.VIEW, FolderAction.UPLOAD],
      inherited: false,
    })

    const svc = new PermissionsService(prisma as never)
    const result = await svc.upsertForFolder('f1', 'u1', [FolderAction.VIEW, FolderAction.UPLOAD])

    expect(result).toMatchObject({ userId: 'u1', userName: 'Alice', inherited: false })
    expect(prisma.folderPermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ inherited: false }),
        update: expect.objectContaining({ inherited: false }),
      }),
    )
  })

  it('overwrites an existing inherited row with inherited=false', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue({ id: 'f1' })
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Alice' })
    prisma.folderPermission.upsert.mockResolvedValue({
      folderId: 'f1',
      userId: 'u1',
      actions: [FolderAction.VIEW],
      inherited: false,
    })

    const svc = new PermissionsService(prisma as never)
    const result = await svc.upsertForFolder('f1', 'u1', [FolderAction.VIEW])

    expect(result.inherited).toBe(false)
  })

  it('throws NotFoundException when folder not found', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue(null)

    const svc = new PermissionsService(prisma as never)
    await expect(svc.upsertForFolder('bad-folder', 'u1', [])).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when user not found', async () => {
    const prisma = buildPrismaMock()
    prisma.folder.findUnique.mockResolvedValue({ id: 'f1' })
    prisma.user.findUnique.mockResolvedValue(null)

    const svc = new PermissionsService(prisma as never)
    await expect(svc.upsertForFolder('f1', 'bad-user', [])).rejects.toThrow(NotFoundException)
  })
})

// ─── removeForFolder() ────────────────────────────────────────────────────────

describe('PermissionsService.removeForFolder', () => {
  it('deletes an existing permission row', async () => {
    const prisma = buildPrismaMock()
    prisma.folderPermission.findUnique.mockResolvedValue(permEntry())
    prisma.folderPermission.delete.mockResolvedValue(undefined)

    const svc = new PermissionsService(prisma as never)
    await svc.removeForFolder('f1', 'u1')

    expect(prisma.folderPermission.delete).toHaveBeenCalledWith({
      where: { folderId_userId: { folderId: 'f1', userId: 'u1' } },
    })
  })

  it('throws NotFoundException when no matching row exists', async () => {
    const prisma = buildPrismaMock()
    prisma.folderPermission.findUnique.mockResolvedValue(null)

    const svc = new PermissionsService(prisma as never)
    await expect(svc.removeForFolder('f1', 'u1')).rejects.toThrow(NotFoundException)
  })
})
