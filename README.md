# @tetherto/wdk-protocol-lending-morpho-evm

Note: This package is in beta. Please test in a dev setup first.

A WDK lending module for Morpho on EVM chains. It keeps the same package shape as the Aave WDK lending module, but delegates Morpho vault and market transaction construction to `@morpho-org/morpho-sdk`.

## About WDK

This is part of WDK (Wallet Development Kit). WDK helps you build safe, non-custody wallets. Read more at https://docs.wallet.tether.io.

## Features

- Deposit into Morpho Vault V2 earn targets.
- Withdraw from Morpho Vaults V2.
- Supply and withdraw collateral in Morpho Blue market.
- Borrow and repay from a configured Morpho Blue market.
- Expose Morpho SDK approval/signature/authorization requirements.
- Quote costs before sending.
- Works with standard EVM accounts and ERC-4337 smart accounts.

## Installation

```bash
npm install @tetherto/wdk-protocol-lending-morpho-evm
```

## Quick Start

```javascript
import MorphoProtocolEvm from '@tetherto/wdk-protocol-lending-morpho-evm'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'

const account = new WalletAccountEvm(seed, "0'/0/0", {
  provider: 'https://ethereum-rpc.publicnode.com'
})

const morpho = new MorphoProtocolEvm(account, {
  presets: {
    earn: 'sky-money-usdt-savings',
    borrow: 'wsteth'
  }
})

// Send approval requirements first when returned by the Morpho SDK.
const requirements = await morpho.getSupplyRequirements({
  token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  amount: 1000000n
})

// Then send the vault deposit transaction.
await morpho.supply({
  token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  amount: 1000000n
})
```

## Configuration

```javascript
new MorphoProtocolEvm(account, options)
```

Options:

- `earnVaultAddress` (string): explicit Morpho vault address.
- `earnVaultVersion` (`'v2'`): vault type for `earnVaultAddress`; defaults to `'v2'`. Morpho Vault V1 is intentionally not supported by this module.
- `borrowMarketParams` (object): explicit Morpho Blue market params.
- `borrowMarketId` (string): explicit market id; market params are fetched on-chain.
- `presets` (object): `{ earn?: string, borrow?: string }`.
- `slippageTolerance` (bigint): passed through to `@morpho-org/morpho-sdk`.
- `supportSignature` (boolean): enable SDK permit/permit2 requirements.
- `supportDeployless` (boolean): enable SDK deployless reads.

## Methods

| Method | Description |
|---|---|
| `supply(options, config?)` | Deposit assets into the configured vault |
| `getSupplyRequirements(options)` | Return SDK requirements for vault deposit |
| `quoteSupply(options, config?)` | Quote vault deposit |
| `withdraw(options, config?)` | Withdraw assets from the configured vault |
| `quoteWithdraw(options, config?)` | Quote vault withdrawal |
| `supplyCollateral(options, config?)` | Supply collateral to the configured market |
| `getSupplyCollateralRequirements(options)` | Return SDK requirements for collateral supply |
| `quoteSupplyCollateral(options, config?)` | Quote collateral supply |
| `borrow(options, config?)` | Borrow from the configured market |
| `getBorrowRequirements(options)` | Return SDK authorization requirements for borrow |
| `quoteBorrow(options, config?)` | Quote borrow |
| `repay(options, config?)` | Repay by assets, or pass `amount: 'max'` to repay current borrow shares |
| `getRepayRequirements(options)` | Return SDK requirements for repay |
| `quoteRepay(options, config?)` | Quote repay |
| `withdrawCollateral(options, config?)` | Withdraw collateral from the configured market |
| `quoteWithdrawCollateral(options, config?)` | Quote collateral withdrawal |
| `getVaultPosition(account?)` | Read configured vault position |
| `getMarketPosition(account?)` | Read configured market position |
| `getAccountData(account?)` | Read combined configured vault and market position |

## Presets

Earn presets target Ethereum mainnet USDT vaults:

| Preset | Vault |
|---|---|
| `sky-money-usdt-savings` | sky.money USDT Savings V2 |
| `steakhouse-prime-instant` | Steakhouse Prime Instant V2 |

Use Morpho Vault V2 only. Passing `earnVaultVersion: 'v1'` is rejected, and `npm run check:vault-v2` verifies that built-in earn presets, docs, and tests do not reintroduce Morpho Vault V1 usage.

Borrow presets target Ethereum mainnet USDT loan markets:

| Preset | Collateral |
|---|---|
| `susds` | sUSDS |
| `wsteth` | wstETH |
| `wbtc` | WBTC |
| `xaut` | XAUt |

## Morpho SDK Requirements

Morpho SDK actions can require approvals, permit/permit2 signatures, or Morpho authorization before the final action. This module exposes those requirements through `get*Requirements` methods rather than reimplementing allowance or authorization logic.

For ERC-4337 accounts you can choose to batch the returned requirement transactions with the final transaction using your account-level flow. For EOA accounts, send requirements before the final operation.

Morpho SDK enforces a builder/executor invariant for bundled actions. For that reason, `onBehalfOf` and vault/collateral withdrawal `to` must equal the connected wallet address in this WDK adapter.
