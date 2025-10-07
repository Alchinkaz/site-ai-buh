import { NextRequest } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "documents.json")

async function readDocuments(): Promise<any[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(content)
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2))
      return []
    }
    throw err
  }
}

async function writeDocuments(docs: any[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(docs, null, 2))
}

export async function GET() {
  const docs = await readDocuments()
  return new Response(JSON.stringify(docs), {
    headers: { "content-type": "application/json" },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const docs = await readDocuments()
  const nextId = (docs.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0) || 0) + 1
  const now = new Date().toISOString()
  const newDoc = { id: nextId, createdAt: now, updatedAt: now, ...body }
  docs.push(newDoc)
  await writeDocuments(docs)
  return new Response(JSON.stringify(newDoc), {
    status: 201,
    headers: { "content-type": "application/json" },
  })
}


