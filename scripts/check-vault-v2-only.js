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

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))

const checks = [
  {
    file: 'src/morpho-protocol-evm.js',
    patterns: [
      'client.vaultV1(',
      "|| 'v1'",
      'earnVaultVersion',
      'vaultVersion'
    ]
  },
  {
    file: 'tests/morpho-protocol-evm.test.js',
    patterns: [
      'vaultV1',
      'earnVaultVersion',
      'vaultVersion'
    ]
  },
  {
    file: 'src/morpho-presets.js',
    patterns: [
      'version:'
    ]
  },
  {
    file: 'README.md',
    patterns: [
      'V1/V2',
      'Steakhouse USDT V1',
      'Gauntlet USDT Frontier V1',
      'earnVaultVersion',
      'vaultVersion',
      'vault version'
    ]
  }
]

for (const check of checks) {
  const content = await readFile(join(root, check.file), 'utf8')
  const pattern = check.patterns.find((pattern) => content.includes(pattern))

  if (pattern) {
    throw new Error(`${check.file} contains unsupported Morpho vault reference '${pattern}'. Use Morpho Vault V2 only.`)
  }
}

console.log('Morpho vault configuration uses Vault V2 only.')
