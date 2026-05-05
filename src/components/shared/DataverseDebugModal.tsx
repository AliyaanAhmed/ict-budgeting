import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Database, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AccountsService } from '@/generated/services/AccountsService'
import { SystemusersService } from '@/generated/services/SystemusersService'

type Row = Record<string, unknown>

function pickDisplayName(row: Row, fallback: string) {
  const keys = ['fullname', 'name', 'domainname', 'internalemailaddress', 'accountnumber', 'systemuserid', 'accountid']
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return fallback
}

function RowAccordion({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--muted-foreground)]">{emptyText}</p>

  return (
    <div className="space-y-2">
      {rows.map((row, idx) => {
        const name = pickDisplayName(row, `Record ${idx + 1}`)
        return (
          <details key={`${name}-${idx}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] group">
            <summary className="list-none cursor-pointer px-3 py-2 text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-open:rotate-180" />
              <span>{name}</span>
            </summary>
            <div className="border-t border-[var(--border)] px-3 py-2">
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all text-xs text-[var(--muted-foreground)]">
                {JSON.stringify(row, null, 2)}
              </pre>
            </div>
          </details>
        )
      })}
    </div>
  )
}

export function DataverseDebugModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [systemUsers, setSystemUsers] = useState<Row[]>([])
  const [accounts, setAccounts] = useState<Row[]>([])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')

  const canCreate = useMemo(() => name.trim().length > 1, [name])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResult, accountsResult] = await Promise.all([
        SystemusersService.getAll(),
        AccountsService.getAll(),
      ])
      setSystemUsers((usersResult.data ?? []) as unknown as Row[])
      setAccounts((accountsResult.data ?? []) as unknown as Row[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to retrieve Dataverse records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setOpen(true)
    void loadData()
  }, [])

  const handleCreateAccount = async () => {
    if (!canCreate) return
    setCreating(true)
    setCreateMessage('')
    try {
      await AccountsService.create({
        name: name.trim(),
      } as never)

      setCreateMessage('Account created successfully (payload: name only).')
      setName('')
      setEmail('')
      await loadData()
    } catch (e) {
      const details = e instanceof Error ? e.message : 'Account create failed.'
      setCreateMessage(`Create failed: ${details}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl p-0">
        <div className="border-b border-[var(--border)] px-6 py-5 bg-[var(--muted)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--primary)]" />
              Dataverse Debug Modal
            </DialogTitle>
            <DialogDescription>
              Auto-loads `systemuser` and `account` data via generated Power Apps services.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[78vh] overflow-auto">
          <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Create Account (Dummy)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emailaddress1" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">accountratingcode = 1</p>
            <p className="text-xs text-[var(--muted-foreground)]">Create payload now sends only: {`{ name }`}</p>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateAccount} disabled={!canCreate || creating}>
                <Plus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Create Account'}
              </Button>
              <Button variant="outline" onClick={() => void loadData()} disabled={loading || creating}>
                Refresh Data
              </Button>
            </div>
            {createMessage && <p className="text-xs text-[var(--muted-foreground)]">{createMessage}</p>}
          </div>

          {loading && <p className="text-sm text-[var(--muted-foreground)]">Loading systemuser and account...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-4">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">systemuser ({systemUsers.length})</h3>
              <RowAccordion rows={systemUsers} emptyText="No systemuser records returned." />
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">account ({accounts.length})</h3>
              <RowAccordion rows={accounts} emptyText="No account records returned." />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
