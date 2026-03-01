import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'users.json')
const SECRET = process.env.JWT_SECRET || 'tatvam-sacred-key-change-in-production'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    id: string
    name: string
    email: string
    hashedPassword: string
    createdAt: string
}

export interface SafeUser {
    id: string
    name: string
    email: string
    createdAt: string
}

// ─── Database (JSON file) ─────────────────────────────────────────────────────

function ensureDir() {
    const dir = join(process.cwd(), 'data')
    if (!existsSync(dir)) {
        const { mkdirSync } = require('fs')
        mkdirSync(dir, { recursive: true })
    }
}

function readUsers(): User[] {
    ensureDir()
    if (!existsSync(DB_PATH)) {
        writeFileSync(DB_PATH, '[]', 'utf-8')
        return []
    }
    const raw = readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(raw)
}

function writeUsers(users: User[]) {
    ensureDir()
    writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8')
}

export function findUserByEmail(email: string): User | undefined {
    return readUsers().find(u => u.email === email.toLowerCase())
}

export function findUserById(id: string): User | undefined {
    return readUsers().find(u => u.id === id)
}

export function createUser(name: string, email: string, password: string): User {
    const users = readUsers()
    const user: User = {
        id: randomBytes(16).toString('hex'),
        name,
        email: email.toLowerCase(),
        hashedPassword: hashPassword(password),
        createdAt: new Date().toISOString(),
    }
    users.push(user)
    writeUsers(users)
    return user
}

// ─── Password Hashing ─────────────────────────────────────────────────────────

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':')
    const hashBuffer = Buffer.from(hash, 'hex')
    const testBuffer = scryptSync(password, salt, 64)
    if (hashBuffer.length !== testBuffer.length) return false
    return timingSafeEqual(new Uint8Array(hashBuffer), new Uint8Array(testBuffer))
}

// ─── Token (HMAC-based) ──────────────────────────────────────────────────────

export function createToken(userId: string, email: string): string {
    const payload = {
        sub: userId,
        email,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', SECRET).update(data).digest('base64url')
    return `${data}.${sig}`
}

export function verifyToken(token: string): { sub: string; email: string } | null {
    try {
        const [data, sig] = token.split('.')
        const expectedSig = createHmac('sha256', SECRET).update(data).digest('base64url')
        if (sig !== expectedSig) return null

        const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
        if (payload.exp < Date.now()) return null

        return { sub: payload.sub, email: payload.email }
    } catch {
        return null
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toSafeUser(user: User): SafeUser {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}
