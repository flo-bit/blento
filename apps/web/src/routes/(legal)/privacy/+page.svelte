<svelte:head>
	<title>Privacy Policy &middot; blento</title>
	<meta name="description" content="Privacy Policy for blento." />
</svelte:head>

<h1>Privacy Policy</h1>
<p><em>Last updated: April 18, 2026</em></p>

<h2>1. Overview</h2>
<p>
	blento is built on the AT Protocol. Your site content lives in your own Personal Data Server (PDS)
	under your atmosphere account. This policy explains what limited data blento itself handles and
	how we comply with the EU General Data Protection Regulation (GDPR), the German Federal Data
	Protection Act (BDSG), and the German Telecommunications-Digital-Services Data Protection Act
	(TDDDG, formerly TTDSG).
</p>

<h2>2. Definitions</h2>
<ul>
	<li>
		<strong>AT Protocol (atproto):</strong> the open decentralized protocol that the Service is
		built on. See
		<a href="https://atproto.com" target="_blank" rel="noopener">atproto.com</a>.
	</li>
	<li>
		<strong>Atmosphere:</strong> the open network of applications and services built on the AT Protocol.
		Bluesky is one application in the atmosphere; blento is another.
	</li>
	<li>
		<strong>Atmosphere account:</strong> your identity on the atmosphere, represented by a DID (decentralized
		identifier) and a handle. You can use the same account across any atmosphere service, including blento.
	</li>
	<li>
		<strong>Personal Data Server (PDS):</strong> the server that hosts the data for your atmosphere account.
		It stores your records (including the cards you create on blento) and is the canonical home of your
		content. You can self-host your PDS or use one operated by a provider.
	</li>
</ul>

<h2>3. Controller</h2>
<p>The controller responsible for processing under Art. 4(7) GDPR is:</p>
<p>
	Florian Killius<br />
	Email: <a href="mailto:hello@blento.app">hello@blento.app</a>
</p>
<p>
	We have not appointed a data protection officer; we are below the thresholds of &sect; 38 BDSG.
	For any data-protection inquiries, contact the address above.
</p>

<h2>4. Categories of Data and Legal Bases</h2>

<h3>4.1 Authentication (atproto OAuth)</h3>
<p>
	When you sign in, we initiate an OAuth flow with your PDS. We receive and store, in a session
	cookie and in server-side session storage, an access token, a refresh token, your DID, and your
	handle. We do not receive or store your password.
</p>
<ul>
	<li><strong>Purpose:</strong> authenticating you and keeping you signed in.</li>
	<li>
		<strong>Legal basis:</strong> Art. 6(1)(b) GDPR (performance of the service you requested).
	</li>
	<li>
		<strong>Retention:</strong> until you sign out or the refresh token expires / is revoked.
	</li>
	<li>
		<strong>Storage of auth tokens on your device:</strong> legally necessary for the service you requested
		under &sect; 25(2) Nr. 2 TDDDG; no consent required.
	</li>
</ul>

<h3>4.2 Your DID and handle</h3>
<p>Used to load and save your bento grid records from and to your PDS.</p>
<ul>
	<li><strong>Legal basis:</strong> Art. 6(1)(b) GDPR.</li>
	<li><strong>Retention:</strong> for as long as your account is active.</li>
</ul>

<h3>4.3 Cached content (Cloudflare KV)</h3>
<p>
	To speed up rendering and reduce load on third-party APIs, we cache public PDS records, profile
	data, and third-party card data in Cloudflare Workers KV. Typical cache lifetimes range from 1
	hour (e.g. Last.fm listens, events) to 24 hours (profile and PDS records), up to 30 days for
	generated Open Graph images. Cached entries expire automatically.
</p>
<ul>
	<li><strong>Purpose:</strong> performance and reduction of third-party API load.</li>
	<li>
		<strong>Legal basis:</strong> Art. 6(1)(f) GDPR (legitimate interest in operating the Service efficiently).
	</li>
	<li><strong>Retention:</strong> as stated above; expires automatically.</li>
</ul>

<h3>4.4 Server and request logs</h3>
<p>
	Cloudflare, our hosting provider, processes standard request metadata (IP address, user agent,
	timestamp, URL) for security, abuse prevention, and delivery of the Service. We do not maintain
	long-term logs ourselves; Cloudflare's default retention applies (typically a few days).
</p>
<ul>
	<li>
		<strong>Legal basis:</strong> Art. 6(1)(f) GDPR (legitimate interest in a secure and reliable service).
	</li>
</ul>

<h3>4.5 Aggregate analytics</h3>
<p>
	We collect cookieless, aggregate pageview statistics using Cloudflare Workers Analytics Engine.
	Each pageview records the visited page, a coarse country code derived from the visitor's IP
	address (the IP itself is not stored by us), and the hostname of the referring website if any.
	Individual visitors are not tracked across pages or sessions, and no persistent identifier is
	stored on your device.
</p>
<ul>
	<li><strong>Purpose:</strong> understanding aggregate site usage to guide improvements.</li>
	<li>
		<strong>Legal basis:</strong> Art. 6(1)(f) GDPR (legitimate interest in measuring usage in a privacy-preserving
		way).
	</li>
	<li>
		<strong>Retention:</strong> up to 90 days, after which Cloudflare automatically deletes the data.
	</li>
