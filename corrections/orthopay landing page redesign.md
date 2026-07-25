I think you've identified the biggest issue yourself:

> The landing page and the dashboard feel like two different products.



That's a much bigger problem than typography or spacing.

When I land on the homepage, I expect the dashboard to feel like a continuation of the same brand. Instead:

Landing page → futuristic, cinematic, gaming, neon, playful

Dashboard → clean fintech SaaS, flat UI, conservative blue


Those two visual languages clash.


---

Overall Scores

Area	Score

Hero Section	7.8/10
What We Do Section	6.7/10
Brand Consistency	4.5/10
Readability	5.5/10
Motion Performance	3/10
Visual Hierarchy	6.5/10
Overall Landing Page	6.4/10


The artwork is actually carrying the page. The UI itself is what's holding it back.


---

Hero Section Review

Positives

The animated background is memorable.

It creates emotional appeal.

The astronaut theme is unique.

The CTA is visible.

The headline is large.

Users will remember it.


---

Biggest Problems

1. Typography collision

The green

> ORTHO paytags



is sitting on top of

SEND MONEY SAFELY

Instead of complementing it, it looks pasted on afterwards.

The eye doesn't know which to read first.


---

2. Readability

The paragraph disappears into the animation.

The moving objects behind it destroy contrast.

This is probably the largest usability problem.

Users shouldn't have to work to read.


---

3. CTA hierarchy

These buttons

GET STARTED

SEE HOW IT WORKS

don't feel connected.

One is neon green.

One is transparent.

Neither relates to the dashboard style.


---

4. Text alignment

Everything hugs the left edge.

Meanwhile the right side is mostly empty.

The composition feels visually heavy.


---

Hero Upgrade

Without touching the background video:

Add a dark gradient overlay

Instead of

Video

Use

Video

↓

20–35% navy overlay

↓

Content

Not black.

Dark navy.

The background remains visible.

Readability increases dramatically.


---

Reduce headline width

Instead of

SEND MONEY SAFELY
WITH ESCROW
PROTECTION

Try

Send Money

Safely with

Escrow Protection

Or

Secure Escrow
Payments

for Buyers
&
Sellers

Much easier to scan.


---

Typography

Use only two fonts.

Current page feels like

Bold condensed


Brush script


Monospace paragraph

Three personalities.

Choose one voice.

Example

Heading

Bold geometric

Body

Inter

Accent

Small green tag only.


---

Paragraph

Instead of white text

Use

90% white

Maximum width

500px

Line height

1.7


---

CTA

Primary

Green

Secondary

White outline

Same height.

Same radius.


---

Third Section Review

The artwork is fantastic.

But the content almost disappears.


---

Biggest issue

The astronaut lineup is the visual focus.

The actual message

"What We Do"

is secondary.

Users remember astronauts.

Not escrow.


---

Text placement

Current

Heading left

Paragraph centre

Features bottom

Everything competes.

Instead

Headline

Paragraph

Three features

↓

Background

One column.

Clear hierarchy.


---

Feature Cards

Currently

Buyer Protection

Seller Confidence

USA and England

are floating directly on the image.

Instead

Use translucent glass panels.

Example

□ Buyer Protection

Funds remain in escrow
until approval.

-------------------

□ Seller Confidence

Payments are irreversible
after approval.

-------------------

□ Available in

USA

United Kingdom

Still lets the animation show through.


---

Biggest Technical Problem

This worries me more than anything.

You said:

> Motion backgrounds don't begin until about 10 seconds after page load.



That's unacceptable.

Most visitors decide whether to stay in under 3 seconds.

If the hero animation only starts after 10 seconds, most people will never even see the feature you invested in.


---

What your dev agent should investigate

1. Network waterfall

Determine exactly when the video request starts.

Questions:

Is the request delayed?

Is it lazy-loaded?

Is JavaScript blocking it?



---

2. Video format

Is it

MP4

WebM

GIF

Lottie

Canvas

Three.js

Determine which.


---

3. Video size

Measure

download size

bitrate

resolution


If it's 25–60 MB, that's likely the issue.


---

4. Browser autoplay

Verify whether the video is:

muted

autoplay

playsinline

preload="auto"


Missing any of these can delay playback, especially on mobile.


---

5. JavaScript bottlenecks

Check whether heavy scripts block rendering before the video initializes.


---

6. Loading strategy

The hero animation should have the highest loading priority because it's above the fold.


---

Biggest Brand Issue

The dashboard looks like this:

Stripe

Wise

PayPal

Clean.

Minimal.

Professional.

The landing page looks like this:

Netflix

Pixar

Space game

Cyberpunk

Those aren't inherently bad styles, but they don't naturally connect.

If you want to keep the cinematic landing page, the dashboard should borrow subtle cues from it—perhaps deeper navy tones, soft glow accents, or rounded illustrations—without sacrificing the clean fintech usability. Likewise, the landing page should simplify its typography and overlays so it feels more like the front door to the same product rather than a different application.


---

Final Verdict

I actually like the creative direction. Most fintech landing pages are forgettable. Yours has personality and is memorable.

However, the execution needs refinement. The animation should support the message, not compete with it. The typography should be simplified, contrast improved, and the dashboard and landing page should share a unified design system—consistent colors, typography, spacing, button styles, and component language.

If those changes are made while preserving the animated backgrounds, I think the landing page could realistically move from 6.4/10 to around 9.2/10, and the dashboard from 5.8/10 to 9+/10, giving ORTHO-PAY a much stronger, more cohesive identity.