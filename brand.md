# barq — brand notes for the demo

Source: the 3 App Store screenshots + app icon in `_reference/`
(listing https://apps.apple.com/us/app/barq/id6463204586). Palette measured with `_tools/palette.py`.

## Reference images (confirmed visually)

| File | Brief said | What it actually shows |
|---|---|---|
| `shot1.jpeg` | International Transfer | **Confirmed.** "International Transfer" screen: segmented tabs (Send Money / Transfer History / Price Estimate), "Lowest Exchange Rates in Saudi Arabia" promo card with black "Send money to new beneficiary" button, pink "Send to self" card, "Recent Beneficiaries" with initials avatars + flag. |
| `shot2.jpeg` | Card management | **Confirmed.** "Card details": yellow VISA virtual card with the barq mark, 3 square action tiles (Card Details / Freeze Card / Card Settings), physical-card order tracker with green progress bar, linked account row, Add to Apple Wallet, Transactions. |
| `shot3.jpeg` | Transfer success | **Corrected:** it is a **Local Transfer** success screen (marketing headline "Local Transfer"), not international. Still the right model for `/send/success/`: avatar, masked recipient name, big "-2000.00 SAR", green "Money sent successfully" pill, "From" breakdown card with Note + "Txn ID" with copy icon, full-width black **Done** button. |
| `icon.png` / `icon.webp` | App icon | White barq mark (a four-point "spark" with a lightning-step stem) on solid black. |

**No screenshot shows the bottom tab bar.** See "Tab bar" below — the labels are inferred.

## Palette (measured)

| Token | Hex | Measured from |
|---|---|---|
| `--bg` page background | `#F8F8FA` | shot1 canvas, shot2 gaps (shot3: `#F8F7FC`) |
| `--surface` cards | `#FFFFFF` | shot2 list cards |
| `--tabbar` tab bar surface | `#FFFFFF` | shot2 white bar (no tab bar in shots; uses the measured card surface) |
| `--ink` text / primary button | `#090909` | shot3 Done button, shot1 Send-money button (heading text `#080808`) |
| `--on-ink` button label | `#FFFFFF` | shot3 Done label |
| `--muted` secondary text | `#6C6C6C` | shot3 sub-labels |
| `--muted-2` tertiary / inactive | `#818183` | shot1 inactive segment |
| `--line` hairline / track | `#EDEDED` | shot2 progress track |
| `--yellow` brand accent | `#FED932` | shot2 virtual card (icon `#FEDB03`) |
| `--green` success | `#04BA87` | shot2 progress bar (pill text extreme `#09D193`) |
| `--green-bg` success pill | `#E1FFF7` | shot3 success pill |
| `--blue-bg` promo light | `#E0F5F8` | shot1 promo card upper / avatar tint |
| `--blue` promo deep | `#B3E0E6` | shot1 promo card lower |
| `--pink-bg` promo pink | `#FCDEE6` | shot1 "Send to self" card |
| `--teal` brand teal | `#0E8186` | shot3 transfer icon |
| `--aqua` marketing aqua | `#B2E3E7` | shot3 backdrop (50.8% share) |
| `--black` icon ground | `#000000` | icon background (86.6% share) |

Primary button sampled at `#090909` (black), tab bar sampled at `#FFFFFF`, page background `#F8F8FA`.

## Type

Clean geometric grotesk with tight headlines and generous x-height. Closest Google Font: **Inter**
(weights 400/500/600/700). Fallback stack:
`"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
Headings 700 at ~22px (screen title, shot1), body 14–15px, captions 11–12px muted.

## Logo / icon treatment

- App icon: white mark on solid black, rounded-square (iOS squircle ≈ 22% radius).
- Lowercase wordmark "barq" set in Inter 700 beside the mark; the mark is the ⚡ motif.
- On the yellow card the mark is black on yellow (shot2) — used for the home wallet card.

## Shape, buttons, density

- **Primary button:** solid `--ink` black fill, white 14–15px/600 label, full-width, height 52px,
  radius **12px** (shot3 Done; shot1 inline buttons radius 10px).
- **Segment / chip:** pill (radius 999px), active = black fill white text, inactive = muted text, no fill.
- **Cards:** white, radius **16px**, no border, very soft shadow; promo cards use the tinted fills.
- **Action tiles:** square white tiles radius 14px, line icon over 2-line 12px label (shot2).
- **Density:** airy — 16px screen gutters, 12px gaps between cards, 44px+ touch targets.

## Tab bar (inferred — not visible in any screenshot)

The listing/reviews confirm a bottom tab bar with **More** (More → Support → Chat with Support).
The other labels could not be read from the screenshots, so these are **inferred** from the
screens they show:

| Tab | Icon | Behaviour in demo |
|---|---|---|
| Home | house | → `/home/` |
| Transfers | two arrows (shot3 transfer glyph) | → `/send/` |
| Cards | card (shot2 card glyph) | bottom sheet "Available in the barq app" |
| Rewards | gift / wheel | → `/rewards/wheel/` |
| More | three dots | bottom sheet (Support, Limits → `/profile/limits/`, Log out) |

White bar, black active icon+label, `--muted-2` inactive.

## Product phrases reused

1. "1 app, limitless possibilities" (splash)
2. "Best exchange rates in the Kingdom" (home + quote)
3. "Send money your way: Cash Pick Up · Bank Transfer · Digital Wallet" (send hub)
4. "Money sent successfully" + "Txn ID" (success)

Also used: "+200 countries", "Send money home", "Quick, easy and arrives in seconds",
"0 SAR fee", "New beneficiary", "Available Balance", "Current Balance", cashback wheel.
