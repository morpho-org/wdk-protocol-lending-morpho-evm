# Audit Results & Remediation Plan: wdk-protocol-lending-morpho-evm

Date: 2026-04-28

## Scope

This audit reviewed the `@tetherto/wdk-protocol-lending-morpho-evm` package implementation, tests, generated types, README, package metadata, and installed dependency API surfaces.

Primary focus areas:

- Correct use of `@morpho-org/morpho-sdk`.
- Correct interaction with Morpho Blue and Morpho Vault V2 SDK entities.
- Compatibility with the required WDK wallet packages.
- Public API, generated types, and package readiness.

## Mandatory Packages Reviewed

The package currently depends on:

```json
{
  "@morpho-org/blue-sdk": "^5.23.0",
  "@morpho-org/blue-sdk-viem": "^4.6.3",
  "@morpho-org/morpho-sdk": "^1.0.1",
  "@tetherto/wdk-wallet": "^1.0.0-beta.1",
  "@tetherto/wdk-wallet-evm": "^1.0.0-beta.2",
  "@tetherto/wdk-wallet-evm-erc-4337": "^1.0.0-beta.1",
  "bare-node-runtime": "^1.1.4",
  "ethers": "6.14.3",
  "viem": "^2.48.1"
}
```

Installed `@morpho-org/morpho-sdk` version: `1.0.1`.

Latest npm version checked during audit: `1.0.1`.

## Verification Run

The following checks were run from the package root:

```bash
npm test -- --runInBand
npm run check:vault-v2
npm run lint
npm run build:types
npm pack --dry-run
npm view @morpho-org/morpho-sdk version
```

Results:

- Tests passed: `25/25`.
- Vault V2 guard passed.
- Lint passed.
- Type declaration generation passed.
- Dry-run package contents include `index.js`, `bare.js`, `src/`, `scripts/`, `types/`, `LICENSE`, and `README.md`.
- `@morpho-org/morpho-sdk@1.0.1` is currently the latest published version.

## Summary

The core Morpho SDK integration is directionally correct. The adapter delegates transaction construction to `@morpho-org/morpho-sdk` for vault deposits, vault withdrawals, market collateral supply, market collateral withdrawal, borrows, and repayments.

The implementation uses the expected SDK entities and actions:

- `new MorphoClient(viemClient, options)`.
- `client.vaultV2(address, chainId)`.
- `client.marketV1(marketParams, chainId)`.
- `vault.entity.deposit(...).getRequirements()`.
- `vault.entity.deposit(...).buildTx(requirementSignature)`.
- `vault.entity.withdraw(...).buildTx()`.
- `market.entity.supplyCollateral(...).getRequirements()`.
- `market.entity.supplyCollateral(...).buildTx(requirementSignature)`.
- `market.entity.borrow(...).getRequirements()`.
- `market.entity.borrow(...).buildTx()`.
- `market.entity.repay(...).getRequirements()`.
- `market.entity.repay(...).buildTx(requirementSignature)`.
- `market.entity.withdrawCollateral(...).buildTx()`.

The adapter also correctly uses `@morpho-org/blue-sdk-viem` to fetch market params when only a market id is configured.

Morpho vault support is intentionally Vault V2-only. `earnVaultVersion: 'v1'` is rejected, built-in earn presets are V2-only, and `npm run check:vault-v2` guards against reintroducing Vault V1 examples or client usage.

The main readiness gaps are around exported TypeScript types, native deposit support, requirement-signature documentation, and advanced SDK feature coverage.

## Findings

### 1. Type/runtime mismatch for `repay({ amount: 'max' })`

Severity: High

The runtime supports:

```js
await morpho.repay({ token, amount: 'max' })
```

Internally, this maps to repayment by borrow shares:

```js
const repayAmount = amount === 'max'
  ? { shares: positionData.borrowShares }
  : { assets: normalizeAmount(amount) }
```

However, the generated declaration intersects the base WDK `RepayOptions` type with `{ amount: bigint | 'max' }`. Since `RepayOptions.amount` is `number | bigint`, TypeScript consumers may not be able to pass `'max'` even though it is supported at runtime.

Impact:

- Runtime behavior and public types diverge.
- TypeScript consumers may see a false compile error for a documented feature.
- Integrators may avoid the safer full-repay-by-shares path.

Remediation:

- Define a local Morpho-specific repay option type that omits the base `amount` field before redefining it.
- Example shape:

```ts
type MorphoRepayOptions = Omit<RepayOptions, 'amount'> & {
  amount: bigint | number | 'max'
  requirementSignature?: RequirementSignature
  slippageTolerance?: bigint
}
```

### 2. Type/runtime mismatch for native-only deposits

Severity: Medium

The Morpho SDK `DepositAmountArgs` supports:

