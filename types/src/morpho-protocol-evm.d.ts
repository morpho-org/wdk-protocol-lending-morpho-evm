export default class MorphoProtocolEvm extends LendingProtocol {
    /**
     * Creates a new read-only interface to the Morpho protocol for EVM blockchains.
     *
     * @overload
     * @param {WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337} account - The wallet account to use to interact with the protocol.
     * @param {MorphoProtocolOptions} [options] - The Morpho target configuration.
     */
    constructor(account: WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337, options?: MorphoProtocolOptions);
    /**
     * Creates a new interface to the Morpho protocol for EVM blockchains.
     *
     * @overload
     * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
     * @param {MorphoProtocolOptions} [options] - The Morpho target configuration.
     */
    constructor(account: WalletAccountEvm | WalletAccountEvmErc4337, options?: MorphoProtocolOptions);
    /** @private */
    private _options;
    /** @private */
    private _providerSource;
    /** @private */
    private _provider;
    /** @private */
    private _chainId;
    /** @private */
    private _viemClient;
    /** @private */
    private _viemClientAccount;
    /** @private */
    private _morphoClient;
    /** @private */
    private _marketParams;
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
    supply(options: SupplyOptions & {
        nativeAmount?: bigint;
        requirementSignature?: RequirementSignature;
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<SupplyResult>;
    /**
     * Returns Morpho SDK requirements for a vault deposit.
     *
     * @param {SupplyOptions & { nativeAmount?: bigint, slippageTolerance?: bigint }} options - The supply options.
     * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
     * @returns {Promise<Array>} Approval/signature requirements.
     */
    getSupplyRequirements(options: SupplyOptions & {
        nativeAmount?: bigint;
        slippageTolerance?: bigint;
    }, requirementOptions?: any): Promise<any[]>;
    /**
     * Quotes the cost of a vault deposit transaction.
     *
     * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The supply options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<SupplyResult, 'hash'>>} The fee quote.
     */
    quoteSupply(options: SupplyOptions & {
        nativeAmount?: bigint;
        requirementSignature?: RequirementSignature;
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<SupplyResult, "hash">>;
    /** @private */
    private _getSupplyAction;
    /** @private */
    private _getSupplyTransaction;
    /**
     * Withdraws assets from the configured Morpho vault.
     *
     * @param {WithdrawOptions} options - The withdraw options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<WithdrawResult>} The withdraw result.
     */
    withdraw(options: WithdrawOptions, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<WithdrawResult>;
    /**
     * Quotes the cost of a vault withdraw transaction.
     *
     * @param {WithdrawOptions} options - The withdraw options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<WithdrawResult, 'hash'>>} The fee quote.
     */
    quoteWithdraw(options: WithdrawOptions, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<WithdrawResult, "hash">>;
    /** @private */
    private _getWithdrawTransaction;
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
    borrow(options: BorrowOptions & {
        reallocations?: readonly VaultReallocation[];
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<BorrowResult>;
    /**
     * Returns Morpho SDK requirements for a borrow.
     *
     * @param {BorrowOptions & { reallocations?: readonly VaultReallocation[], slippageTolerance?: bigint }} options - The borrow options.
     * @returns {Promise<Array>} Authorization requirements.
     */
    getBorrowRequirements(options: BorrowOptions & {
        reallocations?: readonly VaultReallocation[];
        slippageTolerance?: bigint;
    }): Promise<any[]>;
    /**
     * Quotes the cost of a borrow transaction.
     *
     * @param {BorrowOptions & { reallocations?: readonly VaultReallocation[], slippageTolerance?: bigint }} options - The borrow options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<BorrowResult, 'hash'>>} The fee quote.
     */
    quoteBorrow(options: BorrowOptions & {
        reallocations?: readonly VaultReallocation[];
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<BorrowResult, "hash">>;
    /** @private */
    private _getBorrowAction;
    /** @private */
    private _getBorrowTransaction;
    /**
     * Repays assets to the configured Morpho Blue market.
     *
     * Pass `amount: 'max'` to repay all current borrow shares.
     *
     * @param {RepayOptions & { amount: bigint | 'max', requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The repay options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<RepayResult>} The repay result.
     */
    repay(options: RepayOptions & {
        amount: bigint | "max";
        requirementSignature?: RequirementSignature;
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<RepayResult>;
    /**
     * Returns Morpho SDK requirements for a repay.
     *
     * @param {RepayOptions & { amount: bigint | 'max', slippageTolerance?: bigint }} options - The repay options.
     * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
     * @returns {Promise<Array>} Approval/signature requirements.
     */
    getRepayRequirements(options: RepayOptions & {
        amount: bigint | "max";
        slippageTolerance?: bigint;
    }, requirementOptions?: any): Promise<any[]>;
    /**
     * Quotes the cost of a repay transaction.
     *
     * @param {RepayOptions & { amount: bigint | 'max', requirementSignature?: RequirementSignature, slippageTolerance?: bigint }} options - The repay options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<RepayResult, 'hash'>>} The fee quote.
     */
    quoteRepay(options: RepayOptions & {
        amount: bigint | "max";
        requirementSignature?: RequirementSignature;
        slippageTolerance?: bigint;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<RepayResult, "hash">>;
    /** @private */
    private _getRepayAction;
    /** @private */
    private _getRepayTransaction;
    /**
     * Supplies collateral to the configured Morpho Blue market.
     *
     * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature }} options - The collateral supply options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<SupplyResult>} The supply collateral result.
     */
    supplyCollateral(options: SupplyOptions & {
        nativeAmount?: bigint;
        requirementSignature?: RequirementSignature;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<SupplyResult>;
    /**
     * Returns Morpho SDK requirements for supplying collateral.
     *
     * @param {SupplyOptions & { nativeAmount?: bigint }} options - The collateral supply options.
     * @param {Object} [requirementOptions] - Optional Morpho SDK requirement options.
     * @returns {Promise<Array>} Approval/signature requirements.
     */
    getSupplyCollateralRequirements(options: SupplyOptions & {
        nativeAmount?: bigint;
    }, requirementOptions?: any): Promise<any[]>;
    /**
     * Quotes the cost of supplying collateral.
     *
     * @param {SupplyOptions & { nativeAmount?: bigint, requirementSignature?: RequirementSignature }} options - The collateral supply options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<SupplyResult, 'hash'>>} The fee quote.
     */
    quoteSupplyCollateral(options: SupplyOptions & {
        nativeAmount?: bigint;
        requirementSignature?: RequirementSignature;
    }, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<SupplyResult, "hash">>;
    /** @private */
    private _getSupplyCollateralAction;
    /** @private */
    private _getSupplyCollateralTransaction;
    /**
     * Withdraws collateral from the configured Morpho Blue market.
     *
     * @param {WithdrawOptions} options - The collateral withdraw options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<WithdrawResult>} The withdraw collateral result.
     */
    withdrawCollateral(options: WithdrawOptions, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<WithdrawResult>;
    /**
     * Quotes the cost of withdrawing collateral.
     *
     * @param {WithdrawOptions} options - The collateral withdraw options.
     * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - ERC-4337 paymaster config override.
     * @returns {Promise<Omit<WithdrawResult, 'hash'>>} The fee quote.
     */
    quoteWithdrawCollateral(options: WithdrawOptions, config?: Pick<EvmErc4337WalletConfig, "paymasterToken">): Promise<Omit<WithdrawResult, "hash">>;
    /** @private */
    private _getWithdrawCollateralTransaction;
    /**
     * Returns this or another account's configured vault position.
     *
     * @param {string} [account] - If set, returns the vault position for the given address.
     * @returns {Promise<VaultPosition>} The vault position.
     */
    getVaultPosition(account?: string): Promise<VaultPosition>;
    /**
     * Returns this or another account's configured market position.
     *
     * @param {string} [account] - If set, returns the market position for the given address.
     * @returns {Promise<MarketPosition>} The market position.
     */
    getMarketPosition(account?: string): Promise<MarketPosition>;
    /**
     * Returns this or another account's configured vault and market data.
     *
     * @param {string} [account] - If set, returns the data for the given address.
     * @returns {Promise<AccountData>} The account data.
     */
    getAccountData(account?: string): Promise<AccountData>;
    /**
     * Returns the configured vault address.
     *
     * @returns {string} The configured vault address.
     */
    getVaultAddress(): string;
    /**
     * Returns the configured borrow market id, if one is available without an on-chain fetch.
     *
     * @returns {string} The configured market id.
     */
    getBorrowMarketId(): string;
    /** @private */
    private _getVault;
    /** @private */
    private _getMarket;
    /** @private */
    private _getMarketParams;
    /** @private */
    private _getMorphoClient;
    /** @private */
    private _getViemClient;
    /** @private */
    private _getChainId;
    /** @private */
    private _resolveVaultTarget;
    /** @private */
    private _resolveMarketTarget;
    /** @private */
    private _assertTargetChain;
    /** @private */
    private _validateOptions;
    /** @private */
    private _assertWritable;
    /** @private */
    private _assertAddress;
    /** @private */
    private _assertOptionalAddress;
    /** @private */
    private _getSdkUserAddress;
    /** @private */
    private _assertTokenBalance;
    /** @private */
    private _sendTransaction;
    /** @private */
    private _quoteTransaction;
}
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type BorrowOptions = import("@tetherto/wdk-wallet/protocols").BorrowOptions;
export type BorrowResult = import("@tetherto/wdk-wallet/protocols").BorrowResult;
export type SupplyOptions = import("@tetherto/wdk-wallet/protocols").SupplyOptions;
export type SupplyResult = import("@tetherto/wdk-wallet/protocols").SupplyResult;
export type WithdrawOptions = import("@tetherto/wdk-wallet/protocols").WithdrawOptions;
export type WithdrawResult = import("@tetherto/wdk-wallet/protocols").WithdrawResult;
export type RepayOptions = import("@tetherto/wdk-wallet/protocols").RepayOptions;
export type RepayResult = import("@tetherto/wdk-wallet/protocols").RepayResult;
export type WalletAccountReadOnlyEvm = import("@tetherto/wdk-wallet-evm").WalletAccountReadOnlyEvm;
export type EvmErc4337WalletConfig = import("@tetherto/wdk-wallet-evm-erc-4337").EvmErc4337WalletConfig;
export type RequirementSignature = import("@morpho-org/morpho-sdk").RequirementSignature;
export type VaultReallocation = import("@morpho-org/morpho-sdk").VaultReallocation;
export type VaultPosition = {
    /**
     * - The account's vault share balance.
     */
    shares: bigint;
    /**
     * - The account's vault position converted to underlying assets using current vault data.
     */
    assets: bigint;
    /**
     * - The configured vault address.
     */
    vaultAddress: string;
    /**
     * - The configured vault version.
     */
    vaultVersion: "v2";
};
export type MarketPosition = {
    /**
     * - The account's Morpho market supply shares.
     */
    supplyShares: bigint;
    /**
     * - The account's Morpho market borrow shares.
     */
    borrowShares: bigint;
    /**
     * - The account's current borrow assets after accrual.
     */
    borrowAssets: bigint;
    /**
     * - The account's collateral supplied to the market.
     */
    collateral: bigint;
    /**
     * - The configured market id.
     */
    marketId: string;
};
export type AccountData = {
    /**
     * - The account's configured vault share balance.
     */
    vaultShares: bigint;
    /**
     * - The account's configured vault balance in underlying assets.
     */
    vaultAssets: bigint;
    /**
     * - The account's configured market supply shares.
     */
    marketSupplyShares: bigint;
    /**
     * - The account's configured market borrow shares.
     */
    marketBorrowShares: bigint;
    /**
     * - The account's configured market borrow assets.
     */
    marketBorrowAssets: bigint;
    /**
     * - The account's configured market collateral.
     */
    collateral: bigint;
    /**
     * - The configured vault address.
     */
    vaultAddress: string;
    /**
     * - The configured vault version.
     */
    vaultVersion: "v2";
    /**
     * - The configured market id.
     */
    marketId: string;
};
export type MorphoProtocolOptions = {
    /**
     * - Explicit Morpho vault address. Takes priority over `presets.earn`.
     */
    earnVaultAddress?: string;
    /**
     * - Vault version for `earnVaultAddress`. Morpho Vault V1 is not supported.
     */
    earnVaultVersion?: "v2";
    /**
     * - Explicit market id. If `borrowMarketParams` is not provided, params are fetched on-chain.
     */
    borrowMarketId?: string;
    /**
     * - Explicit Morpho Blue market params. Takes priority over `borrowMarketId` and `presets.borrow`.
     */
    borrowMarketParams?: any;
    /**
     * - Curated target names for Ethereum USDT earn/borrow.
     */
    presets?: {
        earn?: string;
        borrow?: string;
    };
    /**
     * - Optional Morpho SDK slippage tolerance in WAD precision.
     */
    slippageTolerance?: bigint;
    /**
     * - Enable Morpho SDK permit/permit2 requirements.
     */
    supportSignature?: boolean;
    /**
     * - Enable Morpho SDK deployless reads.
     */
    supportDeployless?: boolean;
};
import { LendingProtocol } from '@tetherto/wdk-wallet/protocols';
import { WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { WalletAccountEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
