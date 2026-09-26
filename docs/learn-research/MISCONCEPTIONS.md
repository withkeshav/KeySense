# Misconception inventory: seed phrases and wallet keys (RQ2)

Status: research brief. Nothing here is built. No repo file was changed.
Date: 2026-09-26. Repo: /mnt/ai-archive/other-tools/keysense.
Feeds: `LEARNING-RESEARCH-PLAN.md` RQ2 and deliverable D3.
Audience for the lesson this brief serves: a reader with no crypto background, reading in
English, target US grade 8.

Purpose: name the wrong beliefs the lesson must kill, put them in order of how often real
people actually hold them, and say where each one should be killed.

---

## 0. How to read this brief

There is only one source found that ranks seed phrase misconceptions against each other with
numbers: the Carnegie Mellon CHI 2025 study (Eleshin, Sun, Ye, Das, Hong), 643 survey
respondents plus 20 interviews. Its Table 7 and Table 8 are the only head to head measurement
of what users think a seed phrase is for. Everything below that is recurrence evidence, meaning
how many independent places the same wrong belief shows up.

Confidence labels used in this brief:

- **MEASURED**: a number from a named study, with the sample stated.
- **STRONG**: three or more independent signals agree, for example several vendor support
  articles written to correct it plus repeated community threads.
- **MODERATE**: two independent signals.
- **WEAK**: one signal, or the source is a single low-traffic post.
- **UNCONFIRMED**: not verified against a source I could name and read. Do not put it in the
  lesson as fact.

Two things this brief does not do. It does not rank by how bad a misconception is, only by how
common it is. It does not claim any of these numbers describe the whole world, because none of
the sources is a census.

---

## 1. The ranking

Ordered by how often real people hold the belief. Rank 1 is the strongest measured evidence of
being widespread and is also absent from the current Learn tab.

| # | The belief, in the user's own words | How often | Best evidence | Killed today? | Best step to kill it |
|---|---|---|---|---|---|
| 1 | "It is like a password. I picked it, and if I lose it I can get it reset." | MEASURED, very high | CHI 2025: 58% said they can choose any seed phrase like a password; 52% said a username and password move a wallet, against 47% who said the recovery phrase; Table 7, only 13% picked the phrase as the thing that holds the wallet | No | Step 1, new and load bearing |
| 2 | "My coins are in the app or the device. The words are just a backup of the app." | MEASURED, high | CHI 2025: 75% of non-custodial users' written answers never mentioned securing the phrase or private key; 59% of 99 non-custodial users did not name the phrase as what moves a wallet | Partly | Step 1 |
| 3 | "The wallet came back empty, so my phrase is wrong, or I have been robbed." | STRONG | MetaMask, Ledger and Trezor each keep a dedicated article for exactly this; Trezor has a separate passphrase problems article; MetaMask calls its list "the most common reasons" | Partly, one FAQ line | Step 3, plus a boundary card |
| 4 | "The order of the words does not matter. All the words just need to be there." | STRONG | MetaMask: "One frequent problem is poor handwriting when writing down the SRP; another is writing the words in the wrong order"; Ledger lists wrong order as a cause; Trezor keeps a page of commonly misspelled backup words; Bitcoin StackExchange "only 11 out of 12 words" (score 7, 22,194 views) | No | Step 1 |
| 5 | "Someone could guess my words. Two wallets somewhere could make the same phrase." | STRONG | Trezor answers it as a standing question; Bitcoin StackExchange and Reddit threads recur; CHI 2025 notes the public word list is a reason people think this | Partly | Step 1, plus the bit explorer already shipped |
| 6 | "12 words is not safe. 24 words is twice as strong." | MEASURED assumptions, moderate harm | Trezor: "All backup formats are extremely secure... longer than the age of the universe"; Bitcoin StackExchange 38512 (score 17, 30,351 views) and 71878 (score 10, 17,747 views) | Yes, one FAQ line | Step 1, keep |
| 7 | "The company, or support, can reset or recover my words for me." | STRONG | Bitcoin StackExchange 64446 (score 14, 141,750 views); Ledger, MetaMask and Coinbase each keep a never share page; Trezor: nobody can look up or reset a passphrase | Partly | Boundary card |
| 8 | "If the words leak, the money is gone in seconds and I can do nothing." | MODERATE | Community threads recur; the passphrase as a separate defence is the counter, and Trezor states a stolen phrase alone no longer moves funds when a passphrase is set | Yes, the passphrase section covers the branch, not the timing | Step 2 |
| 9 | "A photo, a phone note, or my cloud drive is a fine place to keep it. Paper gets lost." | MEASURED behaviour | CHI 2025 Table 5: cloud 31.5%, email 25.1%, internal drive 22.6%; interview quotes show screenshots in Google Drive and notes apps; Oobit: only 25% keep paper | No | Step 1 |
| 10 | "Only the same brand of wallet can restore my phrase." | MODERATE | Trezor: "BIP39 backups are widely supported by most crypto wallets, making it easy to restore your wallet even without a Trezor device"; Bitcoin StackExchange Electrum compatibility question (score 12) | No | Step 3 |
| 11 | "The passphrase is a stronger password I add to make a weak seed safe." | MEASURED and common | Ledger and the Ledger community both correct the name "25th word"; the current page already answers the weakening idea | Yes | Step 2, keep |
| 12 | "The last word is just a word. A phrase with one wrong word should still work." | MODERATE | Bitcoin StackExchange 88689 and 69957 (score 10, 9,455 views) | Yes, checksum demo | Step 1, keep and shorten |
| 13 | "The app will ask me for my words sometimes, or I can go and look them up in it." | MODERATE, and this is the one that leads to typing them into a site | Ethereum StackExchange 52658 (score 16, 56,065 views, "Where does metamask store the wallet seed"); Bitcoin StackExchange 50755 | Partly, the phishing cards cover the typing | Step 1 |

