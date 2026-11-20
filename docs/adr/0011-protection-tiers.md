# 11 · Content protection comes in four tiers

- Status: proposed
- Date: 2026-10-28

## Context

There is no production-grade open-source Widevine or FairPlay license server and no $0 production DRM tier. Tenants differ in how much protection they need. Widevine's hosted Cloud License Service is reported to retire in 2027-04 (unverified).

## Decision

Tier T0: short-lived signed URLs bound to tenant, asset and session (5 minutes). Tier T1: HLS AES-128 with key rotation, keys served by `/playback/key` after the same checks. Tier T2: ClearKey (EME) for web and expo-video, license from our API. Tier T3: multi-DRM through a vendor add-on (Bunny per-license price, Axinom or EZDRM flat fee), enabled per tenant by entitlement. FairPlay needs an Apple FPS package per legal entity, so a T3 tenant brings its own. Forensic watermarking is out of scope and listed as commercial-only.

## Consequences

- Every tenant gets T0 to T2 at $0.
- T3 is a paid add-on and needs an owner yes on the vendor and SKU.
- T0 to T2 deter casual copying only. Premium studio content needs T3.
- The playback service must expose a vendor-neutral DRM seam from the start.

## Alternatives considered

- Self-hosted Widevine License Server SDK: needs Google licensing and operations effort.
- DRM for everyone: unaffordable at $0.
