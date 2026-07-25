Overall, I'd score this UI 6.8/10.

Visual Design: 8.2/10

Usability: 6.5/10

Information Hierarchy: 6/10

Accessibility: 5.5/10

Consistency: 7/10

Trust & Financial UX: 6.5/10


It looks modern at first glance, but there are a number of UX issues that would become obvious once users start using it daily.


---

1. Header

Score: 7/10

Issues

Hamburger menu is oversized.

Theme switch is equally prominent as navigation.

ORTHO-PAY logo is too close to center, making the header feel unbalanced.

No notification icon.

No profile/avatar.


Fix

Instead:

☰      ORTHO-PAY          🔔   👤

Theme toggle belongs inside Settings, not permanently in the header.


---

2. Balance Card

Score: 8/10

This is the strongest part of the interface.

Issues

The card feels empty.

It only shows:

Balance

Tag

Transactions


Nothing else.

Financial apps usually show:

Available

Held

Pending

Last transaction

Currency selector


Fix

Example

Available Balance

$0.00

Available
Pending
Escrow
Rewards

User Tag

The card should provide more useful information.


---

3. Copy Tag Button

Score: 5/10

Looks like a disabled button.

Not obvious.

Fix

Use an outlined pill

📋 Copy Tag

Add success animation

Copied!


---

4. Quick Actions

Score: 6/10

The biggest weakness.

Current:

Send
Request
Deposit
Withdraw

Problems:

Uneven sizing

First card blue

Others white

Icons inconsistent

Grid alignment poor


Looks accidental.

Better

All cards same size.

Send
Request
Deposit
Withdraw

When selected

Blue border

instead of making one entire tile blue.


---

5. Statistics Cards

Current

Total Sent

Total Received

Huge waste of space.

These could become

Money Sent
Money Received
Escrow
Pending

Or

Incoming
Outgoing
Fees
Rewards

Right now they're oversized with very little information.


---

6. Recent Activity

Score: 7/10

Problems

Filters are okay.

However:

There is no activity list.

The page ends after search.

The interface feels unfinished.


---

7. Search

Looks good.

But placeholder

Search by tag or reference...

Should support

amount

date

recipient

sender


Better

Search transactions...


---

8. Bottom Navigation

Score: 6/10

Problems

Icons are too light.

Labels are tiny.

Spacing feels cramped.

"F&F"

is unclear.

Users don't know it means

Friends & Family.

Rename it

Contacts

or

People


---

9. Typography

Needs work.

You currently have

Available Balance

$0.00

This month

0 transactions

Using almost identical font weights.

Everything competes.

Better hierarchy

Balance

64 px

Labels

14 px

Metadata

12 px

Section titles

24 px


---

10. Color Usage

Blue is nice.

But almost everything is blue.

Need secondary colors.

For example

Green

Incoming

Orange

Pending

Red

Failed

Gray

Inactive

This improves scanning speed.


---

11. Accessibility

Problems

Gray text is too faint.

Some buttons have low contrast.

Touch targets are close together.

Increase spacing.


---

12. Empty State

Current

$0

0 transactions

Feels dead.

Better

No activity yet

Receive your first payment.

[Receive Money]

Makes onboarding easier.


---

13. Information Density

There is too much whitespace.

Large cards containing almost no data.

The screen could show

Recent transactions

Pending requests

Escrow

Balance breakdown

Spending insights


without feeling crowded.


---

14. Financial Trust

Modern finance apps build confidence through transparency.

Missing elements include:

Last sync time

Security status

Verification badge

Active currency

Exchange rate (if applicable)

Escrow balance

Pending settlement



---

15. Visual Consistency

Some elements have:

Large border radius

Small radius

Circular icons

Rectangular cards


Standardize your design system.

Example:

Cards: 20 px radius

Buttons: 14 px radius

Chips: full pill

Icons: 48×48 px



---

Summary of Gaps

Area	Current	Target

Visual appeal	8.2	9.2
Information hierarchy	6	9
Financial trust	6.5	9
Accessibility	5.5	9
Empty states	4	9
Navigation	6	9
Statistics	5	9
Action buttons	6	9
Information density	6	9
Overall UX	6.8	9.3


The UI has a solid visual foundation with a clean color palette and modern card styling, but it resembles a polished template more than a mature financial product. The biggest opportunities are improving information hierarchy, making quick actions more consistent, adding meaningful financial data, strengthening trust indicators, and making better use of the available screen space. Addressing these areas would move it closer to the quality of leading fintech apps like Revolut, Wise, Cash App, or Monzo.





You're right. I focused too much on the component level and not enough on the layout system. Looking at it again as a fintech product designer, there are much bigger structural problems.

