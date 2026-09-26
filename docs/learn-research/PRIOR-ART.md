# RQ4: Prior art teardown for crypto key education

Status: research brief only. No repository file was changed. Written for the Learn Paths design decision.

Scope: eight explainers that teach how a seed phrase becomes a private key and then an address. For each one this brief names the **teaching device** it uses, meaning the mechanism that does the teaching, not the topic it covers. Each profile is written to stand alone.

How these were chosen: they are the sources a person actually lands on when they search for this topic, and together they cover the full range of devices in current use. Every characterisation below comes from the source's own live text and structure.

Method note: "teaching device" here means one of the following, and I name which one each source uses:
live ledger, carried worked example, analogy name swap, narrative characters, labelled figure, normative pseudocode, reference table, test vector verifier, clickable tree, byte walker, colour coded value tracking, gated progression, plain definition box, scenario ladder, wallet path table, retention construction.

---

## Device manifest (one line each)

| # | Source | The teaching device it uses |
|---|---|---|
| 1 | Ian Coleman BIP39 tool (iancoleman.io/bip39) | Live ledger: every derived value recomputes on keystroke from the reader's own input |
| 2 | Learn Me A Bitcoin (Greg Walker) | One carried worked example plus an analogy name swap |
| 3 | Mastering Bitcoin, Ch 4 (Antonopoulos) | Narrative characters plus labelled figures plus runnable code |
| 4 | BIP-39 spec (bitcoin/bips) | Normative pseudocode plus a reference table plus test vectors as verifier |
| 5 | satoshibench.com HD wallets | Clickable tree paired with a byte level step walker |
| 6 | bennet.org HD wallets | Generate then trace, with one value colour tracked across every layer |
| 7 | SafeSeed key derivation tutorial | Scenario ladder: named problem, then an ordered list of things to test |
| 8 | Trezor blog, memorising a seed | Retention construction: story, acronym, memory palace, hand practice |

---

## 1. Ian Coleman BIP39 Mnemonic Code Converter

URL: https://iancoleman.io/bip39 (also mirrored at bip39.online, x.pub, and a standalone copy shipped by Particl).

What it is: a single offline HTML file. You type a mnemonic, or generate one, or paste entropy directly. It shows the entropy as 11 bit indices per word, the BIP39 seed, the BIP32 extended keys, and a scrolling table of path, address, public key, and private key.

**Teaching device: the live ledger.** There is almost no prose. The teaching happens because one keystroke in the mnemonic field changes every other value on the screen at once. The reader learns cause and effect by watching the ledger move. A "show entropy details" checkbox is the one deliberate reveal, and even that reveals a panel of live fields rather than writing an explanation. Entropy can be supplied as raw bits as well as words, so the reader can walk the chain entropy to words to seed to keys on one screen.

What it does well: it is the strongest "the seed is the wallet" demonstration in the field, because the reader can see that a one word edit changes every key below it. It works offline and air gapped, same posture as KeySense. It refuses to hide the raw numbers.

What it misses: no explanation layer at all. The checksum is only a pass or fail colour, never a taught idea. The output table is genuinely overwhelming for a beginner. It fails the 8th grade reader completely, and because it accepts real secrets, it is also the page that gets people robbed. It teaches mechanistically correct behaviour with no understanding, which is the opposite of a learning path.

Takeaway for KeySense: KeySense already has the equivalent of this device (the 20 live value hosts). The lesson is that the ledger alone teaches cause and effect but not order or meaning. KeySense's five steps supply the order Coleman omits; the improvement is to keep each step's live reveal small and purpose built rather than one giant always visible table, and to never let the raw hex dominate the first screen.

---

## 2. Learn Me A Bitcoin, Keys and Addresses

URL: https://learnmeabitcoin.com (beginners/keys_addresses and technical/keys).

What it is: a beginner page plus a technical page by Greg Walker. The beginner page generates a private key, computes the public key from it, then turns that public key into an address, all in plain English. The technical page takes a different example key and shows hex, WIF, and the valid key range.

**Teaching device: one carried worked example, plus an analogy name swap.** The same example private key is held fixed while each transform is applied in sequence, so the reader can predict the next value before scrolling. Over the top sits a name swap: public key is "your account number", address is "also your account number, but a shorter version", private key is "your password". The reader gets a new concept by being told which familiar thing it is like.

