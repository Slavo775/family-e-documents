import { randomUUID } from 'node:crypto'
import type { Folder } from '../generated/prisma/index.js'

export class FolderFactory {
  private static counter = 0

  private static generateDefaults(createdById: string): Folder {
    const idx = ++FolderFactory.counter
    return {
      id: randomUUID(),
      name: `Folder ${idx}`,
      parentId: null,
      createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  private _folder: Folder

  constructor(createdById: string, overrides: Partial<Folder> = {}) {
    this._folder = { ...FolderFactory.generateDefaults(createdById), ...overrides }
  }

  get folder(): Folder {
    return this._folder
  }

  public static resetCounter() {
    FolderFactory.counter = 0
  }
}
