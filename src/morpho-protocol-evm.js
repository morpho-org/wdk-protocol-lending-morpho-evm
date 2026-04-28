// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { MarketParams } from '@morpho-org/blue-sdk'
import { fetchMarket } from '@morpho-org/blue-sdk-viem'
import { MorphoClient } from '@morpho-org/morpho-sdk'
import { LendingProtocol } from '@tetherto/wdk-wallet/protocols'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { WalletAccountEvmErc4337, WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import {
  createClient,
  custom,
  erc4626Abi,
  http,
  isAddress,
  isAddressEqual,
  publicActions,
  zeroAddress
} from 'viem'
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains'
import { MORPHO_MARKET_PRESETS, MORPHO_VAULT_PRESETS } from './morpho-presets.js'

/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */

/** @typedef {import('@tetherto/wdk-wallet/protocols').BorrowOptions} BorrowOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BorrowResult} BorrowResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SupplyOptions} SupplyOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SupplyResult} SupplyResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').WithdrawOptions} WithdrawOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').WithdrawResult} WithdrawResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').RepayOptions} RepayOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').RepayResult} RepayResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig */
/** @typedef {import('@morpho-org/morpho-sdk').RequirementSignature} RequirementSignature */
/** @typedef {import('@morpho-org/morpho-sdk').VaultReallocation} VaultReallocation */

/**
 * @typedef {Object} VaultPosition
 * @property {bigint} shares - The account's vault share balance.
 * @property {bigint} assets - The account's vault position converted to underlying assets using current vault data.
 * @property {string} vaultAddress - The configured vault address.
 * @property {'v2'} vaultVersion - The configured vault version.
 */

/**
 * @typedef {Object} MarketPosition
 * @property {bigint} supplyShares - The account's Morpho market supply shares.
 * @property {bigint} borrowShares - The account's Morpho market borrow shares.
 * @property {bigint} borrowAssets - The account's current borrow assets after accrual.
 * @property {bigint} collateral - The account's collateral supplied to the market.
 * @property {string} marketId - The configured market id.
 */

/**
 * @typedef {Object} AccountData
 * @property {bigint} vaultShares - The account's configured vault share balance.
 * @property {bigint} vaultAssets - The account's configured vault balance in underlying assets.
 * @property {bigint} marketSupplyShares - The account's configured market supply shares.
 * @property {bigint} marketBorrowShares - The account's configured market borrow shares.
 * @property {bigint} marketBorrowAssets - The account's configured market borrow assets.
 * @property {bigint} collateral - The account's configured market collateral.
 * @property {string} vaultAddress - The configured vault address.
 * @property {'v2'} vaultVersion - The configured vault version.
 * @property {string} marketId - The configured market id.
 */

/**
 * @typedef {Object} MorphoProtocolOptions
 * @property {string} [earnVaultAddress] - Explicit Morpho vault address. Takes priority over `presets.earn`.
 * @property {'v2'} [earnVaultVersion='v2'] - Vault version for `earnVaultAddress`. Morpho Vault V1 is not supported.
 * @property {string} [borrowMarketId] - Explicit market id. If `borrowMarketParams` is not provided, params are fetched on-chain.
 * @property {Object} [borrowMarketParams] - Explicit Morpho Blue market params. Takes priority over `borrowMarketId` and `presets.borrow`.
 * @property {{ earn?: string, borrow?: string }} [presets] - Curated target names for Ethereum USDT earn/borrow.
 * @property {bigint} [slippageTolerance] - Optional Morpho SDK slippage tolerance in WAD precision.
 * @property {boolean} [supportSignature=false] - Enable Morpho SDK permit/permit2 requirements.
 * @property {boolean} [supportDeployless=false] - Enable Morpho SDK deployless reads.
 */

const SUPPORTED_CHAINS = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [polygon.id]: polygon
}

function isNonZeroAddress (address) {
  return isAddress(address) && !isAddressEqual(address, zeroAddress)
}

function isMarketId (value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value)
}

function normalizeAmount (amount, field = 'amount') {
  if (typeof amount !== 'bigint' && typeof amount !== 'number') {
    throw new Error(`'${field}' should be greater than zero.`)
  }

  if (amount <= 0) {
    throw new Error(`'${field}' should be greater than zero.`)
  }

  return BigInt(amount)
}

function toWdkTransaction (tx) {
  return {
    to: tx.to,
    value: tx.value ?? 0n,
    data: tx.data
  }
}

