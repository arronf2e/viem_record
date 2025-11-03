import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const publicClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: sepolia,   // 链信息（chainId、rpcUrls 等）
  transport: http('https://rpc.ankr.com/eth_sepolia/7f21a0eae30382777859e5774a12557d0e631d434726d92e014fed991733ef82'), // 采用 HTTP 传输层
});

const main = async () => {
  const gas = await publicClient.estimateGas()
  console.log(gas, 'gas')
}

main();