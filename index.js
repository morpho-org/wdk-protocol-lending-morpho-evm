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

/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */

/** @typedef {import('@tetherto/wdk-wallet/protocols').BorrowOptions} BorrowOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BorrowResult} BorrowResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SupplyOptions} SupplyOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SupplyResult} SupplyResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').WithdrawOptions} WithdrawOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').WithdrawResult} WithdrawResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').RepayOptions} RepayOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').RepayResult} RepayResult */

/** @typedef {import('./src/morpho-protocol-evm.js').AccountData} AccountData */
/** @typedef {import('./src/morpho-protocol-evm.js').VaultPosition} VaultPosition */
/** @typedef {import('./src/morpho-protocol-evm.js').MarketPosition} MarketPosition */
/** @typedef {import('./src/morpho-protocol-evm.js').MorphoProtocolOptions} MorphoProtocolOptions */
/** @typedef {import('./src/morpho-protocol-evm.js').MorphoSupplyOptions} MorphoSupplyOptions */
/** @typedef {import('./src/morpho-protocol-evm.js').MorphoRepayOptions} MorphoRepayOptions */
/** @typedef {import('./src/morpho-protocol-evm.js').RequirementOptions} RequirementOptions */
/** @typedef {import('./src/morpho-protocol-evm.js').ApprovalOrSignatureRequirement} ApprovalOrSignatureRequirement */
/** @typedef {import('./src/morpho-protocol-evm.js').RequirementApproval} RequirementApproval */
/** @typedef {import('./src/morpho-protocol-evm.js').RequirementAuthorization} RequirementAuthorization */
/** @typedef {import('./src/morpho-protocol-evm.js').RequirementSignatureRequest} RequirementSignatureRequest */
/** @typedef {import('./src/morpho-protocol-evm.js').RequirementSignature} RequirementSignature */
/** @typedef {import('./src/morpho-protocol-evm.js').VaultReallocation} VaultReallocation */
/** @typedef {import('./src/morpho-protocol-evm.js').Erc4337TransactionConfig} Erc4337TransactionConfig */

export { default } from './src/morpho-protocol-evm.js'

export {
  MORPHO_MARKET_PRESETS,
  MORPHO_VAULT_PRESETS
} from './src/morpho-presets.js'
