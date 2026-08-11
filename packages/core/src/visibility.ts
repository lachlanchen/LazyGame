import type { ViewerIdentity, Visibility, VisibleValue } from './types.js'

export function canView(visibility: Visibility, viewer: ViewerIdentity): boolean {
  if (!visibility || typeof visibility !== 'object' || !viewer || typeof viewer !== 'object') return false
  if (!['spectator', 'server', 'player', 'companion'].includes(viewer.role)) return false
  if (viewer.role === 'server') return true
  if (visibility.kind === 'public') return true
  if (viewer.role === 'spectator') return false
  switch (visibility.kind) {
    case 'actor':
      return typeof visibility.actorId === 'string' && visibility.actorId.trim().length > 0 &&
        typeof viewer.actorId === 'string' && viewer.actorId.trim().length > 0 &&
        viewer.actorId === visibility.actorId
    case 'team':
      return typeof visibility.teamId === 'string' && visibility.teamId.trim().length > 0 &&
        typeof viewer.teamId === 'string' && viewer.teamId.trim().length > 0 &&
        viewer.teamId === visibility.teamId
    case 'server':
      return false
    default:
      return false
  }
}

export function visibleValues<T>(
  values: readonly VisibleValue<T>[],
  viewer: ViewerIdentity,
): readonly T[] {
  return values.filter((item) => canView(item.visibility, viewer)).map((item) => item.value)
}