Two pairs in that table overlap. They should be taught as one thing rather than separately:
rank 1 with rank 7, because both come from the password mental model, and rank 2 with rank 3,
because "the coins are in the app" is what makes an empty restore look like theft.

---

## 2. The items in detail

### Rank 1. "It is like a password. I picked it, and if I lose it I can get it reset."

**What is actually true.** The words are generated at random, not chosen. They are not stored by
anyone. There is no reset path, because there is no account to reset, only a number that the
words encode. Change one word and you have a different, valid-looking wallet, not an error.

**Evidence.** The strongest single number found anywhere in this research is the CHI 2025 result
that 58% of participants "reported that they could choose any seed phrase, just as they would
choose a password for other apps". The same study reports 52% of participants picked "Username
and Password" as sufficient to move a wallet to a new device, against 47% who correctly picked
the recovery phrase. Its Table 7 asks what a phrase is for, and the phrase loses to the password
frame:

| What users picked as the point of a phrase | Share (N=279) |
|---|---|
| Username and password | 56% |
| Wallet password | 35% |
| Two factor codes | 31% |
| Private key | 28% |
| Email address for the wallet | 22% |
| Recovery seed phrase (the correct answer) | 13% |
| Backup files from the app | 7% |

The same paper quotes an interview participant directly: "There's no forget password choice
where yeah we reset all the password options in there. So that's pretty scary." (P16)

**Why people hold it.** Every other login they own works this way. Reset, forgot my password,
contact support, is the universal shape of authentication, and seed phrases are the one system
that breaks the pattern. The lesson has to say so out loud rather than assume the difference is
obvious.

**Vendor support agrees this is the mental model to break.** MetaMask states plainly: "You cannot
edit or change your Secret Recovery Phrase." Ledger writes a whole page around the phrase being
generated, not chosen. Trezor writes that a passphrase "is not stored on your Trezor or in
Trezor Suite, so nobody can look it up or reset it, including Trezor Support."

**Killed today?** No. The Learn panel prose has zero occurrences of the words password, reset, or
choose in this sense. This is the biggest gap in the current page.

**Where to kill it.** Step 1, in the first four sentences, by showing the difference directly:
the reader does not type words to make a seed, the page's own generator makes the entropy, and
mistyping one word does not produce an error message, it produces a different wallet. The
checksum demo already proves the second half. The first half has no demo yet.

