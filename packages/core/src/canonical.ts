const FNV_PRIME = 0x100000001b3n
const MASK_64 = 0xffffffffffffffffn
const OFFSETS = [0xcbf29ce484222325n, 0x84222325cbf29ce4n] as const

function normalize(value: unknown, seen: Set<object>): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical values must contain only finite numbers')
    return Object.is(value, -0) ? 0 : value
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new TypeError('Canonical values cannot contain cycles')
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new TypeError('Canonical arrays cannot contain sparse slots')
      }
    }
    const ownArrayKeys = Reflect.ownKeys(value).filter((key) => key !== 'length')
    if (
      ownArrayKeys.some((key) => typeof key === 'symbol') ||
      ownArrayKeys.length !== value.length ||
      ownArrayKeys.some((key, index) => key !== String(index))
    ) {
      throw new TypeError('Canonical arrays cannot contain named properties')
    }
    seen.add(value)
    const result: unknown[] = []
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
      if (!descriptor?.enumerable || !('value' in descriptor)) {
        throw new TypeError(`Canonical array index ${index} must be an enumerable data property`)
      }
      result.push(normalize(descriptor.value, seen))
    }
    seen.delete(value)
    return result
  }
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Canonical objects must be plain JSON records')
    }
    if (seen.has(value)) throw new TypeError('Canonical values cannot contain cycles')
    seen.add(value)
    const ownRecordKeys = Reflect.ownKeys(value)
    if (ownRecordKeys.some((key) => typeof key === 'symbol')) {
      throw new TypeError('Canonical objects cannot contain symbol properties')
    }
    const record = value as Record<string, unknown>
    if (ownRecordKeys.length !== Object.keys(record).length) {
      throw new TypeError('Canonical objects require enumerable data properties')
    }
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    for (const key of Object.keys(record).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(record, key)
      if (!descriptor?.enumerable || !('value' in descriptor)) {
        throw new TypeError(`Canonical property ${key} must be an enumerable data property`)
      }
      const item = descriptor.value
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        throw new TypeError(`Canonical property ${key} is not JSON-safe`)
      }
      Object.defineProperty(result, key, {
        value: normalize(item, seen),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    seen.delete(value)
    return result
  }
  throw new TypeError(`Canonical value of type ${typeof value} is not supported`)
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(normalize(value, new Set()))
}

function fnv64(bytes: Uint8Array, offset: bigint): bigint {
  let value = offset
  for (const byte of bytes) {
    value ^= BigInt(byte)
    value = (value * FNV_PRIME) & MASK_64
  }
  return value
}

/** A deterministic identity checksum. Authorization must still be enforced by
 * recomputing the complete legal candidate set on the authoritative state. */
export function identityDigest(value: unknown): string {
  const bytes = new TextEncoder().encode(canonicalStringify(value))
  return OFFSETS.map((offset) => fnv64(bytes, offset).toString(16).padStart(16, '0')).join('')
}

export function createStateToken(
  gameId: string,
  serializedState: unknown,
  context: { version?: string; activeActor?: string | null } = {},
): string {
  return `state_${identityDigest({ gameId, serializedState, ...context })}`
}

export function createCandidateId(
  stateToken: string,
  actorId: string,
  canonicalAction: unknown,
): string {
  return `candidate_${identityDigest({ stateToken, actorId, canonicalAction })}`
}