What it does well: the carried example is the device that actually produces competence, because the reader starts guessing correctly. The analogy is the plainest on ramp in the set. The page warns loudly not to use the example key, and says why an address exists at all (it is shorter and has a checksum).

What it misses: no interactivity, no entropy or checksum teaching, and the numbers are monospace blocks with no real diagram. Critically, the beginner page and the technical page use different example keys, so a reader cannot carry one key from the simple layer to the deep layer. There is no retrieval practice anywhere.

Takeaway for KeySense: KeySense already uses the standard abandon, about test vector as its fallback. Prior art says to make the carried value explicit, one named wallet (call it Alice's) held constant across all five steps, and to add a "predict the next value" prompt at each step so the reader acts before the reveal. Also copy the loud demo key warning as a visible badge, not a footnote, since KeySense's page computes live values.

---

## 3. Mastering Bitcoin, Chapter 4, Keys and Addresses

URL: https://github.com/bitcoinbook/bitcoinbook/blob/master/ch04_keys.adoc (also on O'Reilly).

What it is: the canonical book chapter. It opens with Alice paying Bob, covers private keys, elliptic curve multiplication, base58check, compressed keys, bech32, and then an HD wallet section, and ends with working Python.

**Teaching device: narrative characters plus labelled figures plus runnable code.** The chapter keeps Alice and Bob as characters so the reader has a reason to care before any maths appears. Each transform has a numbered figure with a caption (the pattern is "Figure 4-1. Transaction chain from original Bitcoin paper"), and each block of theory is followed by Python the reader can run to reproduce the same example key. Three devices stacked: story, picture, proof.

What it does well: the deepest and most durable mental model in the set. The figure plus code pairing lets a reader switch between a picture of the operation and a checkable reproduction of it. The worked key (starting 1E99423A) is carried from private key to public key to address across the chapter.

What it misses: it is a book chapter. Long, not interactive, assumes comfort with programming, and its figures are static images rather than anything explorable. The reader never gets to change an input and see the effect. No retrieval practice.

Takeaway for KeySense: this is the source that proves real diagrams carry the depth that ASCII cannot. KeySense currently has zero real diagrams, only monospace ASCII. The device to borrow is small and local: one labelled figure per step, showing only that step's inputs and outputs, with the working value (the test vector, or the reader's own seed) written inside the figure so the diagram and the live box agree. Keep the figure static and simple; do not try to make it an app.

---

## 4. BIP-39 specification (and BIP-32)

URL: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki.

What it is: the standards document. It states the algorithm, gives the entropy, checksum, and word-count relationship, and links published test vectors. It also carries its own "shortcomings" section.

**Teaching device: normative pseudocode plus a reference table plus test vectors as verifier.** The algorithm is given as ordered prose steps (generate entropy, append the first ENT/32 bits of the SHA256 hash, split into 11 bit groups, map to words). A table fixes the relationship between entropy bits, checksum bits, total bits, and words for all five phrase lengths. The test vectors (input entropy, expected mnemonic, expected seed, passphrase TREZOR) are the ground truth any other page's claims can be checked against.

What it does well: the test vectors are the verification device that KeySense's own self verification card already mirrors, so prior art validates that design choice. The table makes an abstract relationship concrete and small. The shortcomings section is honest in a way almost no marketing page is: it states the checksum is short, that roughly one in 256 random errors will be missed, and that it cannot locate the error.

What it misses: it is written for implementers. No narrative, no pictures, no "what a person actually sees" example, and heavy jargon used before it is defined. Nearly useless to an 8th grade reader on its own.

Takeaway for KeySense: the self verification card is right and has prior art support. The gap this source exposes is honesty about limits. KeySense's checksum demo would be stronger with one plain sentence from the spec's own shortcomings: a checksum can catch a typo but it cannot tell you which word is wrong, and about one error in 256 will slip through. That is depth delivered in a single readable line, which fits the operator's "depth available, simple on the surface" goal.

---

## 5. satoshibench, HD wallets (BIP32 derivation)

URL: https://satoshibench.com/learn/hd-wallet.

What it is: a single long page on BIP32. It generates a demo seed in the browser, then shows seven rows, one per path level, and separately draws a tree you can click.

