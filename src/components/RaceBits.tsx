import { Badge } from '@/components/ui/badge'
import {
  RaceStatus, RaceTier, STATUS_BADGE, STATUS_SHORT, TIER_LABELS, TIER_MARK, TIER_MARK_STYLE, cn,
} from '@/lib/utils'

export function TierMark({ tier, className }: { tier: RaceTier; className?: string }) {
  return (
    <span
      title={TIER_LABELS[tier]}
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
        TIER_MARK_STYLE[tier],
        className
      )}
    >
      {TIER_MARK[tier]}
    </span>
  )
}

export function StatusBadge({ status }: { status: RaceStatus }) {
  return <Badge className={STATUS_BADGE[status]}>{STATUS_SHORT[status]}</Badge>
}