export default class MorphoProtocolEvm extends LendingProtocol {
  /**
   * Creates a new read-only interface to the Morpho protocol for EVM blockchains.
   *
   * @overload
   * @param {WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {MorphoProtocolOptions} [options] - The Morpho target configuration.
   */

  /**
   * Creates a new interface to the Morpho protocol for EVM blockchains.
   *
   * @overload
   * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {MorphoProtocolOptions} [options] - The Morpho target configuration.
   */
  constructor (account, options = {}) {
    super(account)

    const { provider } = account._config || {}

    if (!provider) {
      throw new Error('The wallet account must have a provider configured.')
    }

    /** @private */
    this._options = options

    /** @private */
    this._providerSource = provider

    /** @private */
    this._provider = typeof provider === 'string'
      ? new JsonRpcProvider(provider)
      : new BrowserProvider(provider)

    /** @private */
    this._chainId = undefined

    /** @private */
    this._viemClient = undefined

    /** @private */
    this._viemClientAccount = undefined

    /** @private */
    this._morphoClient = undefined

    /** @private */
    this._marketParams = undefined

    this._validateOptions(options)
  }

  /**
   * Supplies assets into the configured Morpho vault.
   *
   * The transaction is built by `@morpho-org/morpho-sdk`. Use
   * `getSupplyRequirements(options)` first if the account has not approved the
   * required Morpho bundler spender.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The supply options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<SupplyResult>} The supply result.
   */
  async supply (options, config) {
    this._assertWritable('supply(options)')
    await this._assertTokenBalance(options.token, normalizeAmount(options.amount))

    const tx = await this._getSupplyTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Returns Morpho SDK requirements for a vault deposit.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint, slippageTolerance?: bigint }} options - The supply options.
   * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
   * @returns {Promise<Array>} Approval/signature requirements.
   */
  async getSupplyRequirements (options, requirementOptions) {
    const action = await this._getSupplyAction(options)

    return await action.getRequirements(requirementOptions)
  }

  /**
   * Quotes the cost of a vault deposit transaction.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The supply options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<SupplyResult, 'hash'>>} The fee quote.
   */
  async quoteSupply (options, config) {
    const tx = await this._getSupplyTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getSupplyAction ({ token, amount, nativeAmount, onBehalfOf, slippageTolerance }) {
    amount = normalizeAmount(amount)
    this._assertAddress('token', token)
    this._assertOptionalAddress('onBehalfOf', onBehalfOf)

    const userAddress = await this._getSdkUserAddress(onBehalfOf)
    const vault = await this._getVault()
    const accrualVault = await vault.entity.getData()

    if (!isAddressEqual(accrualVault.asset, token)) {
      throw new Error(`Token '${token}' does not match configured vault asset '${accrualVault.asset}'.`)
    }

    return vault.entity.deposit({
      amount,
      nativeAmount,
      userAddress,
      accrualVault,
      slippageTolerance: slippageTolerance ?? this._options.slippageTolerance
    })
  }

  /** @private */
  async _getSupplyTransaction (options) {
    const action = await this._getSupplyAction(options)

    return toWdkTransaction(action.buildTx(options.requirementSignature))
  }

  /**
   * Withdraws assets from the configured Morpho vault.
   *
   * @param {WithdrawOptions} options - The withdraw options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<WithdrawResult>} The withdraw result.
   */
  async withdraw (options, config) {
    this._assertWritable('withdraw(options)')

    const tx = await this._getWithdrawTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Quotes the cost of a vault withdraw transaction.
   *
   * @param {WithdrawOptions} options - The withdraw options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<WithdrawResult, 'hash'>>} The fee quote.
   */
  async quoteWithdraw (options, config) {
    const tx = await this._getWithdrawTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getWithdrawTransaction ({ token, amount, to }) {
    amount = normalizeAmount(amount)
    this._assertAddress('token', token)
    this._assertOptionalAddress('to', to)

    const userAddress = await this._account.getAddress()
    if (to !== undefined && !isAddressEqual(to, userAddress)) {
      throw new Error("'to' must equal the wallet account address for Morpho vault withdrawals.")
    }

    const vault = await this._getVault()
    const accrualVault = await vault.entity.getData()

    if (!isAddressEqual(accrualVault.asset, token)) {
      throw new Error(`Token '${token}' does not match configured vault asset '${accrualVault.asset}'.`)
    }

    return toWdkTransaction(vault.entity.withdraw({
      amount,
      userAddress
    }).buildTx())
  }

  /**
   * Borrows assets from the configured Morpho Blue market.
   *
   * Use `getBorrowRequirements(options)` first if GeneralAdapter1 has not been
   * authorized on Morpho for this account.
   *
   * @param {BorrowOptions & { reallocations?: readonly VaultReallocation[], slippageTolerance?: bigint }} options - The borrow options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<BorrowResult>} The borrow result.
   */
  async borrow (options, config) {
    this._assertWritable('borrow(options)')

    const tx = await this._getBorrowTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Returns Morpho SDK requirements for a borrow.
   *
   * @param {BorrowOptions & { reallocations?: readonly VaultReallocation[], slippageTolerance?: bigint }} options - The borrow options.
   * @returns {Promise<Array>} Authorization requirements.
   */
  async getBorrowRequirements (options) {
    const action = await this._getBorrowAction(options)

    return await action.getRequirements()
  }

  /**
   * Quotes the cost of a borrow transaction.
   *
   * @param {BorrowOptions & { reallocations?: readonly VaultReallocation[], slippageTolerance?: bigint }} options - The borrow options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<BorrowResult, 'hash'>>} The fee quote.
   */
  async quoteBorrow (options, config) {
    const tx = await this._getBorrowTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getBorrowAction ({ token, amount, onBehalfOf, slippageTolerance, reallocations }) {
    amount = normalizeAmount(amount)
    this._assertAddress('token', token)
    this._assertOptionalAddress('onBehalfOf', onBehalfOf)

    const userAddress = await this._getSdkUserAddress(onBehalfOf)
    const market = await this._getMarket()

    if (!isAddressEqual(market.params.loanToken, token)) {
      throw new Error(`Token '${token}' does not match configured market loan token '${market.params.loanToken}'.`)
    }

    const positionData = await market.entity.getPositionData(userAddress)

    return market.entity.borrow({
      amount,
      userAddress,
      positionData,
      slippageTolerance: slippageTolerance ?? this._options.slippageTolerance,
      reallocations
    })
  }

  /** @private */
  async _getBorrowTransaction (options) {
    const action = await this._getBorrowAction(options)

    return toWdkTransaction(action.buildTx())
  }

  /**
   * Repays assets to the configured Morpho Blue market.
   *
   * Pass `amount: 'max'` to repay all current borrow shares.
   *
   * @param {RepayOptions & { amount: bigint | 'max', requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The repay options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<RepayResult>} The repay result.
   */
  async repay (options, config) {
    this._assertWritable('repay(options)')

    if (options.amount !== 'max') {
      await this._assertTokenBalance(options.token, normalizeAmount(options.amount))
    }

    const tx = await this._getRepayTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Returns Morpho SDK requirements for a repay.
   *
   * @param {RepayOptions & { amount: bigint | 'max', slippageTolerance?: bigint }} options - The repay options.
   * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
   * @returns {Promise<Array>} Approval/signature requirements.
   */
  async getRepayRequirements (options, requirementOptions) {
    const action = await this._getRepayAction(options)

    return await action.getRequirements(requirementOptions)
  }

  /**
   * Quotes the cost of a repay transaction.
   *
   * @param {RepayOptions & { amount: bigint | 'max', requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The repay options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<RepayResult, 'hash'>>} The fee quote.
   */
  async quoteRepay (options, config) {
    const tx = await this._getRepayTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getRepayAction ({ token, amount, onBehalfOf, slippageTolerance }) {
    this._assertAddress('token', token)
    this._assertOptionalAddress('onBehalfOf', onBehalfOf)

    const userAddress = await this._getSdkUserAddress(onBehalfOf)
    const market = await this._getMarket()

    if (!isAddressEqual(market.params.loanToken, token)) {
      throw new Error(`Token '${token}' does not match configured market loan token '${market.params.loanToken}'.`)
    }

    const positionData = await market.entity.getPositionData(userAddress)
    const repayAmount = amount === 'max'
      ? { shares: positionData.borrowShares }
      : { assets: normalizeAmount(amount) }

    return market.entity.repay({
      ...repayAmount,
      userAddress,
      positionData,
      slippageTolerance: slippageTolerance ?? this._options.slippageTolerance
    })
  }

  /** @private */
  async _getRepayTransaction (options) {
    const action = await this._getRepayAction(options)

    return toWdkTransaction(action.buildTx(options.requirementSignature))
  }

  /**
   * Supplies collateral to the configured Morpho Blue market.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature }} options - The collateral supply options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<SupplyResult>} The supply collateral result.
   */
  async supplyCollateral (options, config) {
    this._assertWritable('supplyCollateral(options)')
    await this._assertTokenBalance(options.token, normalizeAmount(options.amount))

    const tx = await this._getSupplyCollateralTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Returns Morpho SDK requirements for supplying collateral.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint }} options - The collateral supply options.
   * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
   * @returns {Promise<Array>} Approval/signature requirements.
   */
  async getSupplyCollateralRequirements (options, requirementOptions) {
    const action = await this._getSupplyCollateralAction(options)

    return await action.getRequirements(requirementOptions)
  }

  /**
   * Quotes the cost of supplying collateral.
   *
   * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature }} options - The collateral supply options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<SupplyResult, 'hash'>>} The fee quote.
   */
  async quoteSupplyCollateral (options, config) {
    const tx = await this._getSupplyCollateralTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getSupplyCollateralAction ({ token, amount, nativeAmount, onBehalfOf }) {
    amount = normalizeAmount(amount)
    this._assertAddress('token', token)
    this._assertOptionalAddress('onBehalfOf', onBehalfOf)

    const userAddress = await this._getSdkUserAddress(onBehalfOf)
    const market = await this._getMarket()

    if (!isAddressEqual(market.params.collateralToken, token)) {
      throw new Error(`Token '${token}' does not match configured market collateral token '${market.params.collateralToken}'.`)
    }

    return market.entity.supplyCollateral({
      amount,
      nativeAmount,
      userAddress
    })
  }

  /** @private */
  async _getSupplyCollateralTransaction (options) {
    const action = await this._getSupplyCollateralAction(options)

    return toWdkTransaction(action.buildTx(options.requirementSignature))
  }

  /**
   * Withdraws collateral from the configured Morpho Blue market.
   *
   * @param {WithdrawOptions} options - The collateral withdraw options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<WithdrawResult>} The withdraw collateral result.
   */
  async withdrawCollateral (options, config) {
    this._assertWritable('withdrawCollateral(options)')

    const tx = await this._getWithdrawCollateralTransaction(options)

    return await this._sendTransaction(tx, config)
  }

  /**
   * Quotes the cost of withdrawing collateral.
   *
   * @param {WithdrawOptions} options - The collateral withdraw options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
   * @returns {Promise<Omit<WithdrawResult, 'hash'>>} The fee quote.
   */
  async quoteWithdrawCollateral (options, config) {
    const tx = await this._getWithdrawCollateralTransaction(options)

    return await this._quoteTransaction(tx, config)
  }

  /** @private */
  async _getWithdrawCollateralTransaction ({ token, amount, to }) {
    amount = normalizeAmount(amount)
    this._assertAddress('token', token)
    this._assertOptionalAddress('to', to)

    const userAddress = await this._account.getAddress()
    const market = await this._getMarket()

    if (!isAddressEqual(market.params.collateralToken, token)) {
      throw new Error(`Token '${token}' does not match configured market collateral token '${market.params.collateralToken}'.`)
    }

    if (to !== undefined && !isAddressEqual(to, userAddress)) {
      throw new Error("'to' must equal the wallet account address for Morpho collateral withdrawals.")
    }

    const positionData = await market.entity.getPositionData(userAddress)

    return toWdkTransaction(market.entity.withdrawCollateral({
      amount,
      userAddress,
      positionData
    }).buildTx())
  }

  /**
   * Returns this or another account's configured vault position.
   *
   * @param {string} [account] - If set, returns the vault position for the given address.
   * @returns {Promise<VaultPosition>} The vault position.
   */
  async getVaultPosition (account) {
    this._assertOptionalAddress('account', account)

    const userAddress = account || await this._account.getAddress()
    const vault = await this._getVault()
    const data = await vault.entity.getData()
    const client = await this._getViemClient()
    const shares = await client.readContract({
      address: vault.address,
      abi: erc4626Abi,
      functionName: 'balanceOf',
      args: [userAddress]
    })

    return {
      shares,
      assets: data.toAssets(shares),
      vaultAddress: vault.address,
      vaultVersion: vault.version
    }
  }

  /**
   * Returns this or another account's configured market position.
   *
   * @param {string} [account] - If set, returns the market position for the given address.
   * @returns {Promise<MarketPosition>} The market position.
   */
  async getMarketPosition (account) {
    this._assertOptionalAddress('account', account)

    const userAddress = account || await this._account.getAddress()
    const market = await this._getMarket()
    const position = await market.entity.getPositionData(userAddress)

    return {
      supplyShares: position.supplyShares,
      borrowShares: position.borrowShares,
      borrowAssets: position.borrowAssets,
      collateral: position.collateral,
      marketId: market.params.id
    }
  }

  /**
   * Returns this or another account's configured vault and market data.
   *
   * @param {string} [account] - If set, returns the data for the given address.
   * @returns {Promise<AccountData>} The account data.
   */
  async getAccountData (account) {
    const [vault, market] = await Promise.all([
      this.getVaultPosition(account),
      this.getMarketPosition(account)
    ])

    return {
      vaultShares: vault.shares,
      vaultAssets: vault.assets,
      marketSupplyShares: market.supplyShares,
      marketBorrowShares: market.borrowShares,
      marketBorrowAssets: market.borrowAssets,
      collateral: market.collateral,
      vaultAddress: vault.vaultAddress,
      vaultVersion: vault.vaultVersion,
      marketId: market.marketId
    }
  }

  /**
   * Returns the configured vault address.
   *
   * @returns {string} The configured vault address.
   */
  getVaultAddress () {
    return this._resolveVaultTarget().address
  }

  /**
   * Returns the configured borrow market id, if one is available without an on-chain fetch.
   *
   * @returns {string} The configured market id.
   */
  getBorrowMarketId () {
    const target = this._resolveMarketTarget()

    if (target.marketParams) {
      return new MarketParams(target.marketParams).id
    }

    return target.marketId
  }

  /** @private */
  async _getVault () {
    const target = this._resolveVaultTarget()
    const { address, version } = target
    const client = await this._getMorphoClient()
    const chainId = await this._getChainId()
    this._assertTargetChain(target, chainId, 'Morpho earn preset')
    const entity = client.vaultV2(address, chainId)

    return { address, version, entity }
  }

  /** @private */
  async _getMarket () {
    const client = await this._getMorphoClient()
    const chainId = await this._getChainId()
    const params = await this._getMarketParams()

    return {
      params,
      entity: client.marketV1(params, chainId)
    }
  }

  /** @private */
  async _getMarketParams () {
    if (this._marketParams) return this._marketParams

    const target = this._resolveMarketTarget()

    if (target.marketParams) {
      this._marketParams = target.marketParams instanceof MarketParams
        ? target.marketParams
        : new MarketParams(target.marketParams)
      return this._marketParams
    }

    const client = await this._getViemClient()
    const chainId = await this._getChainId()
    this._assertTargetChain(target, chainId, 'Morpho borrow preset')
    const market = await fetchMarket(target.marketId, client, {
      chainId,
      deployless: this._options.supportDeployless
    })

    this._marketParams = market.params instanceof MarketParams
      ? market.params
      : new MarketParams(market.params)

    return this._marketParams
  }

  /** @private */
  async _getMorphoClient () {
    const viemClient = await this._getViemClient()

    if (!this._morphoClient) {
      this._morphoClient = new MorphoClient(viemClient, {
        supportSignature: this._options.supportSignature ?? false,
        supportDeployless: this._options.supportDeployless,
        metadata: this._options.metadata
      })
    }

    return this._morphoClient
  }

  /** @private */
  async _getViemClient () {
    const address = await this._account.getAddress()

    if (this._viemClient && this._viemClientAccount && isAddressEqual(this._viemClientAccount, address)) {
      return this._viemClient
    }

    const chainId = await this._getChainId()
    const chain = SUPPORTED_CHAINS[chainId] || {
      id: chainId,
      name: `Chain ${chainId}`,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: typeof this._providerSource === 'string' ? [this._providerSource] : [] } }
    }
    const transport = typeof this._providerSource === 'string'
      ? http(this._providerSource)
      : custom(this._providerSource)

    this._viemClient = createClient({
      account: address,
      chain,
      transport
    }).extend(publicActions)
    this._viemClientAccount = address
    this._morphoClient = undefined

    return this._viemClient
  }

  /** @private */
  async _getChainId () {
    if (this._chainId === undefined) {
      const { chainId } = await this._provider.getNetwork()
      this._chainId = Number(chainId)
    }

    return this._chainId
  }

  /** @private */
  _resolveVaultTarget () {
    let target

    if (this._options.earnVaultAddress) {
      target = {
        address: this._options.earnVaultAddress,
        version: this._options.earnVaultVersion || 'v2'
      }
    } else if (this._options.presets?.earn) {
      target = MORPHO_VAULT_PRESETS[this._options.presets.earn]
    }

    if (!target) {
      throw new Error('No Morpho earn vault configured. Set earnVaultAddress or presets.earn.')
    }

    return target
  }

  /** @private */
  _resolveMarketTarget () {
    if (this._options.borrowMarketParams) {
      return { marketParams: this._options.borrowMarketParams }
    }

    if (this._options.borrowMarketId) {
      return { marketId: this._options.borrowMarketId }
    }

    if (this._options.presets?.borrow) {
      const preset = MORPHO_MARKET_PRESETS[this._options.presets.borrow]
      if (preset) return { marketId: preset.marketId, chainId: preset.chainId }
    }

    throw new Error('No Morpho borrow market configured. Set borrowMarketParams, borrowMarketId, or presets.borrow.')
  }

  /** @private */
  _assertTargetChain (target, chainId, label) {
    if (target.chainId !== undefined && target.chainId !== chainId) {
      throw new Error(`${label} is configured for chain ${target.chainId}, but the connected provider is on chain ${chainId}.`)
    }
  }

  /** @private */
  _validateOptions (options) {
    if (options.earnVaultAddress !== undefined && !isAddress(options.earnVaultAddress)) {
      throw new Error("'earnVaultAddress' must be a valid address.")
    }

    if (options.earnVaultVersion !== undefined && options.earnVaultVersion !== 'v2') {
      throw new Error("'earnVaultVersion' must be 'v2'. Morpho Vault V1 is not supported by this WDK module.")
    }

    if (options.borrowMarketId !== undefined && !isMarketId(options.borrowMarketId)) {
      throw new Error("'borrowMarketId' must be a 66-character hex string.")
    }

    if (options.presets?.earn !== undefined && !MORPHO_VAULT_PRESETS[options.presets.earn]) {
      throw new Error(`Unknown Morpho earn preset '${options.presets.earn}'.`)
    }

    if (options.presets?.borrow !== undefined && !MORPHO_MARKET_PRESETS[options.presets.borrow]) {
      throw new Error(`Unknown Morpho borrow preset '${options.presets.borrow}'.`)
    }

    if (options.slippageTolerance !== undefined && (typeof options.slippageTolerance !== 'bigint' || options.slippageTolerance < 0n)) {
      throw new Error("'slippageTolerance' must be a non-negative bigint.")
    }
  }

  /** @private */
  _assertWritable (method) {
    if (!(this._account instanceof WalletAccountEvm || this._account instanceof WalletAccountEvmErc4337)) {
      throw new Error(`The '${method}' method requires the protocol to be initialized with a non read-only account.`)
    }
  }

  /** @private */
  _assertAddress (field, value) {
    if (!isAddress(value)) {
      throw new Error(`'${field}' must be a valid address.`)
    }
  }

  /** @private */
  _assertOptionalAddress (field, value) {
    if (value !== undefined && !isNonZeroAddress(value)) {
      throw new Error(`'${field}' must be a valid address (not zero address).`)
    }
  }

  /** @private */
  async _getSdkUserAddress (onBehalfOf) {
    const address = await this._account.getAddress()

    if (onBehalfOf !== undefined && !isAddressEqual(onBehalfOf, address)) {
      throw new Error("'onBehalfOf' must equal the wallet account address for Morpho SDK-backed operations.")
    }

    return address
  }

  /** @private */
  async _assertTokenBalance (token, amount) {
    this._assertAddress('token', token)
    const balance = await this._account.getTokenBalance(token)

    if (balance < amount) {
      throw new Error('Not enough funds to fulfill the operation.')
    }
  }

  /** @private */
  async _sendTransaction (tx, config) {
    return this._account instanceof WalletAccountEvmErc4337
      ? await this._account.sendTransaction(tx, config)
      : await this._account.sendTransaction(tx)
  }

  /** @private */
  async _quoteTransaction (tx, config) {
    const { fee } = this._account instanceof WalletAccountReadOnlyEvmErc4337
      ? await this._account.quoteSendTransaction(tx, config)
      : await this._account.quoteSendTransaction(tx)

    return { fee }
  }
}