**Teaching device: a clickable tree paired with a byte level step walker.** The tree shows the BIP84 path and each node's purpose when clicked. The walker shows, for the chosen level, the actual HMAC-SHA512 input bytes, the 64 byte output split into IL (the key offset) and IR (the child chain code), and the modular addition mod n that produces the child private key. Hardened rows use the parent's serialised private key as input; normal rows use the public key.

What it does well: this is the closest prior art to KeySense's bit explorer and its Step 4 hardened-versus-normal comparison. It pairs "click a node to see what it is" with "see the exact bytes for that node", which is precisely the depth-on-demand shape the operator wants. It also states the security reason for hardening in one sentence a beginner can hold: leaking one normal child private key compromises the whole subtree above it.

What it misses: the byte rows are hostile to a beginner and there is no gentler layer between the tree and the bytes. The tree and the walker are not wired together; clicking a tree node does not take you to its byte row. No entropy or checksum teaching. The page assumes the reader already knows what HMAC-SHA512 is.

Takeaway for KeySense: adopt the tree-plus-detail pairing for Step 3 (path) and Step 4 (hardened versus normal), and fix the one flaw: link the two halves so a click in the bit explorer highlights the matching step panel, and vice versa. Keep the byte detail behind a reveal so the surface stays simple for a beginner while the depth stays one click away.

---

## 6. bennet.org, Hierarchical determinism, how Bitcoin's HD wallets are born

URL: https://bennet.org/learn/hierarchical-determinism-how-bitcoin-hd-wallets-are-born.

What it is: a prose explainer with embedded interactive widgets. You press Generate, and the page then shows the same value at every layer, with a derivation path explorer and an address explorer.

**Teaching device: generate then trace, with one value colour tracked across every layer.** The same secret is shown colour coded at each representation (entropy, mnemonic, seed, master extended private key, and each path segment), so the reader sees one value changing costume. A second device rides along: gated progression. The address explorer will not work until you generate a seed, and says so ("Generate a seed further up the page to derive addresses"), which gives the reader a reason to act before reading on. A third, smaller device is the plain definition box, used inline for jargon ("What is HMAC?", "Why not use the seed directly?").

What it does well: colour coding is an effective way to teach "same secret, different form", and the gating produces a do-then-learn rhythm. The inline definition boxes are the single most transferable device here: they define a term at the moment it is first needed, in two sentences, and move on. It also names JBOK wallets ("Just a Bunch of Keys") as the before picture, which gives the reader a story of why HD wallets exist.

What it misses: colour coding has no legend and no second channel, so it fails for colour blind readers and does not survive a black and white print. The middle of the page is dense. No quizzes or retrieval, and the ask is "explore", not "answer".

Takeaway for KeySense: adopt value tracking across the five steps (show the same seed changing costume) and the gating idea (unlock the next widget only after the reader acts). Add a non-colour channel, such as labels, arrows, or a repeated shape, so it works without colour, and copy the inline definition box pattern for every term at first use. That directly serves the 8th grade and ESL reader.

---

## 7. SafeSeed, Key Derivation Tool tutorial (and its HD wallets guide)

URL: https://safeseed.app/docs/tools/key-derivation-tutorial.

What it is: documentation for a browser tool, written as a tutorial. It covers the path notation, the hardened versus normal split, wallet by wallet path defaults, and offline usage.

**Teaching device: the scenario ladder.** Each concept is immediately followed by a named real world problem and an ordered list of things to test. The clearest one: "you recovered your seed phrase but your balance shows zero", followed by try m/84'/0'/0'/0/0, check the address on an explorer, then try 44, then 49, then 86, then account 1, then the change chain. Other rungs cover watch only wallets and one seed across two chains. A supporting device is the wallet path table, which lists what Ledger, Trezor, Electrum, MetaMask, and others default to.

What it does well: this is the most practical device in the set. It converts knowledge into a procedure the reader can actually run, which is exactly the "more practical" goal. It also teaches the single most useful real fact in this whole subject: the same words open an empty wallet if the path is wrong. The wallet path table is a reference the reader will keep.

What it misses: the teaching is buried inside vendor tool documentation, the prose is dense and promotional in places, and the scenarios all assume you trust the tool enough to type a real seed into it. There is no diagram, and the derivation maths appears only as notation.

Takeaway for KeySense: KeySense's attempt-it task buttons are the seed of this device and are badly underused. Expand each of the five steps with one short "something looks wrong, here is the order to check things" card, because that is what a reader needs after they close the page. A small wallet path table (which default each major wallet uses) is high value and low cost, and it is the kind of depth that can sit behind a reveal.

