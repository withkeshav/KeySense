# Wallet knowledge curriculum

KeySense teaches wallet concepts and provides local experiments. The goal is
independent reasoning, not memorizing this interface. Lessons introduce a concept,
show a worked example, state a limit, check a misconception and ask the reader to
apply the idea without the tool. Official sources support further study.

## Coverage and practice

| Topic | Expected skill | Practice or evidence |
|---|---|---|
| Wallet roles and custody | Separate interface, signer and chain data | Draw a trust map |
| Entropy, seed words and checksum | Separate valid encoding from unpredictable generation | Bit explorer, checksum editor, entropy comparison |
| Keys and signatures | Separate key control from safe intent | Public/private key and address displays |
| HD paths and hardened derivation | Read account, change and index; explain xpub limits | Six-step Key paths walkthrough and tree inspector |
| Addresses and networks | Check network, asset and complete destination | Chain reference and address-format examples |
| Transactions | Explain UTXOs, account state, signing and confirmation | Worked UTXO example and lifecycle explanation |
| Fees and pending states | Separate resource use, price and replacement | Fee arithmetic and diagnosis question |
| Tokens and permissions | Explain allowances, NFT operators and signed rights | Permission-review scenario |
| Backup planning | Identify required secrets, policy and recovery roles | Backup inventory using category names only |
| Hardware signing | State what isolation does and does not protect | Separate host/device review exercise |
| Multisig, descriptors and PSBT | Separate signing threshold from reconstruction data | Public 2-of-3 policy threat map |
| Smart accounts and shared signing | Find spending, recovery and upgrade authority | Compare single-key, multisig and smart-account models |
| Privacy and nodes | Trace exposure of addresses, xpubs and queries | Access-scope demo and trust-boundary map |
| Recovery diagnosis | Limit conclusions to the candidates actually checked | Recovery Detective and advanced practice helpers |
| Cross-chain use | Check asset identity, bridge trust and exit assumptions | Compare two token representations |
| Bitcoin spending rules | Separate address derivation from satisfying a spend policy | Taproot key/script paths and signing-scope scenario |
| Lightning | Separate static keys from changing channel state | Channel-backup reasoning task |
| Staking | Separate validator duties and withdrawal authority | Map a service's roles and shared risks |
| Wallet review | Check software provenance, delegated powers and evidence | Fictional wallet review and warning-sign diagnosis |
| Independent judgment | State assumptions and cross-check evidence | Vanity, brain-wallet and physical entropy discussions |

## Existing tool coverage

- Home: seed word count/language, passphrase, presets, custom paths,
  address/key results, account/index changes, extended keys, import and batch
  derivation. These illustrate reproducible key derivation, not live balances.
- Physical entropy: real input versus simulated rolls, source mixing and repeatable
  educational replay. Hashing does not create uncertainty missing from the input.
- Vanity: search cost and stopping conditions. An attractive prefix is not a safety property.
- Brain wallet: demonstrate guessable inputs. This is not a recommended wallet creation method.
- Advanced practice: typo suggestions, missing final-word candidates and fixed-list
  path matching. Candidates and matches are not proof of wallet ownership or funds.
- Key paths: live values, bit editing, passphrase branches, access scope, chain grid,
  wordlist explorer, tree inspector and Recovery Detective.
- Print/copy: output handling exposes secrets to the clipboard, screen, print system
  and physical surroundings. Use disposable examples only.

## Depth and limits

The twenty lessons establish a broad foundation and introduce advanced models.
They do not constitute an exhaustive treatment of every protocol or certify expertise.
The six existing derivation lessons provide the deeper executable key/path material.
Transaction signing, broadcasting, live chain queries, PSBT construction and contract
execution are explained, not implemented by this course.

Advanced depth still requires supervised practical assessment and specialist
material: constructing Bitcoin scripts and testing sighash variants, coin selection and fee policy,
Taproot spending paths, descriptors and PSBT interoperability, threshold protocol
details, smart-account upgrades and session keys, chain-specific token authorities,
executing Lightning recovery, validator operations, bridge proof systems and incident response.
Do not label these areas as fully taught merely because their parent topic has a lesson.

## Assessment

Opening a lesson never marks it mastered. Checks provide explanations and retain no
score. Progress is not sent or saved. A reader should be able to explain a new case,
name missing evidence and reject unsafe requests without hints.

Use the reader-study procedure in MEASUREMENT.md. Add cases for the broader course:
wrong-network deposit, persistent allowance after disconnect, a missing multisig
policy, a hardware signer facing a bad request, and an inconclusive path scan.
Assess again later with different examples. Automated checks establish behavior and
readability, not comprehension or expertise.

## Practical case reviews

Ten lessons now include a fictional case, tasks to attempt without hints, a hidden
reasoning review, two assessment criteria and a changed case. They cover transaction
fee accounting, token allowances, hardware review, multisig reconstruction, guardian
control, bounded recovery searches, signature scope, Lightning state, staking roles
and wallet claims. Cases use public or fictional facts and perform no transactions.

These add applied reasoning to the existing lessons. They are not executable signing
labs, and opening a review does not prove skill. Search includes the case text.
