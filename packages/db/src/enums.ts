// Generated from schema.ts enums. Mirrors the former Prisma enum exports (value object + union type).
import {
  assetStatus,
  contentStatus,
  dmcaStatus,
  dsarStatus,
  dsarType,
  liveEventStatus,
  mediaType,
  notificationType,
  plan,
  purchaseType,
  role,
  subStatus,
  videoQuality,
} from './schema'

export const AssetStatus = Object.fromEntries(assetStatus.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof assetStatus.enumValues)[number]]: K
}
export type AssetStatus = (typeof assetStatus.enumValues)[number]

export const ContentStatus = Object.fromEntries(contentStatus.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof contentStatus.enumValues)[number]]: K
}
export type ContentStatus = (typeof contentStatus.enumValues)[number]

export const DmcaStatus = Object.fromEntries(dmcaStatus.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof dmcaStatus.enumValues)[number]]: K
}
export type DmcaStatus = (typeof dmcaStatus.enumValues)[number]

export const DsarStatus = Object.fromEntries(dsarStatus.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof dsarStatus.enumValues)[number]]: K
}
export type DsarStatus = (typeof dsarStatus.enumValues)[number]

export const DsarType = Object.fromEntries(dsarType.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof dsarType.enumValues)[number]]: K
}
export type DsarType = (typeof dsarType.enumValues)[number]

export const LiveEventStatus = Object.fromEntries(
  liveEventStatus.enumValues.map((x) => [x, x])
) as { readonly [K in (typeof liveEventStatus.enumValues)[number]]: K }
export type LiveEventStatus = (typeof liveEventStatus.enumValues)[number]

export const MediaType = Object.fromEntries(mediaType.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof mediaType.enumValues)[number]]: K
}
export type MediaType = (typeof mediaType.enumValues)[number]

export const NotificationType = Object.fromEntries(
  notificationType.enumValues.map((x) => [x, x])
) as { readonly [K in (typeof notificationType.enumValues)[number]]: K }
export type NotificationType = (typeof notificationType.enumValues)[number]

export const Plan = Object.fromEntries(plan.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof plan.enumValues)[number]]: K
}
export type Plan = (typeof plan.enumValues)[number]

export const PurchaseType = Object.fromEntries(purchaseType.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof purchaseType.enumValues)[number]]: K
}
export type PurchaseType = (typeof purchaseType.enumValues)[number]

export const Role = Object.fromEntries(role.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof role.enumValues)[number]]: K
}
export type Role = (typeof role.enumValues)[number]

export const SubStatus = Object.fromEntries(subStatus.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof subStatus.enumValues)[number]]: K
}
export type SubStatus = (typeof subStatus.enumValues)[number]

export const VideoQuality = Object.fromEntries(videoQuality.enumValues.map((x) => [x, x])) as {
  readonly [K in (typeof videoQuality.enumValues)[number]]: K
}
export type VideoQuality = (typeof videoQuality.enumValues)[number]
