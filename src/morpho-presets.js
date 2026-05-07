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

export const MORPHO_VAULT_PRESETS = Object.freeze({
  'sky-money-usdt-savings': Object.freeze({
    address: '0x23f5E9c35820f4baB695Ac1F19c203cC3f8e1e11',
    name: 'sky.money USDT Savings',
    chainId: 1
  }),
  'steakhouse-prime-instant': Object.freeze({
    address: '0xbeef003C68896c7D2c3c60d363e8d71a49Ab2bf9',
    name: 'Steakhouse Prime Instant',
    chainId: 1
  })
})

export const MORPHO_MARKET_PRESETS = Object.freeze({
  susds: Object.freeze({
    marketId: '0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b',
    collateralSymbol: 'sUSDS',
    lltv: '96.5%',
    chainId: 1
  }),
  wsteth: Object.freeze({
    marketId: '0xe7e9694b754c4d4f7e21faf7223f6fa71abaeb10296a4c43a54a7977149687d2',
    collateralSymbol: 'wstETH',
    lltv: '86%',
    chainId: 1
  }),
  wbtc: Object.freeze({
    marketId: '0xa921ef34e2fc7a27ccc50ae7e4b154e16c9799d3387076c421423ef52ac4df99',
    collateralSymbol: 'WBTC',
    lltv: '86%',
    chainId: 1
  }),
  xaut: Object.freeze({
    marketId: '0xb7843fe78e7e7fd3106a1b939645367967d1f986c2e45edb8932ad1896450877',
    collateralSymbol: 'XAUt',
    lltv: '77%',
    chainId: 1
  })
})
