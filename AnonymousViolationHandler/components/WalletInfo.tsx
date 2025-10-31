"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletInfo() {
  const { address, isConnected } = useAccount();

  return (
    <div
      className={`rounded-lg p-6 text-center mb-6 ${
        isConnected
          ? "bg-gradient-to-r from-blue-500 to-cyan-500"
          : "bg-gradient-to-r from-red-400 to-orange-500"
      } text-white`}
    >
      {isConnected ? (
        <>
          <p className="mb-2">
            <strong>Connected Wallet:</strong> {address?.slice(0, 6)}...
            {address?.slice(-4)}
          </p>
          <p className="mb-4">
            <strong>Network:</strong> Sepolia Testnet
          </p>
          <ConnectButton />
        </>
      ) : (
        <>
          <p className="mb-4">Please connect your wallet to use the system</p>
          <ConnectButton />
        </>
      )}
    </div>
  );
}
