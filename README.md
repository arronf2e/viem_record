# viem 学习笔记 
doc: https://viem.sh/

## 1. Public Client 公共客户端

创建 公共（只读）客户端 的工厂函数。它返回的实例专注于 **查询链上数据**，不涉及签名或发送交易的功能。

| 功能 | 说明 |
|------|------|
| **只读查询** | 通过 RPC 节点读取区块、日志、合约状态、代币余额等信息。 |
| **无需私钥** | 不需要提供钱包或签名器，因为所有操作都是 `eth_call`、`eth_get*` 等只读 RPC 方法。 |
| **高效复用** | 只创建一次实例后，可在整个应用中复用，避免重复建立连接。 |
| **可配置** | 支持自定义 RPC URL、链信息、缓存策略、超时等。 |
| **类型安全** | 在 TypeScript 环境下提供完整的类型推导，提升开发体验。 |

### 1.1 创建实例

```javascript
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: sepolia,   // 链信息（chainId、rpcUrls 等）
  transport: http('sepolia rpc'), // 采用 HTTP 传输层
});

console.log(publicClient)
```

### 1.2 常用方法

| 方法 | 作用 | 示例 |
|------|------|------|
| `getBlockNumber()` | 获取最新区块号 | `const block = await publicClient.getBlockNumber();` |
| `getBalance({ address })` | 查询地址的原生代币余额 | `await publicClient.getBalance({ address: '0x...' })` |
| `readContract({ address, abi, functionName, args })` | 调用合约的只读函数 (`view` / `pure`) | `await publicClient.readContract({ address, abi, functionName: 'balanceOf', args: ['0x...'] })` |
| `getLogs({ address, topics, fromBlock, toBlock })` | 获取事件日志 | `await publicClient.getLogs({ address, topics, fromBlock: 0, toBlock: 'latest' })` |
| `estimateGas({ ... })` | 估算交易所需 gas（仍然是只读） | `await publicClient.estimateGas({ ... })` |
| `getTransaction({ hash })` | 查询交易详情 | `await publicClient.getTransaction({ hash })` |
| `multicall({ contracts })` | 批量读取多个合约的只读数据 | `await publicClient.multicall({ contracts: [...] })` |

> **注意**：虽然 `estimateGas` 看似涉及交易，但它仍然是只读的 `eth_estimateGas` 调用，不会真正发送交易。

### 1.3 Optimization  优化
公共客户端还支持 eth_call 聚合以提高性能，自动聚合多个 RPC 调用为一次 multicall，显著降低链上请求次数和延迟。

```javascript
const publicClient = createPublicClient({
  batch: {
    multicall: true,
  },
  ...
});
```

## 2. Wallet Client  钱包客户端
用于创建钱包客户端

支持两种类型：
- JSON-RPC Accounts (e.g. Browser Extension Wallets, WalletConnect, etc.)
- Local Accounts (e.g. private key/mnemonic wallets)

| 功能 | 说明 |
|------|------|
| **签名** | 使用本地私钥对交易、消息、EIP‑712 数据进行签名。 |
| **发送交易** | 把签名后的交易广播到链上（包括原生转账、合约调用、部署合约）。 |
| **管理账户** | 通过 `account` 对象（私钥、助记词、硬件钱包）统一管理。 |
| **估算 Gas** | 自动调用 `eth_estimateGas` 并根据 EIP‑1559 计算 `maxFeePerGas`、`maxPriorityFeePerGas`。 |
| **兼容 EIP‑1193** | 可以直接接入 MetaMask、WalletConnect、Coinbase Wallet 等浏览器注入的 Provider。 |

### 2.1 创建实例

```javascript
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// JSON‑RPC Accounts（由钱包/节点托管）
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum), // MetaMask 注入的 provider
});

// 2️⃣ 请求用户授权（弹出 MetaMask 授权窗口）
await walletClient.requestAddresses(); // 等价于 eth_requestAccounts

// 3️⃣ 获取已授权的地址（数组，通常只会有一个）
const [address] = await walletClient.getAddresses();
console.log('已连接的地址:', address);

// 4️⃣ 发送一笔转账（MetaMask 会弹出签名确认）
const hash = await walletClient.sendTransaction({
  to: '0xAbC123...def',          // 接收方
  value: parseEther('0.01'),    // 发送 0.01 ETH
});
console.log('交易哈希:', hash);

// Local Accounts (Private Key, Mnemonic)
// 1️⃣ 你的十六进制私钥（请务必妥善保管！）
const PRIVATE_KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd';

// 2️⃣ 将私钥转成 Account 对象
const account = privateKeyToAccount(PRIVATE_KEY);
console.log('本地账户地址:', account.address);

// 3️⃣ 创建 Wallet Client，使用 HTTP RPC 直接连接节点
const walletClient = createWalletClient({
  chain: mainnet,
  transport: http('https://rpc.ankr.com/eth'), // 任意可靠的以太坊 RPC
  account, // 注入本地账户
});

// 4️⃣ 发送一笔转账（签名在本地完成，无弹窗）
const hash = await walletClient.sendTransaction({
  to: '0xAbC123...def',
  value: parseEther('0.02'), // 发送 0.02 ETH
});
console.log('交易已广播，哈希:', hash);
```

