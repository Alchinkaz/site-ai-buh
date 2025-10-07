import { NextRequest } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "documents.json")

async function readDocuments(): Promise<any[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(content)
  } catch (err: any) {
    if (err?.code === "ENOENT") return []
    throw err
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const docs = await readDocuments()
  const idNum = Number(params.id)
  const found = docs.find((d) => Number(d.id) === idNum)
  if (!found) {
    return new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }
  return new Response(JSON.stringify(found), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="document-${found.id}.json"`,
    },
  })
}


