import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import type { User } from '../generated/prisma/index.js'

const ADMIN_EMAIL = 'admin@family.local'
const ADMIN_PASSWORD = 'Admin123!'
const SALT_ROUNDS = 10

export class UserFactory {
  private static counter = 0

  private static generateDefaults(): Omit<User, never> {
    const idx = ++UserFactory.counter
    return {
      id: randomUUID(),
      email: `user-${idx}@test.local`,
      passwordHash: 'hashed-password',
      name: `Test User ${idx}`,
      role: 'USER',
      canRestrictDocs: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  private _user: User

  constructor(overrides: Partial<User> = {}) {
    this._user = { ...UserFactory.generateDefaults(), ...overrides }
  }

  get user(): User {
    return this._user
  }

  public setUserData(overrides: Partial<User> = {}) {
    this._user = { ...this._user, ...overrides }
  }

  public static resetCounter() {
    UserFactory.counter = 0
  }

  public static async createAdmin(): Promise<UserFactory> {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)
    return new UserFactory({
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    })
  }

  public static async createUser(
    email: string,
    password: string,
    name: string,
  ): Promise<UserFactory> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    return new UserFactory({ email, passwordHash, name, role: 'USER' })
  }
}
