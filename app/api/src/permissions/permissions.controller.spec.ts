import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { ValidationPipe, ForbiddenException, type INestApplication } from '@nestjs/common'
import type { Server } from 'http'
import request from 'supertest'
import { PermissionsController } from './permissions.controller'
import { PermissionsService } from './permissions.service'
import { BearerTokenGuard } from '../auth/bearer-token.guard'
import { RolesGuard } from '../common/roles.guard'
import { Role } from '@family-docs/db'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const adminUser = { id: 'admin-id', role: Role.ADMIN }
const userUser = { id: 'user-id', role: Role.USER }

const mockPermissionEntry = (overrides = {}) => ({
  userId: 'u1',
  userName: 'Alice',
  actions: ['VIEW', 'UPLOAD'],
  inherited: false,
  ...overrides,
})

const makeAuthGuard = (user: { id: string; role: Role }) => ({
  canActivate: (ctx: { switchToHttp: () => { getRequest: () => object } }) => {
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>
    req.user = user
    return true
  },
})

// Functional RolesGuard mock: throws ForbiddenException for non-ADMIN
const rolesGuardMock = {
  canActivate: (ctx: { switchToHttp: () => { getRequest: () => object } }) => {
    const req = ctx.switchToHttp().getRequest() as { user?: { role: string } }
    if (req.user?.role !== Role.ADMIN) throw new ForbiddenException()
    return true
  },
}

async function buildApp(
  user: { id: string; role: Role },
  serviceMock: Partial<PermissionsService>,
) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [PermissionsController],
    providers: [{ provide: PermissionsService, useValue: serviceMock }],
  })
    .overrideGuard(BearerTokenGuard)
    .useValue(makeAuthGuard(user))
    .overrideGuard(RolesGuard)
    .useValue(rolesGuardMock)
    .compile()

  const app = module.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

// ─── GET /api/v1/folders/:folderId/permissions ────────────────────────────────

describe('GET /api/v1/folders/:folderId/permissions', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('200 — ADMIN lists permissions on a folder', async () => {
    const entries = [mockPermissionEntry()]
    const svc = { listForFolder: jest.fn().mockResolvedValue(entries) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .get('/api/v1/folders/f1/permissions')
      .expect(200)

    expect(res.body).toEqual(entries)
    expect(svc.listForFolder).toHaveBeenCalledWith('f1')
  })

  it('200 — empty array when no permissions exist', async () => {
    const svc = { listForFolder: jest.fn().mockResolvedValue([]) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .get('/api/v1/folders/f1/permissions')
      .expect(200)

    expect(res.body).toEqual([])
  })

  it('403 — USER (non-ADMIN) cannot list permissions', async () => {
    const svc = { listForFolder: jest.fn() }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .get('/api/v1/folders/f1/permissions')
      .expect(403)

    expect(svc.listForFolder).not.toHaveBeenCalled()
  })
})

// ─── PUT /api/v1/folders/:folderId/permissions/:userId ────────────────────────

describe('PUT /api/v1/folders/:folderId/permissions/:userId', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('200 — ADMIN upserts a permission', async () => {
    const entry = mockPermissionEntry()
    const svc = { upsertForFolder: jest.fn().mockResolvedValue(entry) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .put('/api/v1/folders/f1/permissions/u1')
      .send({ actions: ['VIEW', 'UPLOAD'] })
      .expect(200)

    expect(res.body).toEqual(entry)
    expect(svc.upsertForFolder).toHaveBeenCalledWith('f1', 'u1', ['VIEW', 'UPLOAD'])
  })

  it('200 — ADMIN sets empty actions (block user)', async () => {
    const entry = mockPermissionEntry({ actions: [] })
    const svc = { upsertForFolder: jest.fn().mockResolvedValue(entry) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .put('/api/v1/folders/f1/permissions/u1')
      .send({ actions: [] })
      .expect(200)

    expect(res.body.actions).toEqual([])
  })

  it('400 — invalid action value rejected', async () => {
    const svc = { upsertForFolder: jest.fn() }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer())
      .put('/api/v1/folders/f1/permissions/u1')
      .send({ actions: ['INVALID'] })
      .expect(400)

    expect(svc.upsertForFolder).not.toHaveBeenCalled()
  })

  it('403 — USER (non-ADMIN) cannot upsert permissions', async () => {
    const svc = { upsertForFolder: jest.fn() }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .put('/api/v1/folders/f1/permissions/u1')
      .send({ actions: ['VIEW'] })
      .expect(403)

    expect(svc.upsertForFolder).not.toHaveBeenCalled()
  })
})

// ─── DELETE /api/v1/folders/:folderId/permissions/:userId ─────────────────────

describe('DELETE /api/v1/folders/:folderId/permissions/:userId', () => {
  let app: INestApplication<Server>

  afterEach(() => app?.close())

  it('204 — ADMIN deletes a permission', async () => {
    const svc = { removeForFolder: jest.fn().mockResolvedValue(undefined) }
    app = await buildApp(adminUser, svc)

    await request(app.getHttpServer())
      .delete('/api/v1/folders/f1/permissions/u1')
      .expect(204)

    expect(svc.removeForFolder).toHaveBeenCalledWith('f1', 'u1')
  })

  it('404 — permission not found', async () => {
    const { NotFoundException } = await import('@nestjs/common')
    const svc = { removeForFolder: jest.fn().mockRejectedValue(new NotFoundException('Permission not found')) }
    app = await buildApp(adminUser, svc)

    const res = await request(app.getHttpServer())
      .delete('/api/v1/folders/f1/permissions/u1')
      .expect(404)

    expect(res.body.message).toBe('Permission not found')
  })

  it('403 — USER (non-ADMIN) cannot delete permissions', async () => {
    const svc = { removeForFolder: jest.fn() }
    app = await buildApp(userUser, svc)

    await request(app.getHttpServer())
      .delete('/api/v1/folders/f1/permissions/u1')
      .expect(403)

    expect(svc.removeForFolder).not.toHaveBeenCalled()
  })
})
