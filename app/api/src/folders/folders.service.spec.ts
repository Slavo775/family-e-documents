import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { FolderAction, Prisma, Role } from '@family-docs/db'
import { FoldersService } from './folders.service'

// ─── Mock helpers ────────────────────────────────────────────────────────────

type PrismaMock = {
  folder: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock }
  folderPermission: { findUnique: jest.Mock; findMany: jest.Mock; createMany: jest.Mock; deleteMany: jest.Mock }
  document: { findMany: jest.Mock; deleteMany: jest.Mock }
  $queryRaw: jest.Mock
  $transaction: jest.Mock
}

function buildPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    folder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    folderPermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((cb: (tx: PrismaMock) => Promise<unknown>) => cb(buildPrismaMock())),
  }
  return mock
}

const makePrisma = (): PrismaMock => buildPrismaMock()

const makePermissions = (canPerform = true) => ({
  canPerformAction: jest.fn().mockResolvedValue(canPerform),
  canViewDocument: jest.fn().mockResolvedValue(canPerform),
})

const folderRow = (overrides = {}) => ({
  id: 'f1',
  name: 'Finance',
  parentId: 'root',
  createdAt: new Date('2026-01-01'),
  _count: { children: 2, documents: 0 },
  ...overrides,
})

// ─── list() ──────────────────────────────────────────────────────────────────

describe('FoldersService.list', () => {
  it('returns all folders for ADMIN without permission check', async () => {
    const prisma = makePrisma()
    const permissions = makePermissions()
    const folder = folderRow()
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([folder])
    ;(prisma.folderPermission.findUnique as jest.Mock).mockResolvedValue(null)

    const svc = new FoldersService(prisma as never, permissions as never)
    const result = await svc.list('u1', Role.ADMIN, {})

    expect(permissions.canPerformAction).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('f1')
  })

  it('filters out folders USER cannot VIEW', async () => {
    const prisma = makePrisma()
    const permissions = makePermissions(false)
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([folderRow(), folderRow({ id: 'f2', name: 'Legal' })])

    const svc = new FoldersService(prisma as never, permissions as never)
    const result = await svc.list('u1', Role.USER, {})

    expect(result).toHaveLength(0)
  })

  it('passes parentId=null when no parentId given (root listing)', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([])

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await svc.list('u1', Role.ADMIN, {})

    expect(prisma.folder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: null } }),
    )
  })

  it('omits parentId filter when flat=true', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([])

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await svc.list('u1', Role.ADMIN, { flat: true })

    expect(prisma.folder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('returns correct userPermissions for USER from FolderPermission row', async () => {
    const prisma = makePrisma()
    const permissions = makePermissions(true)
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([folderRow()])
    ;(prisma.folderPermission.findUnique as jest.Mock).mockResolvedValue({
      actions: [FolderAction.VIEW, FolderAction.UPLOAD],
    })

    const svc = new FoldersService(prisma as never, permissions as never)
    const [node] = await svc.list('u1', Role.USER, {})

    expect(node!.userPermissions).toEqual([FolderAction.VIEW, FolderAction.UPLOAD])
  })

  it('defaults to [VIEW] userPermissions when no FolderPermission row exists', async () => {
    const prisma = makePrisma()
    const permissions = makePermissions(true)
    ;(prisma.folder.findMany as jest.Mock).mockResolvedValue([folderRow()])
    ;(prisma.folderPermission.findUnique as jest.Mock).mockResolvedValue(null)

    const svc = new FoldersService(prisma as never, permissions as never)
    const [node] = await svc.list('u1', Role.USER, {})

    expect(node!.userPermissions).toEqual([FolderAction.VIEW])
  })
})

// ─── Cycle detection (assertNoCycle via update) ───────────────────────────────

describe('FoldersService cycle detection', () => {
  it('throws 400 when moving folder into itself', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ id: 'f1', parentId: 'root' }),
    )

    const svc = new FoldersService(prisma as never, makePermissions() as never)

    await expect(svc.update('f1', { parentId: 'f1' }, 'u1', Role.ADMIN)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('throws 400 when moving folder into its descendant', async () => {
    const prisma = makePrisma()
    // The folder being moved
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ id: 'parent', parentId: null }),
    )
    // $queryRaw returns ['parent', 'child'] as descendants
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { id: 'parent', depth: 0 },
      { id: 'child', depth: 1 },
    ])

    const svc = new FoldersService(prisma as never, makePermissions() as never)

    // Trying to move 'parent' into 'child' (its own descendant)
    await expect(svc.update('parent', { parentId: 'child' }, 'u1', Role.ADMIN)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('does not throw when moving folder to a non-descendant', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ id: 'f1', parentId: 'old-parent' }),
    )
    // Descendants of f1: only f1 itself
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 'f1' }])
    ;(prisma.$transaction as jest.Mock).mockResolvedValue(folderRow({ id: 'f1', parentId: 'new-parent' }))

    const svc = new FoldersService(prisma as never, makePermissions() as never)

    // new-parent is NOT in f1's descendants — should not throw
    await expect(svc.update('f1', { parentId: 'new-parent' }, 'u1', Role.ADMIN)).resolves.not.toThrow()
  })
})