---

### Rank 2. "My coins are in the app or the device. The words are just a backup of the app."

**What is actually true.** The coins are entries on a public chain. The wallet software is a
window and a key holder. Any wallet that speaks the same word list will show the same coins, so
the device and the app are replaceable and the words are not.

**Evidence.** CHI 2025: "Among non-custodial wallet users, 75% of responses made no mention of
securing Recovery Seed Phrases or Private Keys" when asked how they secure their wallets, and
"among the 99 non-custodial wallet users, 59% did not identify Recovery Seed Phrases or Private
Key as necessary" for moving to a new device. Those are the users who chose the harder path and
still did not connect the words to the money.

Community titles corroborate the same mental model, for example r/CryptoCurrency "A wallet
doesn't hold any coins", and r/BitcoinBeginners "If the seed is the Wallet why do I need a
trezor". Both threads were confirmed to exist; their upvote counts are UNCONFIRMED (see
section 5).

**Why it matters for this tool.** KeySense shows one seed producing addresses on nine chains,
which is exactly the lesson that kills this belief, and the page does not yet say the belief out
loud. A reader can watch nine addresses appear and still think the app is what holds the coins.

**Killed today?** Partly. The panel says "one seed holds many independent wallets", which is
close but is about chain separation, not about where the coins live.

**Where to kill it.** Step 1, second half. Name the wrong belief first, then derive on the page.

---

### Rank 3. "The wallet came back empty, so my phrase is wrong, or I have been robbed."

**What is actually true.** A restore that shows zero usually means the wallet software is looking
at a different part of the tree. It may be looking at a branch a passphrase selected. It may be
looking only at accounts it created itself, so an address you added by pasting a key does not
come back. The funds are usually untouched.

**Evidence.** This is the single most heavily documented support problem found. MetaMask keeps a
dedicated page whose list of causes is introduced with the words "the most common reasons are",
and it separates two classes: the wrong phrase entirely, and the phrase being fine while
imported accounts do not come back. It states that accounts imported by private key or by
another phrase "will not sync automatically and must be manually re-added", and that the
automatic restore only adds accounts with a non-zero balance and accounts it created itself.

Ledger keeps a page titled "Recovery phrase is invalid" and lists wrong length, wrong word order,
and a word that is not on the BIP39 list. Trezor keeps a passphrase problems page and its
passphrase article states the outcome plainly: "This doesn't mean your funds are lost. It just
means the passphrase doesn't match the one used originally."

Bitcoin StackExchange has the older form of the same belief: 5690, "Wallet balance zero after
restoring wallet.dat" (score 8).

**Killed today?** Partly. One FAQ line says it is usually a different derivation path and points
at the Path recovery tool. That is correct and it is thin. It does not cover the passphrase
branch, and it does not cover imported accounts.

**Where to kill it.** Step 3, where the path is built, plus a short boundary card. The page
already has the machine to prove it, since the path builder and path recovery both exist.

---

### Rank 4. "The order of the words does not matter. All the words just need to be there."

**What is actually true.** Order carries the information. Twenty four words shuffled are a
different, usually invalid, wallet. Spelling matters for the same reason.

**Evidence.** MetaMask, in its own description of a frequent problem: "One frequent problem is
poor handwriting when writing down the SRP; another is writing the words in the wrong order. The
words must be in the order in which they were originally presented." Ledger lists wrong order and
wrong length ahead of other causes on its invalid phrase page. Trezor maintains a whole page
titled "Commonly misspelled wallet backup words" for people whose device does not recognize one
word.

Community recurrence: Bitcoin StackExchange 78987, "Lost my Bitcoin wallet and have only 11 out
of 12 mnemonic seed phrase words" (score 7, 22,194 views), and 98416, "Am I safe if 16 words in
my 24 word seed are leaked?" (score 6). The second one is the same belief inverted: people
believe partial knowledge is partial access, when a missing word can be narrow and a correct
subset can still be worthless.

**Killed today?** No. The current panel never says order matters. It teaches that the last word
carries the checksum, which is a related and harder idea, without first teaching the simpler one.