- ERC-20 amount only.
- Native amount only.
- Mixed ERC-20 plus native amount.

The WDK base `SupplyOptions` requires `amount`, and the adapter currently normalizes `amount` before calling SDK deposit or supply-collateral methods. This means native-only SDK deposits are not practically exposed, despite the adapter accepting `nativeAmount` in JSDoc.

Impact:

- The adapter advertises `nativeAmount`, but does not fully model Morpho SDK native deposit semantics.
- WETH/wNative flows may require awkward or invalid parameters.

Remediation:

- Define local Morpho supply/collateral option types with SDK-compatible deposit amount semantics.
- Update runtime validation to allow `nativeAmount` without `amount` where the SDK allows it.
- Validate total supplied value is greater than zero.

### 3. Preset chain IDs are enforced

Severity: Remediated

Preset entries include `chainId: 1`, and the adapter now checks that the connected wallet provider is on the same chain before using preset addresses or market ids.

Impact:

- A caller selecting an Ethereum mainnet preset while connected to another EVM chain now gets a clear error before SDK fetches or transaction construction.

Implemented:

- Preset `chainId` is enforced during vault and market action construction, after reading the provider chain id.
- Wrong-chain earn and borrow preset tests are covered.

### 4. Requirement APIs expose SDK requirement options

Severity: Remediated

The SDK `getRequirements()` methods can accept options such as:

```ts
{ useSimplePermit?: boolean }
```

The adapter now accepts an optional second parameter and passes it to SDK requirement builders where supported.

Impact:

- Integrators can choose between supported permit flows through the WDK adapter for supply, repay, and supply-collateral requirement methods.

Implemented:

- Added an optional second parameter to requirement methods:

```js
getSupplyRequirements(options, requirementOptions)
getRepayRequirements(options, requirementOptions)
getSupplyCollateralRequirements(options, requirementOptions)
```

- `requirementOptions` is passed through to SDK `action.getRequirements(requirementOptions)` where supported.
- `getBorrowRequirements()` remains unchanged because borrow authorization requirements do not currently need those options.

### 5. Requirement-signature flow needs clearer documentation

Severity: Medium

The adapter exposes `get*Requirements()` and accepts `requirementSignature` on final action methods. This matches SDK behavior, but the README does not fully explain the required flow for permit or permit2 requirements.

Expected flow:

1. Call `get*Requirements()`.
2. If a returned requirement requires a signature, obtain it with the SDK-provided signing action.
3. Pass the resulting `requirementSignature` to the final method.
4. Build/send the final transaction.

Impact:

- Integrators may call `get*Requirements()` and still send final transactions without required signatures.
- Permit-based flows may fail or be underused.

Remediation:

- Document the requirement transaction and signature paths separately.
- Include a short example showing `requirementSignature` passed to `supply`, `repay`, or `supplyCollateral`.

### 6. Advanced Morpho SDK capabilities are not surfaced

Severity: Low to Medium

The adapter covers core actions but does not currently expose several SDK-backed flows:

- `market.entity.supplyCollateralBorrow(...)`.
- `market.entity.repayWithdrawCollateral(...)`.
- `market.entity.getReallocationData(...)`.
- `market.entity.getReallocations(...)`.
- `vaultV2.entity.forceWithdraw(...)`.
- `vaultV2.entity.forceRedeem(...)`.
- Vault redeem-by-shares.

Impact:

- The adapter is useful for basic lending and vault flows, but does not expose the full Morpho SDK feature set.
- Some safer atomic flows are unavailable through this package.

Remediation:

- Decide explicitly whether these flows are in scope for the package.
- If in scope, prioritize:
  - `supplyCollateralBorrow` for atomic collateral supply plus borrow.
  - `repayWithdrawCollateral` for atomic debt reduction plus collateral withdrawal.
  - Reallocation helpers for borrow liquidity.
  - Vault redeem-by-shares and Vault V2 force withdrawal/redeem for withdrawal edge cases.

### 7. Tests mock the SDK action contracts but do not perform a real SDK smoke build

Severity: Medium

Current tests validate adapter wiring with mocked SDK entities. This is useful and should remain. However, there is no test that exercises real SDK transaction construction against live or forked read data.

Impact:

- SDK API drift may not be caught if mocks continue matching the adapter but the real SDK changes behavior.
- Transaction data compatibility is not verified end to end.

Remediation:

- Add a smoke test that uses a read-only public RPC or local fork to:
  - Resolve a preset vault.
  - Resolve a configured market id.
  - Build at least one real SDK transaction object.
- Keep it isolated from default unit tests if network access should not be mandatory.

### 8. Generated declaration quality should be improved

Severity: Medium

Generated declarations are present and included in the dry-run package, but some public return types are broad, especially requirement methods returning `Promise<any[]>`.

