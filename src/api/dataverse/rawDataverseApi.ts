const DATAVERSE_ORG_URL =
  (import.meta.env.VITE_DATAVERSE_ORG_URL as string | undefined)?.replace(/\/+$/, '') ||
  'https://dge.crm15.dynamics.com'

interface DataverseErrorPayload {
  error?: {
    message?: string
    innererror?: {
      message?: string
    }
  }
}

function buildUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${DATAVERSE_ORG_URL}${normalizedPath}`
}

async function parseDataverseError(response: Response) {
  try {
    const payload = (await response.json()) as DataverseErrorPayload
    return (
      payload.error?.message ||
      payload.error?.innererror?.message ||
      `Dataverse request failed with status ${response.status}.`
    )
  } catch {
    return `Dataverse request failed with status ${response.status}.`
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      ...(init?.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(await parseDataverseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function retrieveMultipleDataverseRecords<T>(entitySet: string, query: string) {
  const normalizedQuery = query.startsWith('?') ? query : `?${query}`
  const payload = await request<{ value: T[] }>(`/api/data/v9.2/${entitySet}${normalizedQuery}`)
  return payload.value ?? []
}

export async function associateDataverseReference(args: {
  targetEntitySet: string
  targetId: string
  relationship: string
  relatedEntitySet: string
  relatedId: string
}) {
  await request<void>(
    `/api/data/v9.2/${args.targetEntitySet}(${args.targetId})/${args.relationship}/$ref`,
    {
      method: 'POST',
      body: JSON.stringify({
        '@odata.id': `${DATAVERSE_ORG_URL}/api/data/v9.2/${args.relatedEntitySet}(${args.relatedId})`,
      }),
    }
  )
}