**Where to kill it.** Step 1. This is the cheapest fix in the whole list, because the bit
explorer and the checksum demo already show order and position mattering.

---

### Rank 5. "Someone could guess my words. Two wallets somewhere could make the same phrase."

**What is actually true.** 128 bits is not guessable. A collision between two generated phrases
has never been observed and is not a practical concern.

**Evidence.** Trezor answers the 12 versus 24 question with "All backup formats are extremely
secure. In real-world terms, guessing a wallet backup of any length would take longer than the
age of the universe." The question recurs across sites: Bitcoin StackExchange 106157, "What
prevents hackers from guessing seed phrases?" (3,193 views), and 38512, "Is 12-word seed phrase
safe enough?" (score 17, 30,351 views); r/BitcoinBeginners "What keeps a computer from trying
out all seed phrases", and a r/CryptoCurrency thread offering money to anyone who can reorder a
24 word phrase.

**Why people hold it.** The word list is public and short, 2048 words. That fact is visible and
the reason it is still safe is not visible.

**Killed today?** Partly. The FAQ answers the collision question in one line, and the page has an
attacker speed slider in the passphrase section that shows the search time. The bit explorer also
shows the space directly.

**Where to kill it.** Step 1. Make the reader do the arithmetic the page already supports instead
of reading a claim.

---

### Rank 6. "12 words is not safe. 24 words is twice as strong."

**What is actually true.** Both are far beyond guessing. Doubling the words does not double the
safety, because the signing curve is the ceiling. 128 bits already matches the curve.

**Evidence.** Trezor answers it as a standing FAQ and lists 12 word as 128 bit and 24 word as
256 bit while calling both secure. Bitcoin StackExchange 38512 and 71878 both ask the question
directly. The KeySense project's own audit reaches the same conclusion: "24 words is not twice
as secure. 12 words is 128 bits, which matches secp256k1's real security."

**Killed today?** Yes, one FAQ line. It is correct. It is worth keeping rather than expanding,
because the harm from this belief is small: a person who picks 24 words is not less safe.

**Where to kill it.** Step 1, keep the existing line.

---

### Rank 7. "The company, or support, can reset or recover my words for me."

**What is actually true.** There is no server that holds a copy and no account to authenticate.
Nobody, including the wallet maker, can reset the words. Anyone who offers to is describing a
theft.

**Evidence.** Bitcoin StackExchange 64446, "Wallet gone and lost recovery phrase, how to get
back my bitcoins?" has 141,750 views at score 14, and the answer set is people explaining that
there is no help line. Ledger, MetaMask and Coinbase each keep a dedicated never share page,
which is itself evidence of how often people try. Trezor: "There is no recovery. A passphrase is
not stored on your Trezor or in Trezor Suite, so nobody can look it up or reset it, including
Trezor Support."

**Killed today?** Partly. The scenario cards already cover strangers and fake support asking for
the words. They do not cover the smaller belief underneath, that a real support desk could reset
a wallet if only you found the right person.

**Where to kill it.** A boundary card, near the phishing scenarios, framed as one sentence: the
reason nobody can help you is the same reason nobody can rob you through the reset door.

---

### Rank 8. "If the words leak, the money is gone in seconds and I can do nothing."

**What is actually true.** A leaked phrase is a full compromise, and there is no lock. But a
passphrase moves the funds to a separate branch, so a phrase that leaks without its passphrase
loses nothing. That is the one defence, and it needs to be set before the leak, not after.

**Evidence.** Trezor states that with a passphrase "a stolen seed alone no longer moves your
funds", and its passphrase article says the same. Community threads asking what to do after a
leak recur.

**Killed today?** Yes, the passphrase section covers the branch idea well, including that the
passphrase does not repair weak entropy. What it does not do is connect the branch idea to the
moment of a leak.

**Where to kill it.** Step 2, where the passphrase is introduced. One sentence linking branch to
leak.

---

### Rank 9. "A photo, a phone note, or my cloud drive is a fine place to keep it. Paper gets lost."

This one is a behaviour more than a belief, but it is the behaviour that follows from a belief:

**The belief.** "The risk I actually face is losing the paper, not being robbed by someone I
cannot see."