// ─── Permission cascade (create & move) ──────────────────────────────────────

describe('FoldersService permission cascade', () => {
  it('copies parent FolderPermission rows on create', async () => {
    const parentPerms = [
      { folderId: 'parent', userId: 'u1', actions: [FolderAction.VIEW], inherited: true },
      { folderId: 'parent', userId: 'u2', actions: [FolderAction.VIEW, FolderAction.UPLOAD], inherited: false },
    ]
    const createdFolder = folderRow({ id: 'new', parentId: 'parent' })

    // We need to capture what the transaction callback does
    let capturedTx: ReturnType<typeof buildPrismaMock> | null = null
    const prisma = makePrisma()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = buildPrismaMock()
      ;(tx.folder.create as jest.Mock).mockResolvedValue(createdFolder)
      ;(tx.folderPermission.findMany as jest.Mock).mockResolvedValue(parentPerms)
      ;(tx.folderPermission.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      capturedTx = tx
      return cb(tx)
    })
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue({ id: 'parent' })
    ;(prisma.folderPermission.findUnique as jest.Mock).mockResolvedValue(null)

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await svc.create({ name: 'Sub', parentId: 'parent' }, 'u1', Role.ADMIN)

    expect(capturedTx!.folderPermission.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ folderId: 'new', inherited: true }),
        ]),
      }),
    )
  })

  it('deletes inherited rows and re-cascades on move', async () => {
    const newParentPerms = [
      { folderId: 'new-parent', userId: 'u2', actions: [FolderAction.VIEW], inherited: true },
    ]
    const movedFolder = folderRow({ id: 'f1', parentId: 'old-parent' })

    let capturedTx: ReturnType<typeof buildPrismaMock> | null = null
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(movedFolder)
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 'f1' }]) // only itself in descendants
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = buildPrismaMock()
      ;(tx.folder.update as jest.Mock).mockResolvedValue({ ...movedFolder, parentId: 'new-parent' })
      ;(tx.folderPermission.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(tx.folderPermission.findMany as jest.Mock).mockResolvedValue(newParentPerms)
      ;(tx.folderPermission.createMany as jest.Mock).mockResolvedValue({ count: 1 })
      capturedTx = tx
      return cb(tx)
    })
    ;(prisma.folderPermission.findUnique as jest.Mock).mockResolvedValue(null)

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await svc.update('f1', { parentId: 'new-parent' }, 'u1', Role.ADMIN)

    expect(capturedTx!.folderPermission.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { folderId: 'f1', inherited: true } }),
    )
    expect(capturedTx!.folderPermission.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ folderId: 'f1', inherited: true }),
        ]),
      }),
    )
  })
})

// ─── create() ────────────────────────────────────────────────────────────────

describe('FoldersService.create', () => {
  it('throws 403 when non-ADMIN tries to create root-level folder', async () => {
    const svc = new FoldersService(makePrisma() as never, makePermissions() as never)
    await expect(svc.create({ name: 'Root' }, 'u1', Role.USER)).rejects.toThrow(ForbiddenException)
  })

  it('throws 409 on duplicate sibling name', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue({ id: 'parent' })
    const err = new Prisma.PrismaClientKnownRequestError('Unique', { code: 'P2002', clientVersion: '6' })
    ;(prisma.$transaction as jest.Mock).mockRejectedValue(err)

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await expect(svc.create({ name: 'Finance', parentId: 'parent' }, 'u1', Role.ADMIN)).rejects.toThrow(
      ConflictException,
    )
  })

  it('throws 404 when parent folder does not exist', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(null)

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await expect(svc.create({ name: 'Sub', parentId: 'missing' }, 'u1', Role.ADMIN)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─── remove() ────────────────────────────────────────────────────────────────

describe('FoldersService.remove', () => {
  it('throws 400 when attempting to delete root folder', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ parentId: null, _count: { children: 0, documents: 0 } }),
    )

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await expect(svc.remove('f1', 'reject', 'u1', Role.ADMIN)).rejects.toThrow(BadRequestException)
  })

  it('throws 400 on reject strategy when folder is not empty', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ _count: { children: 1, documents: 0 } }),
    )

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await expect(svc.remove('f1', 'reject', 'u1', Role.ADMIN)).rejects.toThrow(BadRequestException)
  })

  it('throws 403 when non-ADMIN tries cascade strategy', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ _count: { children: 2, documents: 5 } }),
    )

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await expect(svc.remove('f1', 'cascade', 'u1', Role.USER)).rejects.toThrow(ForbiddenException)
  })

  it('deletes empty folder with reject strategy', async () => {
    const prisma = makePrisma()
    ;(prisma.folder.findUnique as jest.Mock).mockResolvedValue(
      folderRow({ _count: { children: 0, documents: 0 } }),
    )
    ;(prisma.folder.delete as jest.Mock).mockResolvedValue({})

    const svc = new FoldersService(prisma as never, makePermissions() as never)
    await svc.remove('f1', 'reject', 'u1', Role.ADMIN)

    expect(prisma.folder.delete).toHaveBeenCalledWith({ where: { id: 'f1' } })
  })
})
