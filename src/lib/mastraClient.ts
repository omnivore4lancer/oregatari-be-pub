export type MastraRun = {
  status: string
  result?: unknown
  error?: unknown
}

export class MastraError extends Error {
  constructor(public readonly detail: string) {
    super(`Mastra error: ${detail}`)
    this.name = "MastraError"
  }
}

export function mastraErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (typeof error === "string") return error
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>
    return (e.message as string) ?? (e.error as string) ?? JSON.stringify(error)
  }
  return String(error)
}

export class MastraClient {
  private readonly baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.MASTRA_URL ?? "http://localhost:4111"
  }

  private url(workflowId: string, path: string): string {
    return `${this.baseUrl}/api/workflows/${workflowId}${path}`
  }

  async createRun(workflowId: string): Promise<string> {
    const res = await fetch(this.url(workflowId, "/create-run"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) throw new MastraError(await res.text())
    const { runId } = (await res.json()) as { runId: string }
    return runId
  }

  async stream(workflowId: string, inputData: unknown, runId?: string): Promise<Response> {
    const id = runId ?? crypto.randomUUID()
    const res = await fetch(this.url(workflowId, `/stream?runId=${id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData }),
    })
    if (!res.ok || !res.body) throw new MastraError(await res.text())
    return res
  }

  async createAndStream(workflowId: string, inputData: unknown): Promise<{ runId: string; response: Response }> {
    const runId = await this.createRun(workflowId)
    const response = await this.stream(workflowId, inputData, runId)
    return { runId, response }
  }

  async startAsync(workflowId: string, inputData: unknown): Promise<unknown> {
    const res = await fetch(this.url(workflowId, "/start-async"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData }),
    })
    if (!res.ok) throw new MastraError(await res.text())
    return res.json()
  }

  async startJob(workflowId: string, inputData: unknown): Promise<string> {
    const runId = await this.createRun(workflowId)
    const res = await fetch(this.url(workflowId, `/start?runId=${runId}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData }),
    })
    if (!res.ok) throw new MastraError(await res.text())
    return runId
  }

  async getRunStatus(workflowId: string, runId: string): Promise<MastraRun> {
    const res = await fetch(this.url(workflowId, `/runs/${runId}?fields=result,error`))
    if (!res.ok) throw new MastraError(await res.text())
    return res.json() as Promise<MastraRun>
  }

  async observe(workflowId: string, runId: string, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(this.url(workflowId, `/observe?runId=${runId}`), {
      method: "POST",
      signal,
    })
    if (!res.ok) throw new MastraError(await res.text())
    return res
  }

  workflowIdForJobType(jobType: string): string {
    const map: Record<string, string> = {
      COVER_IMAGE: "cover-image-workflow",
      PANEL_LAYOUT: "panel-layout-full-workflow",
      IMAGE_GENERATION: "page-image-workflow",
    }
    return map[jobType] ?? "page-image-workflow"
  }
}

interface WriteableStream {
  write(data: string | Uint8Array): Promise<unknown>
}

export async function forwardWorkflowStream(
  s: WriteableStream,
  body: ReadableStream<Uint8Array>,
  opts?: { sendDone?: boolean }
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  const flush = async () => {
    let depth = 0
    let inStr = false
    let esc = false
    let start = -1

    for (let i = 0; i < buf.length; i++) {
      const ch = buf[i]
      if (esc) { esc = false; continue }
      if (ch === "\\" && inStr) { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === "{") { if (depth++ === 0) start = i }
      else if (ch === "}" && depth > 0 && --depth === 0 && start >= 0) {
        try {
          const ev = JSON.parse(buf.slice(start, i + 1))
          if (ev.type === "workflow-step-output" && ev.from === "USER") {
            const text: string = ev.payload?.output
            if (text) await s.write(`data:${JSON.stringify({ text })}\n\n`)
          }
        } catch { /* ignore malformed JSON */ }
        start = -1
      }
    }
    buf = start >= 0 ? buf.slice(start) : ""
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      await flush()
    }
    if (opts?.sendDone) await s.write(`data:${JSON.stringify({ done: true })}\n\n`)
  } finally {
    reader.releaseLock()
  }
}
