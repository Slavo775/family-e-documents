import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { ValidationPipe, type INestApplication } from '@nestjs/common'
import type { Server } from 'http'
import request from 'supertest'
import { FoldersController } from './folders.controller'
import { FoldersService } from './folders.service'
import { BearerTokenGuard } from '../auth/bearer-token.guard'
import { Role } from '@family-docs/db'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const adminUser = { id: 'admin-id', role: Role.ADMIN }
const userUser = { id: 'user-id', role: Role.USER }

const mockFolderNode = (overrides = {}) => ({
  id: 'f1',
  name: 'Finance',
  parentId: 'root',
  childCount: 0,
  documentCount: 0,
  userPermissions: ['VIEW', 'MANAGE'],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

// Mock BearerTokenGuard to inject a controllable user
const makeAuthGuard = (user: { id: string; role: Role }) => ({
  canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user: typeof user } } }) => {
    ctx.switchToHttp().getRequest().user = user
    return true
  },
})

async function buildApp(user: { id: string; role: Role }, serviceMock: Partial<FoldersService>) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [FoldersController],
    providers: [{ provide: FoldersService, useValue: serviceMock }],
  })
    .overrideGuard(BearerTokenGuard)
    .useValue(makeAuthGuard(user))
    .compile()

  const app = module.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

// ─── POST /api/v1/folders ─────────────────────────────────────────────────────

describe('POST /api/v1/folders', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('201 — happy path: ADMIN creates a subfolder', async () => {
    const node = mockFolderNode()
    const svc = { create: jest.fn().mockResolvedValue(node) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .post('/api/v1/folders')
      .send({ name: 'Finance', parentId: 'root' })
      .expect(201)

    expect(res.body).toMatchObject({ id: 'f1', name: 'Finance' })
    expect(svc.create).toHaveBeenCalledWith(
      { name: 'Finance', parentId: 'root' },
      adminUser.id,
      adminUser.role,
    )
  })

  it('403 — USER cannot create root-level folder', async () => {
    const { ForbiddenException } = await import('@nestjs/common')
    const svc = { create: jest.fn().mockRejectedValue(new ForbiddenException()) }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .post('/api/v1/folders')
      .send({ name: 'Finance' })
      .expect(403)
  })

  it('409 — duplicate sibling name', async () => {
    const { ConflictException } = await import('@nestjs/common')
    const svc = { create: jest.fn().mockRejectedValue(new ConflictException('A folder with that name already exists here')) }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer())
      .post('/api/v1/folders')
      .send({ name: 'Finance', parentId: 'root' })
      .expect(409)
  })

  it('400 — empty name is rejected by validation', async () => {
    const svc = { create: jest.fn() }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer())
      .post('/api/v1/folders')
      .send({ name: '', parentId: 'root' })
      .expect(400)

    expect(svc.create).not.toHaveBeenCalled()
  })
})

// ─── PATCH /api/v1/folders/:id ────────────────────────────────────────────────

describe('PATCH /api/v1/folders/:id', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('200 — renames a folder', async () => {
    const node = mockFolderNode({ name: 'New Name' })
    const svc = { update: jest.fn().mockResolvedValue(node) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .patch('/api/v1/folders/f1')
      .send({ name: 'New Name' })
      .expect(200)

    expect(res.body).toMatchObject({ name: 'New Name' })
  })

  it('200 — moves a folder to new parent', async () => {
    const node = mockFolderNode({ parentId: 'new-parent' })
    const svc = { update: jest.fn().mockResolvedValue(node) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .patch('/api/v1/folders/f1')
      .send({ parentId: 'new-parent' })
      .expect(200)

    expect(res.body.parentId).toBe('new-parent')
  })

  it('400 — cycle detection error', async () => {
    const { BadRequestException } = await import('@nestjs/common')
    const svc = {
      update: jest.fn().mockRejectedValue(
        new BadRequestException('Cannot move folder into its own descendant'),
      ),
    }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .patch('/api/v1/folders/f1')
      .send({ parentId: 'f1' })
      .expect(400)

    expect(res.body.message).toContain('descendant')
  })

  it('403 — USER without MANAGE cannot update', async () => {
    const { ForbiddenException } = await import('@nestjs/common')
    const svc = { update: jest.fn().mockRejectedValue(new ForbiddenException()) }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .patch('/api/v1/folders/f1')
      .send({ name: 'Hacked' })
      .expect(403)
  })
})

// ─── DELETE /api/v1/folders/:id ───────────────────────────────────────────────

describe('DELETE /api/v1/folders/:id', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('204 — deletes an empty folder with reject strategy', async () => {
    const svc = { remove: jest.fn().mockResolvedValue(undefined) }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer()).delete('/api/v1/folders/f1').expect(204)

    expect(svc.remove).toHaveBeenCalledWith('f1', 'reject', adminUser.id, adminUser.role)
  })

  it('400 — reject strategy fails on non-empty folder', async () => {
    const { BadRequestException } = await import('@nestjs/common')
    const svc = {
      remove: jest.fn().mockRejectedValue(new BadRequestException('Folder is not empty')),
    }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer()).delete('/api/v1/folders/f1').expect(400)
    expect(res.body.message).toBe('Folder is not empty')
  })

  it('204 — ADMIN cascade-deletes folder with contents', async () => {
    const svc = { remove: jest.fn().mockResolvedValue(undefined) }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer())
      .delete('/api/v1/folders/f1?strategy=cascade')
      .expect(204)

    expect(svc.remove).toHaveBeenCalledWith('f1', 'cascade', adminUser.id, adminUser.role)
  })

  it('403 — non-ADMIN cannot cascade delete', async () => {
    const { ForbiddenException } = await import('@nestjs/common')
    const svc = { remove: jest.fn().mockRejectedValue(new ForbiddenException()) }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .delete('/api/v1/folders/f1?strategy=cascade')
      .expect(403)
  })
})