**Evidence.** CHI 2025 Table 5, backup methods reported by 279 respondents: paper 38.4%, cloud
31.5%, external drive 31.2%, email 25.1%, internal drive 22.6%, memorizing 14.3%, no backup 7.2%.
The interview quotes are concrete and worth reading before writing this section: one participant
says they stored a screenshot in Google Drive against wallet warnings, because "If I put it
somewhere else, I probably forgot it", and another chose cloud over paper because "I will
misplace it a few years from there". Oobit's survey reports only 25% of holders kept a paper copy
and 23% kept one in a secure physical place, with 6% using metal.

**Why the belief is not stupid.** The paper's own finding is that ease of access beats security
even for experienced users, and the reason given is fear of their own forgetfulness. A lesson
that just says "cloud is wrong" will be ignored by exactly the reader who most needs it.

**Killed today?** No. The panel never mentions storage at all.

**Where to kill it.** Step 1, and it needs a trade-off sentence, not a rule.

---

### Rank 10. "Only the same brand of wallet can restore my phrase."

**What is actually true.** The word list is a shared standard. Any wallet that implements it can
read the same phrase.

**Evidence.** Trezor: "BIP39 backups are widely supported by most crypto wallets, making it easy
to restore your wallet even without a Trezor device." Bitcoin StackExchange 54367, "Is the
Electrum seed compatible with other wallets?" (score 12, 7,799 views) is the exception that
proves the rule, since Electrum's own scheme is the well known case where it does not hold.

**Killed today?** No.

**Where to kill it.** Step 3, next to the path idea, because "same phrase, different software,
different view" and "same phrase, different path, different address" are the same lesson.

---

### Rank 11. "The passphrase is a stronger password I add to make a weak seed safe."

**What is actually true.** A passphrase selects a separate branch. It cannot add entropy that the
seed did not have. A weak seed with a strong passphrase is still sweepable.

**Evidence.** The current page already states this correctly, including that an attacker who
sweeps the seed can sweep the passphrase branches. Ledger and its community both correct the name
"25th word", which is the naming that produces the misconception.

**Killed today?** Yes, and well. Keep it.

**Where to kill it.** Step 2.

---

### Rank 12. "The last word is just a word."

**What is actually true.** Part of the last word is a checksum computed from every other word. It
is the reason a typo is caught, and the reason a single wrong word can also silently pass.

**Evidence.** Bitcoin StackExchange 88689 and 69957 both ask about the checksum. The current page
teaches this with a live demo and a specific number: 1 in 16 for 12 words, 1 in 256 for 24 words.
That number is the kind of detail that makes the belief hard to keep.

**Killed today?** Yes.

**Where to kill it.** Step 1.

---

### Rank 13. "The app will ask me for my words sometimes, or I can go and look them up."

**What is actually true.** A wallet asks for the words on restore only. The words are not
something the app displays on demand, and no normal action asks for them.

**Evidence.** Ethereum StackExchange 52658, "Where does metamask store the wallet seed? (file
path)", has 56,065 views at score 16. Bitcoin StackExchange 50755 asks where to view the seed in
Bitcoin Core.

**Why this one matters more than its rank suggests.** A person who believes the app holds the
words is the person who will type them into a site that offers to find theirs. This is the belief
that the phishing scenario cards are trying to stop, and the current panel teaches phishing
without first teaching the model that makes phishing plausible.

**Killed today?** Partly. The scenario cards cover the typing.

**Where to kill it.** Step 1, linked forward to the scenario cards.

---

## 3. Result against the RQ2 falsifier

The plan said: "if the top five are already each answered inside the current Learn tab in plain
words, RQ2 is closed and the FAQ gets no new content."

RQ2 is not closed. Of the top five by recurrence:

| Rank | Misconception | In the current Learn panel |
|---|---|---|
| 1 | Password model, chosen and resettable | Absent. Zero uses of password or reset in this sense |
| 2 | Coins live in the app or device | Absent as a named belief |
| 3 | Empty restore means loss or theft | One FAQ line, path only, no passphrase or imported accounts |
| 4 | Word order does not matter | Absent |
| 5 | Someone could guess the words | One FAQ line on collisions; the brute force question is not addressed in plain words |