Impact:

- Integrators lose type information for approval, authorization, and signature requirement handling.
- It is harder to build robust wallet flows on top of returned SDK requirements.

Remediation:

- Import and expose SDK requirement and transaction types in local type aliases.
- Replace `Promise<any[]>` with SDK-derived requirement return types where practical.

## Positive Observations

- `@morpho-org/morpho-sdk` is used as the transaction builder instead of manually encoding Morpho calls.
- The adapter fetches accrued vault data before deposits, which allows SDK slippage guards to be computed correctly.
- The adapter fetches market position data before borrow, repay, and withdraw-collateral actions, matching SDK validation expectations.
- Morpho vault support is constrained to Vault V2 only, with tests and a guard command covering that policy.
- Preset chain IDs are enforced before using preset vaults or markets.
- Requirement option passthrough is available for supply, repay, and supply-collateral approval/signature requirements.
- `supportSignature`, `supportDeployless`, and SDK `metadata` are passed into `MorphoClient`.
- ERC-4337 transaction sending and quoting paths pass account-specific config through where applicable.
- Read-only accounts are blocked from write methods.
- Token mismatch checks are performed before building transactions.
- Local tests, linting, type generation, and package dry-run pass.

## Recommended Remediation Order

1. Fix public TypeScript option types for `repay({ amount: 'max' })` and native deposit support.
2. Expand README requirement-signature guidance.
3. Add a package-consumer TypeScript compile test.
4. Add a real SDK smoke-build test against a public RPC or fork.
5. Decide which advanced SDK flows should become public adapter methods.

## Release Readiness Assessment

The adapter is suitable as a beta integration for basic Morpho vault and market flows.

It should not be considered fully release-ready until:

- Public types match runtime behavior.
- Requirement signature flows are clearly documented and configurable.
- At least one non-mocked SDK smoke test exists.

## Foulques Review Response

Date: 2026-04-29

### 1. Requirement methods return `Promise<any[]>`

Foulques found that generated declaration files exposed broad `Promise<any[]>` return types for `get*Requirements()` methods.

Answer: implement. Requirements now use exported SDK-backed aliases:

- `RequirementApproval` for ERC-20 approval transactions.
- `RequirementAuthorization` for Morpho `setAuthorization` transactions.
- `RequirementSignatureRequest` for signable permit/permit2 requests.

The important distinction is that `RequirementSignature` is the signed output passed later to `buildTx()` through `supply`, `repay`, or `supplyCollateral`; it is not itself the raw return type of `getRequirements()`.

### 2. `_options` is stored by reference

Foulques found that mutating the constructor options object after initialization could alter adapter behavior.

Answer: implement. The constructor now normalizes, copies, and freezes the internal option object, including nested `presets` and `borrowMarketParams`. The caller-owned object is not frozen directly, because mutating user-owned input as a side effect would be surprising.

### 3. `nativeAmount` is unreachable

Foulques found that native-only supply paths were impossible because the adapter always normalized `amount` and checked ERC-20 balance before calling the SDK.

Answer: implement. Vault deposit and collateral supply now accept SDK-compatible deposit amount semantics: `amount`, `nativeAmount`, or both. ERC-20 balance checks only run when `amount > 0`. The adapter still validates `token` because it must match the configured vault asset or market collateral token.

### 4. E2E test on fork

Foulques asked whether an end-to-end transaction test can run on a fork.

Answer: implement as opt-in. `npm run test:fork` starts Anvil with `MAINNET_RPC_URL`, impersonates a USDT holder, funds the local test wallet, sends returned SDK requirements, and executes a real Morpho Vault V2 deposit against forked mainnet state. The default unit test suite remains mocked and deterministic.

### 5. Chain and market caches never invalidated on wallet switch

Foulques flagged `_chainId`, `_marketParams`, and `_viemClient` persistence across browser-wallet chain switches.

Answer: implement. `_getChainId()` now re-reads the provider chain and invalidates `_viemClient`, `_morphoClient`, and `_marketParams` when the connected chain changes. `_getViemClient()` and `_getMarketParams()` check chain state before reusing caches.

Explicit configs now require `chainId`; presets already carry one. This gives explicit `earnVaultAddress`, `borrowMarketId`, and `borrowMarketParams` flows the same pre-build chain guard as preset flows.

### 6. Borrow requirements and `setAuthorization`

Foulques noted that Bundler3 borrow flows need to know whether the user has authorized GeneralAdapter1 through Morpho `setAuthorization`.

Answer: already covered by the SDK-backed flow. `getBorrowRequirements()` returns the SDK's Morpho authorization transaction when GeneralAdapter1 is not authorized. The implementation keeps this delegated to `@morpho-org/morpho-sdk` rather than duplicating authorization checks in the WDK adapter.
