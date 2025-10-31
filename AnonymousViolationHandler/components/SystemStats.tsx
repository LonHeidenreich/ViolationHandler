"use client";

import { useContractRead } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

export function SystemStats() {
  const { data: totalViolations } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTotalViolations",
    watch: true,
  });

  return (
    <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-purple-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        System Statistics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl text-center shadow-lg">
          <h3 className="text-4xl font-bold mb-2">
            {totalViolations ? totalViolations.toString() : "0"}
          </h3>
          <p className="text-lg">Total Violations</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-6 rounded-xl text-center shadow-lg">
          <h3 className="text-4xl font-bold mb-2">FHE</h3>
          <p className="text-lg">Privacy Protection</p>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-xl text-center shadow-lg">
          <h3 className="text-4xl font-bold mb-2">Zama</h3>
          <p className="text-lg">Encrypted Computing</p>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-xl text-center shadow-lg">
          <h3 className="text-4xl font-bold mb-2">Sepolia</h3>
          <p className="text-lg">Test Network</p>
        </div>
      </div>
    </div>
  );
}