Three of the top five are absent and two are answered in a single line. The falsifier does not
fire. The page needs new content, and it should replace rather than add in two places, since the
FAQ already carries the weaker version of ranks 3, 5 and 6.

---

## 4. Behaviour gaps that are not misconceptions

These are things people do, not things they wrongly believe. They are recorded here because
designing the lesson around beliefs alone would miss them.

- **Almost nobody tests a restore.** Oobit: "Only 15% of holders have ever verified their backups
  actually work." CHI 2025 also found no clear signal of test restores in the backup tables.
- **Roughly one in five keeps no backup at all.** CHI 2025 Table 5: 7.2% reported no backup, and
  the rate is higher for novices (8.6%) than experienced users (5.7%). Oobit reports only 25%
  keep paper.
- **Estate and death planning is close to absent.** CHI 2025: "none of our 20 interviewees had
  considered arrangements for transferring their crypto assets to an intended beneficiary in the
  event of their death". About 22% had shared a phrase with family for recovery. This is a real
  gap and it is outside the scope of a single page lesson. It is noted so that nobody mistakes it
  for a misconception.
- **Loss is mostly human error, not attack.** Krombholz et al., Financial Cryptography 2017,
  survey of 990 Bitcoin users: 22% had already lost money, and a later peer reviewed paper citing
  it reports 43.2% of those incidents came from user mistakes rather than attacks. This is the
  strongest available argument for teaching the material at all.

---

## 5. Claims I could not confirm (UNCONFIRMED)

Do not put any of these in the lesson as fact.

1. **Reddit engagement numbers.** Threads were confirmed to exist, by title and by indexed text.
   The specific upvote and comment counts seen during this research (for example 1,582 upvotes on
   one r/CryptoCurrency thread) were read once by an automated process and could not be
   independently reproduced here, because Reddit blocks the request from this machine. Treat
   every Reddit number as UNCONFIRMED. The thread titles are usable as evidence of recurrence.
2. **"21% of access losses were caused by lost seed phrases."** This number was found in news
   coverage of an Oobit press release, not on Oobit's own page. Oobit's page states 33% for
   forgotten passwords and 20% for lost two factor access, and separately says only 25% keep
   paper. Do not cite 21% as a seed phrase loss figure.
3. **Any percentage of users who store a phrase in a photo or screenshot.** The CHI 2025 paper
   documents the behaviour only in interview quotes and a figure, with no published percentage.
   A widely repeated number about single-location storage was found only on aggregator pages with
   no primary source behind it.
4. **Seed phrase phishing as a share of crypto scams.** No source found isolates it. The FBI IC3
   2024 report gives phishing and spoofing as the most reported crime type at 193,407 complaints,
   but that lumps all phishing. Scam Sniffer's drainer figures are mostly malicious approvals
   rather than typed seed phrases, and it counts wallet addresses, not people.
5. **The "1.6 million Bitcoin lost to self custody" figure.** It comes from a company analysis,
   not a peer reviewed source, and a second reading of the same report gives a different split.

Two caveats that apply to the strongest source. The CHI 2025 study recruited through a Qualtrics
panel of self-selected people who reported crypto experience, so its own margin of error claim
rests on an assumption its recruitment method does not guarantee. Its numbers should be read as
the best available measurement of a specific 643-person sample, not as a population rate. Oobit's
survey was funded by a crypto company and is self-reported by 1,000 US holders.

---

## 6. What this means for the lesson

The must-kill list, in order. Each one is a wrong belief a reader can hold on arrival and leave
with, and each has to be named before it is corrected:

1. **The password model.** "I chose it, and it can be reset." This is the highest value change,
   because it is the most measured, it is entirely absent today, and every other misconception
   about support, resets and recovery grows out of it.
2. **The location model.** "The coins are in the app." This is what makes the rest of the page
   meaningful, and the page already has nine chains of evidence for it.
3. **The empty restore.** "Zero means gone." The most heavily documented support problem, and the
   page has the tools to demonstrate the real causes.