---

## 8. Trezor blog, How to Memorize a Seed Phrase, Building Narratives from Nonsense

URL: https://blog.trezor.io (How to Memorize a Seed Phrase).

What it is: an article that teaches a method for remembering a seed phrase, using a worked twenty four word example.

**Teaching device: retention construction.** It does not explain the cryptography at all. It teaches the reader to chunk the phrase, then build a story, an acronym, or a memory palace (imagined rooms with images placed in them), then create a prompt between chunks, and to practise by writing on paper in private rather than typing. The learning objective is durability of recall, not understanding.

What it does well: it is the only source in the set aimed purely at making knowledge stick, which is the end of learning the other seven ignore. It works on the reader's own data, it is written in short plain sentences, and it is honest that memory alone is not a backup.

What it misses: it teaches recall of a secret, not comprehension of a system. It says nothing about what a seed is, how keys derive, or why any of it works. It also carries a real risk, since people who over trust memory lose funds, and it only flags that risk at the edges.

Takeaway for KeySense: KeySense teaches understanding, not memorisation, so borrow this selectively. The transferable move is a "make it stick" close on each step: one short repeatable practice activity, which KeySense's click to reveal retrieval quizzes already half do. Sharpen them so they ask the reader to produce an answer, not recognise one, and add one explicit line that the page teaches a public standard and is never a place to trust a real secret to memory.

---

## Synthesis: the device inventory and what KeySense is missing

Devices present across the eight sources, grouped:

- Prove it by doing: live ledger (Coleman), clickable tree (satoshibench), byte walker (satoshibench), generate then trace (bennet.org), gated progression (bennet.org).
- Prove it by example: carried worked example (Learn Me A Bitcoin, Mastering Bitcoin), narrative characters (Mastering Bitcoin), labelled figures (Mastering Bitcoin).
- Prove it by reference: normative pseudocode (BIP-39), reference table (BIP-39), test vector verifier (BIP-39), wallet path table (SafeSeed).
- Make it plain: analogy name swap (Learn Me A Bitcoin), plain definition box (bennet.org).
- Make it usable: scenario ladder (SafeSeed).
- Make it last: retention construction (Trezor).

What KeySense already has, mapped to devices: live values from the reader's own seed (the Coleman device), a bit explorer (the satoshibench tree, minus the tree), a checksum demo, attempt-it buttons (a weak scenario ladder), retrieval quizzes, and a browser side self verification card (the BIP-39 test vector device). That is a strong starting set.

Gaps, ranked by value for this design decision:

1. No real diagrams. Prior art pairs every deep idea with a small labelled figure. KeySense has ASCII only. This is the clearest single gap and it is also the cheapest to close, because the figures can be small and local to each step.
2. No single carried instance tracked across all steps. Coleman recomputes, bennet.org tracks one value changing costume, Learn Me A Bitcoin carries one key. KeySense does not make the reader watch one seed transform step by step with a named persona.
3. No predict-before-reveal prompt. Four sources let the reader act. KeySense reveals via click but does not ask the reader to commit to an answer first.
4. No plain definition box at first use. bennet.org defines jargon in two sentences at the moment it appears. KeySense's glossary is a separate block, so a reader meets the term before its definition.
5. No stated limits per claim. The BIP-39 spec names the checksum's own weaknesses; no explainer in the set hides them. KeySense's checksum demo could be more honest and therefore more trustworthy.
6. Depth is not gated. The live table and the raw detail are always visible, which fights the "simpler on the surface" goal. satoshibench and bennet.org both hide depth behind a reveal and a gate.
7. Colour is the only channel for value tracking in the one source that uses it. Any KeySense value tracking must carry a non-colour channel to survive for ESL, colour blind, and printed readers.

Two structural observations for the operator:

- Surface simplicity and available depth are not in conflict. Every source reviewed delivers its depth behind a reveal, a gate, or a drill-down. That means the surface word count can fall while the depth stays available, which is the shape the operator asked for.
- The most practical device in the set, the scenario ladder, is the one KeySense uses least. If the goal is "more practical", the highest return is expanding the attempt-it buttons into per step diagnosis cards, not adding more prose.

Caveat: this brief profiles public pages as they stand today. The device labels are my reading of each page's own structure and text, not the authors' own terms.
