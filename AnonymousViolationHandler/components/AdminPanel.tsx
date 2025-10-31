"use client";

import { useState } from "react";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { parseEther } from "ethers/lib/utils";

export function AdminPanel() {
  const { isConnected } = useAccount();
  const [processId, setProcessId] = useState("");
  const [fineType, setFineType] = useState("1");
  const [fineAmount, setFineAmount] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const { write: processPayment, data: processData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "processPayment",
  });

  const { write: updateFine, data: updateData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "updateViolationFine",
  });

  const { isLoading: isProcessing } = useWaitForTransaction({
    hash: processData?.hash,
    onSuccess: () => {
      setStatus({
        type: "success",
        message: `Payment processed successfully! Transaction hash: ${processData?.hash}`,
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 10000);
    },
  });

  const { isLoading: isUpdating } = useWaitForTransaction({
    hash: updateData?.hash,
    onSuccess: () => {
      setStatus({
        type: "success",
        message: `Fine amount updated successfully! Transaction hash: ${updateData?.hash}`,
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 10000);
    },
  });

  const handleProcessPayment = async () => {
    if (!isConnected) {
      setStatus({ type: "error", message: "Please connect wallet first" });
      return;
    }

    if (!processId) {
      setStatus({ type: "error", message: "Please enter a violation ID" });
      return;
    }

    try {
      setStatus({ type: "warning", message: "Processing payment..." });
      processPayment({
        args: [parseInt(processId)],
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: `Processing failed: ${error.message}`,
      });
    }
  };

  const handleUpdateFine = async () => {
    if (!isConnected) {
      setStatus({ type: "error", message: "Please connect wallet first" });
      return;
    }

    const fineAmountNum = parseFloat(fineAmount);
    if (
      !fineAmount ||
      isNaN(fineAmountNum) ||
      fineAmountNum <= 0 ||
      fineAmountNum > 1000
    ) {
      setStatus({
        type: "error",
        message: "Please enter a valid fine amount (0.001 - 1000 ETH)",
      });
      return;
    }

    try {
      setStatus({ type: "warning", message: "Updating fine amount..." });
      const amountWei = parseEther(fineAmount);

      updateFine({
        args: [parseInt(fineType), amountWei],
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: `Update failed: ${error.message}`,
      });
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-purple-600 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Functions</h2>
      <p className="mb-6 font-semibold text-gray-700">
        Contract Administrator Only
      </p>

      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700">
            Violation ID:
          </label>
          <input
            type="number"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
            placeholder="Violation ID"
            min="1"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </div>
        <button
          onClick={handleProcessPayment}
          disabled={!isConnected || isProcessing}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : "Process Payment"}
        </button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700">
            Violation Type:
          </label>
          <select
            value={fineType}
            onChange={(e) => setFineType(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          >
            <option value="1">Speeding</option>
            <option value="2">Illegal Parking</option>
            <option value="3">Red Light Running</option>
            <option value="4">No Seatbelt</option>
            <option value="5">Mobile Phone Use</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700">
            Fine Amount (ETH):
          </label>
          <input
            type="number"
            value={fineAmount}
            onChange={(e) => setFineAmount(e.target.value)}
            placeholder="0.001 - 1000"
            min="0.001"
            max="1000"
            step="0.001"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </div>
        <button
          onClick={handleUpdateFine}
          disabled={!isConnected || isUpdating}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? "Updating..." : "Update Fine"}
        </button>
      </div>

      {status.type && (
        <div
          className={`mt-6 p-4 rounded-lg font-semibold ${
            status.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : status.type === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