</ul>

<h3>4.6 Third-party embeds</h3>
<p>
	Cards can embed content from third parties (Bluesky, YouTube, GitHub, Last.fm, map providers,
	etc.). When a page containing such a card is loaded, the visitor's browser makes requests to those
	providers, which may process the visitor's IP address and other request metadata under their own
	privacy policies. We do not control that processing.
</p>

<h2>5. Recipients and Processors</h2>
<ul>
	<li>
		<strong>Cloudflare, Inc.</strong> (USA) — hosting, CDN, Workers runtime, KV storage. Acts as a processor
		under Art. 28 GDPR based on Cloudflare's Data Processing Addendum.
	</li>
	<li>
		<strong>Your PDS provider</strong> (the operator of your atmosphere account's data server) — receives
		your records when you save them.
	</li>
	<li>
		<strong>Third-party card providers</strong> (e.g. Bluesky, GitHub, YouTube, Last.fm, map providers)
		— when embedded, they receive visitor request data directly.
	</li>
</ul>

<h2>6. International Data Transfers</h2>
<p>Cloudflare processes data in the United States and globally. Transfers are safeguarded by:</p>
<ul>
	<li>
		Cloudflare's certification under the <strong>EU-US Data Privacy Framework</strong> (adequacy decision
		of the European Commission of 10 July 2023); and
	</li>
	<li>EU Standard Contractual Clauses (Art. 46(2)(c) GDPR) as a fallback.</li>
</ul>
<p>
	Third-party card providers process data in their own jurisdictions under their respective
	safeguards.
</p>

<h2>7. Cookies and Similar Technologies</h2>
<p>
	We use only strictly necessary cookies / local storage entries for authentication (&sect; 25(2)
	Nr. 2 TDDDG). We do not use cookies or tracking technologies for analytics, advertising, or
	profiling. No consent banner is required.
</p>

<h2>8. Your Rights</h2>
<p>Under the GDPR you have the following rights:</p>
<ul>
	<li>Right of access (Art. 15 GDPR)</li>
	<li>Right to rectification (Art. 16 GDPR)</li>
	<li>Right to erasure / "to be forgotten" (Art. 17 GDPR)</li>
	<li>Right to restriction of processing (Art. 18 GDPR)</li>
	<li>Right to data portability (Art. 20 GDPR)</li>
	<li>
		Right to object to processing based on legitimate interests (Art. 21 GDPR) &mdash; including a
		general right to object at any time, on grounds relating to your particular situation
	</li>
	<li>
		Right not to be subject to automated decision-making (Art. 22 GDPR) &mdash; we do not carry out
		any such processing
	</li>
	<li>
		Right to withdraw consent at any time, where processing is based on consent (Art. 7(3) GDPR)
		&mdash; we currently do not rely on consent for any processing
	</li>
</ul>
<p>
	To exercise any of these rights, email <a href="mailto:hello@blento.app">hello@blento.app</a>.
</p>

<h2>9. Right to Lodge a Complaint</h2>
<p>
	You have the right to lodge a complaint with a supervisory authority (Art. 77 GDPR). The competent
	authority for us is:
</p>
<p>
	Berliner Beauftragte f&uuml;r Datenschutz und Informationsfreiheit (BlnBDI)<br />
	Alt-Moabit 59&ndash;61, 10555 Berlin, Germany<br />
	<a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener"
		>www.datenschutz-berlin.de</a
	>
</p>
<p>
	You may also lodge a complaint with any other supervisory authority, in particular in the Member
	State of your habitual residence.
</p>

<h2>10. Data Deletion</h2>
<p>
	Because your site content lives in your PDS, you can delete it directly via any atproto client or
	by editing your site. Cached copies on our side expire automatically. For account deletion or
	requests covering data beyond what you can delete yourself, email
	<a href="mailto:hello@blento.app">hello@blento.app</a>.
</p>

<h2>11. Children</h2>
<p>
	The Service is not directed at children. In Germany, the consent of a holder of parental
	responsibility is required for children under the age of 16 (Art. 8 GDPR). We do not knowingly
	process personal data of children under 16.
</p>

<h2>12. What We Don't Do</h2>
<ul>
	<li>We do not sell your personal data.</li>
	<li>We do not run advertising or cross-site tracking.</li>
	<li>We do not build behavioural profiles of you.</li>
	<li>We do not carry out automated decision-making in the sense of Art. 22 GDPR.</li>
</ul>

<h2>13. Changes</h2>
<p>
	We may update this policy. Material changes will be announced on this page, and where they
	materially affect your rights we will give reasonable advance notice.
</p>

<h2>14. Contact</h2>
<p>Questions about this policy? Reach out via:</p>
<ul>
	<li>Email: <a href="mailto:hello@blento.app">hello@blento.app</a></li>
	<li>
		Bluesky:
		<a href="https://bsky.app/profile/blento.app" target="_blank" rel="noopener">@blento.app</a>
	</li>
</ul>