Overall score drops to 5.8/10

The UI isn't ugly. The problem is that it lacks a spacing system. Everything feels like it was placed individually rather than designed with a consistent layout grid.


---

1. There are almost no gutters

This is the first thing my eyes noticed.

The balance card almost touches the action cards.

The action cards almost touch the statistic cards.

The statistics almost touch the Recent Activity section.

Nothing has breathing room.

Example

Balance Card
──────────────
Quick Actions
──────────────
Stats
──────────────
Recent Activity

Everything feels glued together.

Instead it should breathe.

Balance Card

      24px

Quick Actions

      24px

Stats

      32px

Recent Activity

Every section needs vertical rhythm.


---

2. The quick actions grid is broken

This is probably the weakest section.

Look closely.

The blue Send card is visually heavier than everything else.

The white cards have shadows.

The blue card doesn't.

Widths don't feel equal.

The cards are touching each other.

There are almost no gutters.

It creates visual tension.

Instead

□ Send

□ Request

□ Deposit

□ Withdraw

Every card

same height

same width

16px gutters

same radius

same elevation


Only icon color changes.

Not the whole card.


---

3. Card padding is inconsistent

The balance card has generous padding.

The statistic cards have almost none.

The action cards have different internal spacing.

Recent Activity has different margins.

Nothing follows an 8-point spacing system.

For example

Balance card

24px padding

Stats

12px

Action cards

18px

Search

16px

Everything is random.


---

4. Nothing aligns vertically

Look at the left edges.

Available Balance

↓

Quick Action

↓

TOTAL SENT

↓

Recent Activity

↓

Search

They're not lining up perfectly.

Good fintech apps make every left edge fall on the same invisible column.


---

5. The statistics cards are oversized

Look at these.

TOTAL SENT

$0.00

This occupies almost 150 pixels of height.

For one number.

That is poor information density.

Instead the cards could be half the height.

Or four metrics in two rows.


---

6. The page has no visual rhythm

Everything is

Large Large Large Large Large

There are no pauses.

Good UI alternates

Large

↓

Medium

↓

Small

↓

Large

↓

Medium

This creates flow.


---

7. Too many rounded rectangles

Every component

Rounded card

Rounded button

Rounded chip

Rounded search

Rounded bottom nav

Rounded balance

Rounded icon

Nothing contrasts.

It starts looking like inflated balloons.

A design system needs hierarchy.

For example

Cards → 20px

Buttons → 12px

Search → 16px

Chips → Pill

Not everything identical.


---

8. The blue card overwhelms the page

The balance card is huge.

Then another blue card (Send).

Then another blue chip (All).

Everything competes.

The eye doesn't know where to rest.

A better hierarchy is

Blue balance

↓

Neutral actions

↓

Blue active filter

Only one dominant blue element per section.


---

9. The screen feels cramped despite lots of whitespace

This is the paradox.

There is lots of white.

Yet it feels crowded.

Why?

Because whitespace exists inside cards instead of between sections.

You have

Big empty cards

touching

other big empty cards.

Instead

Compact cards

+

larger gutters

+

more breathing room.


---

10. The bottom navigation feels detached

Notice the giant empty area above it.

It almost feels like another app.

It needs either

a subtle top divider

elevation

or a background tint


to anchor it.


---

11. Search field is floating

The search bar has huge margins around it.

Then nothing below.

It feels abandoned.

Usually search belongs immediately above the transaction list.


---

12. Recent Activity has no content preview

This is a major UX issue.

Users shouldn't have to search before seeing anything.

Even with no transactions, show an empty state.

No transactions yet

Receive your first payment to get started.

[Receive Money]


---

13. Grid inconsistency

The dashboard mixes:

1-column sections

4-column actions

2-column stats

filter chips

full-width search


without consistent spacing between them.

A 12-column grid (or an 8-point mobile grid) would make everything align.


---

14. The dashboard lacks visual anchors

Good dashboards have focal points.

For example:

Balance

Recent transactions

Spending chart


Here, after the balance card, nothing grabs attention.

The eye wanders.


---

If I were redesigning this

I'd increase the side gutters to 20–24 px, use a strict 8-point spacing system, give every card 16 px internal padding, keep 16 px gaps between cards, shrink the statistics cards to improve information density, make all quick action cards identical with only the active icon highlighted, and introduce more breathing room between major sections. I'd also ensure every component aligns to the same left and right margins so the page feels structured rather than assembled.

The current interface feels like individual widgets placed on a canvas. A polished fintech app feels like one coherent system where spacing, alignment, padding, and hierarchy work together. That's the biggest gap in this design.