4. **Order and spelling.** Cheap to fix, currently absent, and the demo already exists.
5. **The guessable phrase.** Keep it as arithmetic the reader performs, not as a claim.

Three existing lines should be kept and not expanded: 12 versus 24 words, the passphrase is not a
strength booster, and the checksum in the last word. Each is already correct and short.

One honest boundary the lesson should carry, since rank 3 is about restored wallets looking
empty: this tool is not a wallet, and an address produced here should be checked against an
independent tool before real funds move anywhere.

---

## 7. Sources

**Primary, peer reviewed or official**

- Eleshin, Sun, Ye, Das, Hong. "Of Secrets and Seedphrases: Conceptual Misunderstandings and
  Security Challenges for Seed Phrase Management among Cryptocurrency Users." CHI 2025.
  DOI 10.1145/3706598.3713209. Full text also at https://sauvikdas.com/papers/63/serve
  (Numbers used: 43.4% identified a phrase, 56.6% did not; 58% could choose their phrase; 52%
  versus 47% on moving a wallet; 75% and 59% for non-custodial users; Table 5 backup methods;
  Table 7 and Table 8; scam rates 20% experienced versus 29% novice; 22% shared for recovery;
  interview quotes from P1, P10, P13, P16, P18, P19.)
- Krombholz, Judmayer, Gusenbauer, Weippl. Financial Cryptography 2017.
  DOI 10.1007/978-3-662-54970-4_33. Survey of 990 Bitcoin users, 22% had lost money.
- FBI IC3, 2024 Internet Crime Report. https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf
- FTC, 2024 Consumer Sentinel data release, March 2025.

**Vendor support, all fetched and quoted from the page itself**

- MetaMask, "My Secret Recovery Phrase or private key restored the wrong accounts".
  https://support.metamask.io/configure/accounts/my-secret-recovery-phrase-private-key-restored-the-wrong-accounts
- MetaMask, "How to add missing accounts after restoring with Secret Recovery Phrase".
  https://support.metamask.io/configure/accounts/how-to-add-missing-accounts-after-restoring-with-secret-recovery-phrase
- Ledger, "Recovery phrase is invalid". https://support.ledger.com/article/4417716850321-zd
- Ledger, "How Ledger device generates 24-word Secret Recovery Phrase".
  https://support.ledger.com/article/4415198323089-zd
- Ledger, recovery check article. https://support.ledger.com/article/4405442533521-zd
- Trezor, "Understanding Trezor wallet backups: 12, 20 or 24 words".
  https://trezor.io/learn/security-privacy/personal-security-standards/understanding-trezor-wallet-backups-12-20-or-24-words
- Trezor, "Commonly misspelled wallet backup words".
  https://trezor.io/support/troubleshooting/trezor-suite-issues/commonly-misspelled-wallet-backup-words
- Trezor, passphrase wallet problems.
  https://trezor.io/support/troubleshooting/trezor-suite-issues/fix-passphrase-wallet-problems-in-trezor-suite

**Community, with figures read from the StackExchange API on 2026-09-26**

- bitcoin.stackexchange.com: tags mnemonic-seed 317 questions, wallet-recovery 553, seed 190.
  Questions used: 64446 (score 14, 141,750 views), 78987 (score 7, 22,194 views), 38512 (score
  17, 30,351 views), 71878 (score 10, 17,747 views), 106157 (3,193 views), 88689, 69957 (score
  10, 9,455 views), 5690 (score 8).
- ethereum.stackexchange.com: 52658 (score 16, 56,065 views), 70017 (score 54, 39,705 views).
- Reddit threads confirmed to exist by title: r/CryptoCurrency "A wallet doesn't hold any coins",
  r/BitcoinBeginners "If the seed is the Wallet why do I need a trezor", r/BitcoinBeginners
  "What keeps a computer from trying out all seed phrases", r/ledgerwallet "I am afraid to lose
  20+ BTC". Engagement figures UNCONFIRMED.

**Industry, with caveats stated in the text**

- Oobit, "Lost or locked out" survey, 1,000 US holders.
  https://oobit.com/lost-or-locked-out
- KeySense internal note (not published), for the 24 words versus 12 words entropy
  conclusion and the Coldcard case study.
