/* Public teaching content. No wallet state, secrets, network requests or storage. */
var KEYSENSE_COURSE = [
  {
    id: 'wallets', stage: 'Foundations', title: 'What a wallet really does',
    outcome: 'Separate the ledger, the keys and the app. Explain who can spend.',
    concept: 'A wallet is an interface to keys and network state. Coins are not files inside the app.',
    body: [
      'A blockchain is a shared record of valid changes. A wallet reads that record, prepares requests and helps you approve them. The network decides whether those requests follow its rules.',
      'With self-custody, you control the signing authority. A custodial service controls it for you. Its password reset restores access to the service, not to a lost private key.',
      'A hot wallet can sign on an online device. A cold signing setup keeps signing secrets away from that online device. These labels describe exposure, not a promise of safety.'
    ],
    flow: ['Wallet prepares a request', 'Signer approves it', 'Network checks the rules', 'Ledger state changes'],
    example: 'Deleting a wallet app does not delete its on-chain history. Restoring access still needs the right secrets and wallet settings.',
    caution: 'A displayed balance is a claim from a data source. It is not proof that you can spend it.',
    deeper: 'Separate three roles: the interface, the signer and the node that supplies chain data. One app may combine all three. A watch-only wallet can show funds without holding signing keys. Ask which role fails if a provider disappears.',
    question: 'A watch-only wallet shows a balance. What does that prove?',
    options: ['It holds the private key.', 'It can display activity for the watched account.', 'It can recover a lost seed.'], answer: 1,
    feedback: ['Watching an account does not give signing authority.', 'Correct. Reading chain data and authorizing a spend are separate abilities.', 'A display cannot recreate a lost secret.'],
    transfer: 'Draw the interface, signer and data source for a phone wallet linked to a hardware device. Which parts need a backup?',
    sources: [['Bitcoin wallet guide', 'https://developer.bitcoin.org/devguide/wallets.html']], practice: {tab: 'guide', label: 'Explore the blockchain reference'}
  },
  {
    id: 'entropy', stage: 'Foundations', title: 'Randomness, seed words and checksums',
    outcome: 'Distinguish a valid phrase from a hard-to-guess phrase.',
    concept: 'Entropy means uncertainty. A checksum catches some errors; it does not make a secret hard to guess.',
    body: [
      'BIP39 encodes random data as words. A 12-word phrase carries 128 bits of random data and four checksum bits. The checksum comes from the data.',
      'A phrase made from a famous quote can pass a checksum and still be easy to guess. Word count alone cannot tell you how the words were chosen.',
      'The words and an optional passphrase feed a fixed process that makes a seed. The passphrase is not the app password or a required thirteenth word.'
    ],
    flow: ['Random data', 'Add checksum', 'Encode as words', 'Words + passphrase → seed'],
    example: 'A public test phrase is valid but has no secrecy. Anyone can compute its keys. Never send funds to examples.',
    caution: 'A weak random source can produce normal-looking words. A passing checksum is not a randomness test.',
    deeper: 'Every bit doubles the set of possible values. This only models security when the choices are genuinely unpredictable. Hashing a short guessable input changes its appearance, not the amount of uncertainty an attacker faces.',
    question: 'A phrase passes the checksum. Which claim is justified?',
    options: ['Its encoding is consistent.', 'Nobody could guess it.', 'It was made by secure hardware.'], answer: 0,
    feedback: ['Correct. Consistent encoding says nothing about how the words were chosen.', 'Public test phrases pass too. Secrecy depends on the source.', 'A checksum cannot identify the hardware or its quality.'],
    transfer: 'Explain why both a public example and a fresh random phrase can pass the same validation test.',
    sources: [['BIP39: mnemonic codes', 'https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki']], practice: {tab: 'learn', step: 1, label: 'Explore bits and checksum changes'}
  },
  {
    id: 'signatures', stage: 'Foundations', title: 'Keys, signatures and authority',
    outcome: 'Explain what signing proves and what it does not.',
    concept: 'A signature is a proof tied to a key and a message. It does not prove that the message is safe.',
    body: [
      'A private key is a secret used to sign. A public key lets others check that proof. An address points to a place to receive funds under a chain’s rules.',
      'Signing and encryption have different jobs. Signing proves who can act and binds the signed data. Encryption hides data. A signed request can still be public.',
      'Chains use different kinds of key math and text formats. EVM wallets often use a curve called secp256k1. Solana uses Ed25519 to sign normal requests. The rules do not all match.'
    ],
    flow: ['Message + private key', 'Signature', 'Public key + message', 'Check signature'],
    example: 'A valid signature on the wrong destination still authorizes the wrong request. Verification cannot repair a decision you approved.',
    caution: 'Do not treat a request called “sign a message” as harmless. Its meaning depends on how the receiving system uses it.',
    deeper: 'A proof should be bound to the place that will use it. This is called domain separation. A signed request may name a chain, contract, nonce or expiry. A nonce helps stop reuse. Read these fields; do not trust just the button label.',
    question: 'A transaction signature is valid. What follows?',
    options: ['The destination is trustworthy.', 'The transaction will be profitable.', 'The signed data satisfies the signature check.'], answer: 2,
    feedback: ['Signature checks do not judge the recipient.', 'Cryptography makes no promise about economic outcomes.', 'Correct. Other validity rules and human intent still matter.'],
    transfer: 'Explain why checking a signature and checking the destination are two separate tasks.',
    sources: [['Ethereum accounts and keys', 'https://ethereum.org/en/developers/docs/accounts/'], ['Solana transaction signatures', 'https://solana.com/docs/core/transactions']], practice: {tab: 'learn', step: 5, label: 'Compare keys and addresses'}
  },
  {
    id: 'paths', stage: 'Foundations', title: 'One seed, a tree of keys',
    outcome: 'Read a derivation path and explain account, change and address index.',
    concept: 'A derivation path is a route through a tree of keys. Changing the route can change the result.',
    body: [
      'An HD wallet derives many keys from one root. HD means hierarchical deterministic: a tree with repeatable results. A path records which branch to follow.',
      'A common BIP44 path has purpose, coin type, account, change and address index. Change 0 is the receiving branch; change 1 is the internal branch. Other schemes can differ.',
      'An apostrophe marks a hardened step. An extended public key, or xpub, can derive suitable non-hardened public children. It cannot cross a hardened step.'
    ],
    flow: ['Root', 'Purpose / coin', 'Account', 'Change / index'],
    example: "In m/84'/0'/0'/0/0, the final zero selects the first receiving address under that account and scheme.",
    caution: 'A seed backup without the required passphrase or wallet policy can be incomplete. “Same words” is not the same as “same settings.”',
    deeper: 'An extended key carries a key and a chain code used in child derivation. An xpub is privacy-sensitive even though it cannot normally spend alone. With a parent xpub and a corresponding non-hardened child private key, the parent private key can be recovered.',
    question: 'Two paths produce different addresses from the same words. What should you conclude?',
    options: ['One calculation must be broken.', 'Different branches can produce different valid addresses.', 'Coins moved between them.'], answer: 1,
    feedback: ['Different valid branches are expected.', 'Correct. Compare the full settings and the expected address.', 'Derivation does not broadcast a transaction.'],
    transfer: 'Explain which path segment you would inspect for a different account, then for a different receiving address.',
    sources: [['BIP32: HD wallets', 'https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki'], ['BIP44: path structure', 'https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki']], practice: {tab: 'learn', step: 3, label: 'Inspect a path and its branches'}
  },
  {
    id: 'addresses', stage: 'Transactions', title: 'Addresses, formats and networks',
    outcome: 'Separate a valid address format from the intended recipient and network.',
    concept: 'An address format is an encoding rule. It is not a certificate of identity.',
    body: [
      'Bitcoin has several address types. Legacy, wrapped SegWit, native SegWit and Taproot use different spending rules and encodings. The format affects wallet compatibility.',
      'A checksum can catch many typing errors. It cannot tell whether the address belongs to the person you meant to pay.',
      'An EVM address can have the same text on several networks. Each network has its own state. Matching the text does not make balances move between networks.'
    ],
    flow: ['Recipient', 'Network', 'Asset', 'Full address and format'],
    example: 'A bc1q address points to a native SegWit destination on Bitcoin mainnet. Its prefix alone cannot identify the owner.',
    caution: 'Do not compare only the first and last few characters. Lookalike addresses can be placed in transaction histories.',
    deeper: 'An address and a public key are not always the same thing. Some addresses commit to scripts or contract accounts. Compatibility must include the chain, address type and receiving service, not just whether a parser accepts the string.',
    question: 'The same 0x address appears on two EVM networks. Are the balances shared?',
    options: ['Yes, because the address matches.', 'No, each network tracks its own state.', 'Only if the checksum passes.'], answer: 1,
    feedback: ['Address text does not join two ledgers.', 'Correct. Network and asset identity must be checked separately.', 'A checksum checks encoding, not balances.'],
    transfer: 'List the four facts you would verify before preparing a payment to an address sent in a chat.',
    sources: [['BIP84: native SegWit', 'https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki'], ['Ethereum accounts', 'https://ethereum.org/en/developers/docs/accounts/']], practice: {tab: 'learn', step: 6, label: 'Explore address formats'}
  },
  {
    id: 'transactions', stage: 'Transactions', title: 'From intent to a confirmed transaction',
    outcome: 'Explain preparation, signing, broadcast, inclusion and finality.',
    concept: 'Creating an address does not send money. A transaction requests a change to network state.',
    body: [
      'A wallet prepares a transaction. A signer authorizes it. A node receives the broadcast, and block producers may include it. Other nodes check the block.',
      'Bitcoin spends unspent transaction outputs, called UTXOs. A spend consumes whole outputs and can create a payment plus change. It does not subtract from a single account field.',
      'Ethereum uses account state, including balances and transaction counts. A transaction can send value or call contract code. Fees pay for network work, not for a guaranteed successful outcome.'
    ],
    flow: ['Prepare', 'Review and sign', 'Broadcast', 'Include and confirm'],
    example: 'Spend an example 100,000-satoshi output: 60,000 to the recipient, 39,000 back as change, and 1,000 as the fee.',
    caution: 'A transaction ID is not proof of success or finality. Check the intended chain and the execution result.',
    deeper: 'A mempool is a node’s set of pending transactions, not one global queue. Reorganizations can replace recent blocks. Confirmation policies depend on the network and risk. KeySense does not broadcast transactions or check live confirmations.',
    question: 'An Ethereum contract call fails after inclusion. Must its fee be zero?',
    options: ['Yes, all effects including fees are undone.', 'No, execution can consume gas even when the call fails.', 'Yes, if the wallet hides the failure.'], answer: 1,
    feedback: ['State rollback does not imply free network work.', 'Correct. Failure and fee payment are separate facts.', 'The interface does not set network rules.'],
    transfer: 'Explain the difference between a signed transaction, a broadcast transaction and a confirmed transaction.',
    sources: [['Bitcoin transactions', 'https://developer.bitcoin.org/devguide/transactions.html'], ['Ethereum transaction lifecycle', 'https://ethereum.org/en/developers/docs/transactions/']], practice: {tab: 'guide', label: 'Compare network models'}
  },
  {
    id: 'fees', stage: 'Transactions', title: 'Fees, pending requests and replacement',
    outcome: 'Reason about fee rates, transaction size and pending states.',
    concept: 'Fees depend on network rules and resource use. They are not a fixed percentage of the amount sent.',
    body: [
      'Bitcoin fee selection usually considers a rate per virtual byte. More inputs can make a transaction larger. A small-value payment can cost more than a large simple one.',
      'Ethereum measures execution in gas. Gas used and the effective price determine the execution fee. A gas limit caps work; it is not the same as the price per unit.',
      'On Ethereum, a pending earlier nonce can hold up later transactions from the same account. A supported replacement competes with the earlier request; it is not a guaranteed undo.'
    ],
    flow: ['Inspect pending state', 'Check resource use', 'Check fee policy', 'Review any replacement'],
    example: 'At an illustrative 10 satoshis per virtual byte, a 150-vbyte Bitcoin transaction pays 1,500 satoshis. This is arithmetic, not a live quote.',
    caution: 'Never promise that “cancel” reverses a confirmed transaction. Wallet labels can hide replacement mechanics.',
    deeper: 'Replace-by-fee changes a pending Bitcoin transaction under applicable policy. Child-pays-for-parent spends an output with a fee that may help a package be selected. Availability depends on the transaction, wallet and node policy. Layer 2 fees can also include data costs.',
    question: 'Does a higher Ethereum gas limit always mean the full limit is charged?',
    options: ['Yes, the limit is a flat price.', 'No, the limit and actual gas used are different.', 'No fees apply when sending tokens.'], answer: 1,
    feedback: ['A cap is not a flat charge.', 'Correct. Learn the chain’s charging rules and inspect the actual use.', 'Token calls require network work too.'],
    transfer: 'A user says “the payment is stuck.” Name the chain, transaction status and fee facts you need before diagnosing it.',
    sources: [['Ethereum gas and fees', 'https://ethereum.org/en/developers/docs/gas/'], ['Bitcoin transaction guide', 'https://developer.bitcoin.org/devguide/transactions.html']], practice: {tab: 'guide', label: 'Review chain differences'}
  },
  {
    id: 'tokens', stage: 'Transactions', title: 'Tokens, approvals and signed permissions',
    outcome: 'Tell apart holding a token, sending it and letting someone spend it.',
    concept: 'A token approval can let someone spend later. Closing a site does not cancel that right.',
    body: [
      'A chain’s own coin pays its fees. Tokens are tracked by contracts or other chain programs. A name or logo does not prove which token it is.',
      'ERC-20 approvals let an owner set an allowance for a spender. A later transfer can use that allowance. Review the token, spender and amount before signing.',
      'NFT standards can authorize a single item or an operator for a collection. Some protocols accept signed permissions later. “No gas now” does not mean “no authority granted.”'
    ],
    flow: ['Identify asset', 'Identify spender', 'Read permission and limit', 'Check later authority'],
    example: 'A site disconnects from your wallet, but an on-chain allowance can remain. The connection and the contract permission are separate records.',
    caution: 'A token symbol is not unique. Verify the network and contract or mint identity from a trusted source.',
    deeper: 'Typed-data signing puts named fields in the request. These can help you read it. They do not make it safe. Check the site, action, nonce and expiry. Revoking a right limits future use. It does not bring back funds already sent.',
    question: 'You disconnect a site. What can you safely assume about an existing token allowance?',
    options: ['It is automatically zero.', 'It may still exist on-chain.', 'It expires with the browser tab.'], answer: 1,
    feedback: ['Disconnecting is not an on-chain allowance update.', 'Correct. Review the permission itself, not only the connection list.', 'Contract state does not follow browser-tab lifetime.'],
    transfer: 'Explain a token approval to someone who thinks every signature sends a payment immediately.',
    sources: [['ERC-20 allowance standard', 'https://eips.ethereum.org/EIPS/eip-20'], ['ERC-721 NFTs', 'https://ethereum.org/en/developers/docs/standards/tokens/erc-721/']], practice: {tab: 'guide', label: 'Use the reference alongside the lesson'}
  },
  {
    id: 'backups', stage: 'Security', title: 'Backups, passphrases and recovery plans',
    outcome: 'Identify all information needed to restore a wallet without exposing it.',
    concept: 'A backup plan must survive both loss and theft. More copies can help one risk while worsening the other.',
    body: [
      'Record the wallet scheme, network and required policy as well as the secret backup. A passphrase can select another wallet. Losing it can make the words insufficient.',
      'An app PIN usually protects a local interface or device. It is not necessarily part of key derivation. Learn what each password protects before relying on it.',
      'Test a recovery process with disposable examples first. Plan who can act if the owner cannot. Never paste a real backup into a teaching website to test it.'
    ],
    flow: ['Inventory required data', 'Separate loss and theft risks', 'Practice safely', 'Review the plan'],
    example: 'Two copies in the same drawer help with a damaged sheet but may both be lost in one fire or theft.',
    caution: 'Do not invent a word-splitting scheme. BIP39 words, SLIP39 shares and multisig keys are different structures.',
    deeper: 'A threshold backup uses a defined number of shares to recover a secret. SLIP39 specifies one such format; it is not plain BIP39 word splitting. Software support, share thresholds and passphrase requirements must be known before a recovery is needed.',
    question: 'You have all seed words but lost the required passphrase. What is the honest conclusion?',
    options: ['Any wallet can reset it.', 'The checksum reveals it.', 'The backup may not be sufficient.'], answer: 2,
    feedback: ['There is no universal passphrase reset.', 'The checksum does not encode the passphrase.', 'Correct. Recovery depends on the actual scheme and missing information.'],
    transfer: 'Write a backup checklist using only category names. Include secrets, public policy data and who can access each.',
    sources: [['SLIP39 threshold backups', 'https://github.com/satoshilabs/slips/blob/master/slip-0039.md'], ['BIP39 passphrases', 'https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki']], practice: {tab: 'learn', step: 1, label: 'Compare the passphrase branches'}
  },
  {
    id: 'hardware', stage: 'Security', title: 'Hardware wallets and transaction review',
    outcome: 'Explain what a separate signer protects and what you must still check.',
    concept: 'Keeping a key away from an online computer reduces exposure. It does not make every approved request safe.',
    body: [
      'A hardware wallet can keep signing material inside a separate device. The host prepares data and asks the device to sign. The device display is a separate review surface.',
      'Check destination, network, amount and fees where the device can display them. If the action cannot be understood, approving it blindly defeats an important protection.',
      'Check where the device came from, its software and who can reach it. Check how you keep its backup. A hardware label alone does not prove the setup is safe.'
    ],
    flow: ['Host prepares', 'Device displays', 'Human reviews', 'Device signs'],
    example: 'Malware replaces a destination on the computer. Comparing the full destination on a trusted device display may catch the change before approval.',
    caution: 'A secure signer can faithfully sign an attacker’s request if the user approves it.',
    deeper: 'An air gap separates devices from direct network links. QR codes and removable media still carry data across that gap. File parsing, update trust and what the device displays remain part of the security boundary. Offline is an exposure choice, not proof of correctness.',
    question: 'Does a hardware wallet make blind signing safe?',
    options: ['Yes, because the key stays inside.', 'No, key isolation does not establish the request’s intent.', 'Yes, if the website looks professional.'], answer: 1,
    feedback: ['Key protection and informed authorization are separate.', 'Correct. The request must still be understood and checked.', 'Appearance is not a security check.'],
    transfer: 'Name one attack blocked by key isolation and one attack it does not block.',
    sources: [['Bitcoin signing-only wallets', 'https://developer.bitcoin.org/devguide/wallets.html'], ['Ethereum security guide', 'https://ethereum.org/en/security/']], practice: {tab: 'learn', step: 4, label: 'Inspect access to public and private keys'}
  },
  {
    id: 'multisig', stage: 'Advanced', title: 'Multisig, descriptors and PSBT',
    outcome: 'Explain how many keys can sign and what else a wallet backup needs.',
    concept: 'Multiple keys can share control, but the spending policy is part of the wallet too.',
    body: [
      'A 2-of-3 multisig policy needs two of three eligible signatures. Losing one signer need not stop spending. Compromising two can still defeat the policy.',
      'A descriptor describes how Bitcoin outputs are constructed. It can include key origins, paths and script rules. Secret keys alone may not capture every detail needed for recovery.',
      'A PSBT is a partially signed Bitcoin transaction format. It lets a coordinator and signers exchange transaction data. Creating a PSBT is not the same as broadcasting it.'
    ],
    flow: ['Wallet policy', 'Coordinator prepares PSBT', 'Required signers review', 'Finalize and broadcast'],
    example: 'Three devices kept in the same place may share a physical failure. Three signers using the same compromised computer may share a software risk.',
    caution: 'A count of keys does not prove they are kept apart. Look for shared ways they could fail.',
    deeper: 'Each signer should check the outputs, fees and wallet rules. A descriptor checksum can catch a typo. It cannot tell if the rules are honest. Keep the public policy data safe too. It can expose wallet use even if it cannot spend alone.',
    question: 'For a 2-of-3 wallet, is keeping any two seed backups always a complete recovery plan?',
    options: ['Yes, all policies are identical.', 'No, policy and reconstruction data may also be needed.', 'No, all three signatures are always required.'], answer: 1,
    feedback: ['Script and path choices can differ.', 'Correct. Signing authority and wallet reconstruction are related but distinct.', 'Two signatures meet this threshold, if the rest of the policy is known.'],
    transfer: 'Draw a 2-of-3 plan and mark shared physical, software and human risks. Do not include real keys.',
    sources: [['BIP380: descriptors', 'https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki'], ['BIP174: PSBT', 'https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki'], ['BIP67: multisig key ordering', 'https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki']], practice: {tab: 'learn', step: 4, label: 'Review extended-key access boundaries'}
  },
  {
    id: 'smart-wallets', stage: 'Advanced', title: 'Smart accounts, guardians and shared signing',
    outcome: 'Explain who can spend, who can restore access and where those rules live.',
    concept: 'Not every wallet uses just one private key. Find out who can act and how the rules work.',
    body: [
      'A smart account uses code to set who may act. It may have limits, more than one signer or help with lost access. The code and its settings define these rules.',
      'Account abstraction lets accounts use more flexible rules. Check who can change those rules and who can restore access. An easy app can still have complex control behind it.',
      'MPC means multi-party computation: parties work on a task together. Some systems share the work of signing without an on-chain multisig rule. Their trust and backup needs depend on the design.'
    ],
    flow: ['Who may act?', 'What limits apply?', 'Who may change the rules?', 'What if a provider fails?'],
    example: 'A guardian may help restore access under the wallet’s rules. Ask what that role can do. It is not a promise that funds can never be lost.',
    caution: 'Do not assume “seedless” means no secrets, no trusted parties or no recovery risk.',
    deeper: 'Some rules live on-chain. Some secrets are held in shares off-chain. Passkeys and services that restore access add other trust choices. A service may bundle requests or pay fees for you. Ask what still works if it stops and who can change the code.',
    question: 'A wallet advertises social recovery. What must you inspect?',
    options: ['Only its colour and ratings.', 'The guardian rules, delays and authority to change them.', 'Nothing, because recovery is automatic.'], answer: 1,
    feedback: ['Presentation cannot establish a recovery policy.', 'Correct. Evaluate the actual control and failure model.', 'Recovery mechanisms have conditions and dependencies.'],
    transfer: 'Compare a single-key wallet, a multisig wallet and a smart account by who can spend, recover and change the rules.',
    sources: [['Ethereum account abstraction', 'https://ethereum.org/en/developers/docs/account-abstraction/']], practice: {tab: 'guide', label: 'Compare account models in the reference'}
  },
  {
    id: 'privacy', stage: 'Security', title: 'Privacy, nodes and trust boundaries',
    outcome: 'Explain who learns what when you share an address or ask for a balance.',
    concept: 'Public does not mean harmless to share. A group of public addresses can reveal much more than one address.',
    body: [
      'A block explorer can link activity around an address. An xpub can expose a set of derived public addresses. Neither should be confused with private signing material.',
      'A wallet often asks a remote service for balances and history. That service may observe query patterns and network metadata. A local app can still depend on remote data.',
      'Running a node changes which provider you trust for chain data. It does not automatically hide your network traffic or erase links already published.'
    ],
    flow: ['Data you reveal', 'Who receives it', 'What they can infer', 'How long it remains'],
    example: 'Sharing one invoice address is different from sharing an account xpub. The latter can reveal a whole branch of activity.',
    caution: 'A fresh receiving address is useful privacy hygiene, not a promise of anonymity.',
    deeper: 'A threat model names what you protect, who may attack it and what you trust. Check browser add-ons, copied addresses, changed code and false chain data as separate risks. An offline page blocks some routes. It cannot prove that your device is safe.',
    question: 'Can an xpub disclosure matter if it cannot spend alone?',
    options: ['No, only private keys matter.', 'Yes, it can expose related wallet activity.', 'Yes, it always permits spending by itself.'], answer: 1,
    feedback: ['Privacy is a separate asset worth protecting.', 'Correct. Read access can be broad and sensitive.', 'An xpub alone does not normally grant signing authority.'],
    transfer: 'Map one wallet action from device to data provider. List what each party learns without using any personal addresses.',
    sources: [['BIP32 public-key derivation', 'https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki'], ['Bitcoin transaction privacy context', 'https://developer.bitcoin.org/devguide/transactions.html']], practice: {tab: 'learn', step: 4, label: 'Explore public-key access scope'}
  },
  {
    id: 'recovery', stage: 'Security', title: 'Recovery diagnosis without false promises',
    outcome: 'Investigate an empty wallet without treating a limited search as proof of loss.',
    concept: 'Recovery is a diagnosis problem. A wrong setting and a missing secret can produce similar symptoms.',
    body: [
      'First separate a data-display problem from a key mismatch. Record the expected network, address, wallet scheme and any required passphrase. Use public records where possible.',
      'A different account, path, address format or passphrase can lead elsewhere. A wallet may also scan only a limited range of unused addresses.',
      'A missing-word helper lists candidates under its assumptions. Passing a checksum does not identify the original wallet. A known address can help test a candidate without proving it has funds.'
    ],
    flow: ['Expected public record', 'Network and wallet scheme', 'Paths and account range', 'Evidence and limits'],
    example: 'Recovery Detective holds words and passphrase fixed. Only the common Bitcoin path changes, so you can isolate that one cause.',
    caution: 'KeySense checks a small fixed set of paths. No match does not prove a seed is wrong or that a wallet has no funds.',
    deeper: 'Discovery rules often stop after a run of unused addresses, called a gap limit. Multisig also needs its policy. A contract wallet may need different recovery steps from a seed-based wallet. Do not expose a real backup to someone offering a universal fix.',
    question: 'A scan of 15 listed paths finds no match. What is supported?',
    options: ['Those checked candidates did not match.', 'The funds no longer exist.', 'The seed must be wrong.'], answer: 0,
    feedback: ['Correct. The result is limited to the paths and settings actually checked.', 'A local path scan does not inspect funds.', 'Other paths, passphrases or schemes may explain the mismatch.'],
    transfer: 'Build a diagnosis tree for an empty restored wallet. Mark which checks use public data and where you should stop.',
    sources: [['BIP44 account discovery', 'https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki']], practice: {tab: 'learn', anchor: 'recoveryDetective', label: 'Solve Recovery Detective'}
  },
  {
    id: 'cross-chain', stage: 'Advanced', title: 'Chains, bridges and asset identity',
    outcome: 'Explain why a valid address can still be used on the wrong chain.',
    concept: 'A bridge has its own rules and risks. It does not merge two chains.',
    body: [
      'Two chains can use the same address format yet track their own funds. Tokens can share a name but come from different contracts or issuers.',
      'A bridge may lock a coin on one chain and issue a claim on another. Other bridges use other designs. Ask what backs that claim and who can change the rules.',
      'A layer 2 runs work above a base chain. It has its own rules for fees and exits. Ask when funds can leave and which chain makes the final record.'
    ],
    flow: ['Source chain and asset', 'Bridge mechanism', 'Destination representation', 'Exit and recovery limits'],
    example: 'A familiar token name after a bridge is not enough. Check its contract and the rules for getting the backing asset out.',
    caution: 'Never assume that a destination service can recover a deposit made on an unsupported network.',
    deeper: 'Ask who checks the bridge, who can change it, who holds funds and what can delay an exit. Chains also differ in how they group work. Solana groups instructions into a transaction. EVM chains follow a different model. Check each chain’s source docs.',
    question: 'The receiving address accepts the same text format. Is that enough to choose a deposit network?',
    options: ['Yes, matching text guarantees support.', 'No, the service must support that network and asset.', 'Yes, if fees are lower there.'], answer: 1,
    feedback: ['Encoding compatibility is only one property.', 'Correct. Confirm the complete deposit requirements.', 'Lower fees do not establish compatibility.'],
    transfer: 'Compare two representations of a token by chain, contract identity, backing and exit mechanism.',
    sources: [['Ethereum bridge models and risks', 'https://ethereum.org/en/developers/docs/bridges/'], ['Solana transaction model', 'https://solana.com/docs/core/transactions']], practice: {tab: 'guide', label: 'Inspect the chain reference'}
  },
  {
    id: 'scripts', stage: 'Advanced', title: 'Bitcoin scripts, Taproot and signing scope',
    outcome: 'Explain why an output is a spending rule, not just an address string.',
    concept: 'Bitcoin locks outputs to rules. A spend must provide data that satisfies those rules.',
    body: [
      'A simple output can require proof from one key. Other policies can need several keys or a time condition. The address encodes a destination for a particular kind of rule.',
      'Taproot supports spending through a key path or a script path. A key-path spend uses a valid signature for the output key. A script-path spend reveals a permitted script and its proof.',
      'A signature covers data according to its sighash mode. That mode defines which parts of the transaction are bound by the signature. Advanced signing requires checking that scope.'
    ],
    flow: ['Output policy', 'Allowed spend path', 'Required proof', 'Network validation'],
    example: 'A time condition may stop spending until a stated point. Having a key does not remove the other rules of the chosen script.',
    caution: 'KeySense’s Taproot preset demonstrates an address derivation. It does not build every Taproot policy or verify a complete spend.',
    deeper: 'Scripts, key ordering and path data affect wallet reconstruction. Use reviewed policy formats and independent test vectors rather than inventing a script from memory. A readable policy name is useful, but the actual encoded policy determines what the network checks.',
    question: 'Does a Taproot-looking address tell you every possible spending condition behind it?',
    options: ['Yes, all rules are printed in the address.', 'No, the address does not display the full policy.', 'Yes, it proves there is only one signer.'], answer: 1,
    feedback: ['The encoded output is not a readable list of all rules.', 'Correct. An address alone is not a complete policy description.', 'The address does not prove how control is shared.'],
    transfer: 'Explain the difference between deriving an address and proving that a proposed spend satisfies its rules.',
    sources: [['BIP341: Taproot spending rules', 'https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki']], practice: {tab: 'learn', step: 6, label: 'Compare the address formats'}
  },
  {
    id: 'channels', stage: 'Advanced', title: 'Lightning channels and changing state',
    outcome: 'Explain why some wallets need both keys and changing state.',
    concept: 'A payment channel changes as people pay. Keep the keys and the data needed to recover the channel. These have different jobs.',
    body: [
      'Lightning uses channels to send payments. Each payment need not go on the base chain. The channel still relies on Bitcoin’s rules to open and close.',
      'Channel liquidity means the funds available on each side. This affects how much you can send or receive. A balance alone does not tell you if a route can carry a payment.',
      'Recovery depends on the wallet. LND uses an aezeed backup. It can use static channel backups to help close channels after data loss. This is not the same as BIP39 recovery.'
    ],
    flow: ['Channel funding', 'State updates', 'Channel recovery data', 'Close or settle'],
    example: 'A static channel backup is not a copy of each past payment. It helps with recovery. It does not restore a live channel exactly as it was.',
    caution: 'Do not load old channel state casually. Follow the wallet’s recovery procedure; stale state can be dangerous.',
    deeper: 'A watchtower can help check some channel risks while a node is offline. It does not replace all backups or ensure that payments can route. Some Lightning services hold keys for you. Others let you control your own node and keys.',
    question: 'Should you assume a Lightning wallet can always be restored with any BIP39 app?',
    options: ['Yes, all word backups are interchangeable.', 'No, the backup format and channel recovery process can differ.', 'Yes, if the word count matches.'], answer: 1,
    feedback: ['Word-based formats can encode different data.', 'Correct. Identify the wallet and its documented recovery requirements.', 'Word count alone does not identify the format.'],
    transfer: 'Explain why “I backed up my keys” and “I can recover my channel funds” are different claims.',
    sources: [['LND disaster recovery requirements', 'https://docs.lightning.engineering/lightning-network-tools/lnd/disaster-recovery']], practice: {tab: 'guide', label: 'Review what KeySense does and does not implement'}
  },
  {
    id: 'staking', stage: 'Advanced', title: 'Staking, delegated roles and withdrawal rights',
    outcome: 'Explain who can sign votes, earn rewards and withdraw funds.',
    concept: 'Staking adds new roles and rules. A wallet balance does not show who controls them.',
    body: [
      'Proof-of-stake chains use staked funds and votes to agree on their state. The rules differ by chain. A validator takes part in this work. That is not the same as just holding a token.',
      'The key used to sign votes can differ from the right to withdraw funds. Check what power a service gets. Do not assume that the same key does both jobs.',
      'Staking pools add contracts, operators and claims on assets. A pool may give you a receipt token. That token has risks beyond the original coin. Rewards are not guaranteed profit.'
    ],
    flow: ['Who runs the validator?', 'Who signs duties?', 'Who can withdraw?', 'What can delay exit?'],
    example: 'One service may run the node while you keep the right to withdraw. Another may hold funds for you. The name “staking” does not tell you which is true.',
    caution: 'Slashing can take stake for certain rule breaches. Downtime can also cost rewards or incur penalties. Failed contracts and slow exits are other risks. Check the rules for each chain and product.',
    deeper: 'Two active copies of a validator key can sign votes that conflict. Learn how the protocol guards against this before restoring a node. Copying a wallet file is not a full recovery plan. KeySense does not make validator keys or manage staking.',
    question: 'Does a staking receipt token have exactly the same risks as holding the original coin?',
    options: ['Yes, because the names are related.', 'No, the pool, contract and exit mechanism add risks.', 'Yes, if it shows a positive reward rate.'], answer: 1,
    feedback: ['A related name does not remove service or contract risks.', 'Correct. Evaluate the whole arrangement and its control model.', 'A quoted rate does not establish safety.'],
    transfer: 'Draw the roles in a staking service using no real account data. Mark who controls validation, withdrawal and upgrades.',
    sources: [['Ethereum staking models', 'https://ethereum.org/en/staking/']], practice: {tab: 'guide', label: 'Compare chain models before assuming shared rules'}
  },
  {
    id: 'review', stage: 'Advanced', title: 'Review a wallet and respond to warning signs',
    outcome: 'Build an evidence-based review instead of trusting a product label.',
    concept: 'A wallet review asks who can act, what code is trusted and how failures are handled.',
    body: [
      'Check the source of the app, update process, signer and network data. A source repository is useful evidence, but it does not prove that the installed binary matches it.',
      'For signed requests, inspect the action and its scope. Typed data helps show fields but does not itself prevent replay. The receiving protocol must enforce its own reuse rules.',
      'Some account systems allow delegated code or session-specific powers. Learn the exact scope, lifetime and revocation mechanism. Closing the site may leave those powers in place.'
    ],
    flow: ['Observe the symptom', 'Preserve public evidence', 'Identify affected authority', 'Use a trusted response path'],
    example: 'An unexpected signature prompt is a reason to stop and inspect. It is not, by itself, proof that a private key has been stolen.',
    caution: 'Never publish backups, keys or complete sensitive logs in a support ticket. A recovery offer can itself be a phishing attempt.',
    deeper: 'Distinguish a leaked seed, a bad token allowance, an unsafe account delegation and a false balance display. Each affects a different boundary. Record public transaction IDs and timing where relevant. Do not run random “rescue” scripts or send more funds as a test.',
    question: 'A wallet shows an unexpected balance. What should you conclude first?',
    options: ['The private key is certainly stolen.', 'You need independent evidence about the chain, data source and activity.', 'A stranger’s recovery link will fix it.'], answer: 1,
    feedback: ['The display alone does not prove a key leak.', 'Correct. Diagnose the boundary before claiming a cause.', 'Unsolicited recovery links can expose your secrets.'],
    transfer: 'Review a fictional wallet using a checklist for custody, signer, updates, permissions, backups, privacy and failure handling.',
    sources: [['EIP712: typed data and replay limits', 'https://eips.ethereum.org/EIPS/eip-712'], ['EIP7702: account code delegation', 'https://eips.ethereum.org/EIPS/eip-7702']], practice: {tab: 'learn', anchor: 'recoveryDetective', label: 'Practice separating evidence from assumptions'}
  },
  {
    id: 'judgment', stage: 'Advanced', title: 'Advanced practice and independent judgment',
    outcome: 'Explain a tool’s assumptions, test its result and recognize when not to use it.',
    concept: 'Skill means knowing why a result makes sense and where it can fail. A plausible output alone is not enough.',
    body: [
      'Vanity search tries many keys to find an address pattern. More constrained characters raise the expected work. A nice prefix does not make a key safer.',
      'A brain wallet derives keys from chosen text. Humans choose predictable text, so attackers can try likely inputs. A hash cannot turn a public phrase into a secret.',
      'Physical entropy practice teaches the source of randomness. Real rolls differ from simulated rolls. Neither a diagram nor a simple random-source check proves that a device is uncompromised.'
    ],
    flow: ['State the assumption', 'Predict the result', 'Compare independently', 'Explain the limit'],
    example: 'An attractive address from an unknown generator may be known to its operator. Appearance does not establish how the secret was created.',
    caution: 'Use only disposable examples in every KeySense tool. This app does not certify wallets, recover funds or prove a seed is secure.',
    deeper: 'A strong final check spans topics. Diagnose a deposit on the wrong chain. Review a request to spend tokens. Rebuild a wallet from a public policy. Say what facts you still need. Try these tasks again later with no hints. Reading every page is not proof of skill.',
    question: 'Two tools agree on an address. What has that established?',
    options: ['The seed is secret and securely generated.', 'Those tools agree for those inputs, subject to shared bugs.', 'Every network has funds at that address.'], answer: 1,
    feedback: ['Output agreement does not test secrecy or the random source.', 'Correct. Independence and input coverage still matter.', 'Derivation is not a balance check.'],
    transfer: 'Teach a newcomer why a valid phrase, a valid address and a valid signature each leave different safety questions unanswered.',
    sources: [['Ethereum scam prevention', 'https://ethereum.org/en/security/'], ['Bitcoin standards and test vectors', 'https://github.com/bitcoin/bips']], practice: {tab: 'experiments', label: 'Inspect the advanced practice limits'}
  }
];
// Fictional paper cases. No signing, recovery or chain actions are performed.
var KEYSENSE_CASES = {
  "transactions": {
    "title": "Account for every output",
    "scenario": "A Bitcoin payment spends one input worth 120,000 satoshis. A satoshi is one hundred millionth of a bitcoin. The recipient gets 70,000. A second output gets 48,000. The app calls it change.",
    "tasks": [
      "Work out the fee. State what you assumed about the input list.",
      "Explain why a change label is not proof that you control the second output."
    ],
    "answer": "The fee is 2,000 satoshis: 120,000 minus 70,000 minus 48,000. This assumes the record lists every input and output. Check that the second output follows your own wallet policy before signing. A correct sum does not prove the destination is right.",
    "criteria": [
      "Accounts for every input and output.",
      "Checks ownership of change as well as the recipient."
    ],
    "variation": "The second output falls to 40,000 with no new outputs. What changed? The fee is now 10,000. A higher fee is not evidence that the payment is safer."
  },
  "tokens": {
    "title": "Disconnected, but still allowed",
    "scenario": "A fictional token contract records an allowance of 500 units for a spender. The owner disconnects the site. Later, the owner receives 200 more units of the same token.",
    "tasks": [
      "Does closing the connection erase the allowance? Explain where each kind of permission lives.",
      "Name the chain, token and spender evidence you would check."
    ],
    "answer": "Disconnecting ends the app connection. It does not erase the allowance recorded by the token contract. The spender may still act within that allowance, subject to the contract rules and available balance. New deposits can be exposed too. Check the exact chain, token contract, spender and current allowance. A revoke request must take effect on that chain; a pending request is not a confirmed change.",
    "criteria": [
      "Separates a connection from a spending right.",
      "Does not assume a pending revoke has already taken effect."
    ],
    "variation": "The owner also signed a permit that has not been used. Explain why checking only current allowances may miss a future right. Review that permit format and its expiry and nonce rules. A nonce is a value used to prevent reuse."
  },
  "hardware": {
    "title": "The device disagrees",
    "scenario": "The computer shows your intended recipient. The signing device shows a different full address. A support message says the device is old and you should approve anyway.",
    "tasks": [
      "State your decision before listing checks.",
      "Explain which claim a hardware signer can support, and which it cannot."
    ],
    "answer": "Do not approve the mismatch. Check the intended destination through a trusted route and inspect the exact request. A device can protect keys while still signing a harmful request that you approve. A familiar logo or support message is not evidence that the destination is yours. This paper case requires no real transaction.",
    "criteria": [
      "Stops at the mismatch rather than guessing.",
      "Separates keeping keys private from approving safe intent."
    ],
    "variation": "The device shows only a hash, a short digest of the request. What evidence is missing? You still need a trusted way to understand the full action before approval."
  },
  "multisig": {
    "title": "Two seeds, missing rules",
    "scenario": "A fictional Bitcoin wallet needs two of three keys to spend. Two signers keep their seeds. The third signer and the coordinator app are gone. The backup has no record of the third public key or spending policy.",
    "tasks": [
      "Separate the signing threshold from the data needed to rebuild the wallet.",
      "List what a recovery drill should have tested before the loss."
    ],
    "answer": "Two signing keys may meet the threshold once the right spending script is known. They do not by themselves specify that script. The third public key, key paths, script type and ordering rules can matter. Look for a verified descriptor or policy backup. A descriptor is a text description of the wallet spending rules. Do not claim funds are lost or restored from the seed count alone.",
    "criteria": [
      "Names missing public policy data.",
      "Requires a match to known addresses before trusting a rebuilt wallet."
    ],
    "variation": "A policy backup appears, but its first address differs from an old record. Treat that mismatch as unresolved. Check the network, paths and policy instead of signing a test spend."
  },
  "smart-wallets": {
    "title": "A guardian is another authority",
    "scenario": "A fictional smart wallet uses a phone key for daily spending. Two of three guardians can replace that key after a delay. One vendor controls two guardian accounts and the upgrade key.",
    "tasks": [
      "Draw who can spend, recover and change the rules.",
      "Explain what happens to the two-of-three claim when one party controls two accounts."
    ],
    "answer": "Count independent control, not account labels. This vendor can meet the stated guardian threshold alone. Its upgrade key is another route that needs review. The delay may allow a response, but only if someone can detect and stop an unwanted recovery under the actual rules. These are facts of this fictional design, not claims about every smart wallet.",
    "criteria": [
      "Finds control shared by supposedly separate guardians.",
      "Checks upgrade and recovery powers as well as the daily key."
    ],
    "variation": "Now each guardian is independent, but all rely on one email account for recovery. The shared email becomes a common point of failure. Map that route too."
  },
  "recovery": {
    "title": "A search is not a verdict",
    "scenario": "A helper checks 15 listed paths at account zero and index zero. None matches an old address. The seed passes its checksum. A stranger offers a wider search if you send the words.",
    "tasks": [
      "Write the narrow conclusion supported by this result.",
      "Name three remaining causes and reject any step that exposes the seed."
    ],
    "answer": "There was no match among those 15 candidates for those exact inputs. That says nothing about balances or all possible paths. A different passphrase, account, index, network or wallet policy could explain the result. The checksum tests encoding, not ownership. Do not send the words. Use public test cases to learn the process and trusted recovery procedures for the wallet involved.",
    "criteria": [
      "States the tested scope without claiming universal absence.",
      "Keeps secrets out of support messages and search services."
    ],
    "variation": "One candidate now matches. This supports an address match for that input. It still does not prove a balance, secure seed generation or sole control of the keys."
  },
  "scripts": {
    "title": "What did this signature cover?",
    "scenario": "A Bitcoin signing request uses a signing mode you do not recognize. The app says a signature always locks every input and output. You have not checked the script or signing rules.",
    "tasks": [
      "Explain why that blanket claim needs evidence.",
      "List the parts of the request you must understand before signing."
    ],
    "answer": "Signing scope depends on the signature hash mode and the spending rules. Some modes commit to fewer transaction fields than others. Identify the mode, inputs, outputs and applicable script before drawing a conclusion. A signature that verifies only proves the required cryptographic relation. It does not establish that every field matched your intent.",
    "criteria": [
      "Does not assume every mode covers the whole transaction.",
      "Asks for the actual rules instead of inferring them from a familiar address."
    ],
    "variation": "The app changes an output after a signature is made. Whether the signature remains valid depends on what it covered. Explain why this case cannot be decided without the mode and context."
  },
  "channels": {
    "title": "A seed and an old channel file",
    "scenario": "An LND node has failed. LND is one Lightning node implementation. You have its seed and a static channel backup. A friend also found an old copy of the live channel database.",
    "tasks": [
      "Explain why on-chain key recovery differs from channel recovery.",
      "Choose what documentation and evidence to gather before a restore."
    ],
    "answer": "Channel state changes as payments happen. Static channel backups are not a copy of the latest balance state. LND recovery uses them to seek channel closure with peers; outcomes depend on peer and chain conditions. Do not treat an old live database as a safe replacement. Follow the recovery procedure for the exact implementation and version. Keep the original files intact while planning.",
    "criteria": [
      "Separates keys, static backup data and live channel state.",
      "Does not promise instant or guaranteed recovery."
    ],
    "variation": "A peer is offline. Explain why possession of a backup does not promise that recovery finishes now. State the dependency rather than inventing a completion time."
  },
  "staking": {
    "title": "Who can withdraw?",
    "scenario": "A made-up staking service lets your wallet sign a deposit. Its contract controls when funds can leave. An admin can change that code. The page says you keep control because you used your own wallet.",
    "tasks": [
      "List who can deposit, run the validator, take funds out and change the code.",
      "Explain what the wallet signature does not prove about later access."
    ],
    "answer": "Signing the deposit approves that request. It does not show who can later take funds out. Here, the contract and its admin affect that control. Check exit rules and delays. Check what the admin can change. A validator can face penalties for breaking network rules. That risk differs from a fall in price or a bug in code. Using your own wallet does not remove these risks.",
    "criteria": [
      "Finds who can let funds out and change the rules.",
      "Does not assume signing a deposit means keeping sole control."
    ],
    "variation": "The contract pauses exits. The wallet still signs. Explain why having the key does not let you ignore the contract rules."
  },
  "judgment": {
    "title": "Review a wallet claim",
    "scenario": "A fictional product says: “Offline keys, three guardians, instant recovery, and every restored address is verified.” It does not say who signs or who controls the guardians. It does not explain its restore rules or address checks.",
    "tasks": [
      "Write four questions that turn the claims into facts you could check.",
      "Give a first verdict. Name what could change your view."
    ],
    "answer": "Ask where keys are made and used. Who controls each guardian? What does a restore need? How are addresses checked? Ask which failures the tests cover and whether the checker shares the same code. The claims are not enough to establish safety. Keep an open mind until you have proof. A badge is not enough. Check who has power, what each step needs and what could fail.",
    "criteria": [
      "Asks for proof of each claim.",
      "States what is unknown and how to check it."
    ],
    "variation": "Two apps agree on the address but use the same library. That helps check that results agree. It is not a fully separate test. It says nothing about whether the seed is secret."
  }
};
KEYSENSE_COURSE.forEach(function (lesson) {
  if (KEYSENSE_CASES[lesson.id]) lesson.caseStudy = KEYSENSE_CASES[lesson.id];
  if (lesson.id === 'tokens') lesson.sources.push(['Token allowance revocation', 'https://ethereum.org/guides/how-to-revoke-token-access']);
  if (lesson.id === 'channels') lesson.sources.push(['LND recovery procedure', 'https://github.com/lightningnetwork/lnd/blob/master/docs/recovery.md']);
});
if (typeof module !== 'undefined' && module.exports) module.exports = KEYSENSE_COURSE;
