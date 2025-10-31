"use client";

import { useState } from "react";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

export function PaymentProcessing() {
  const { isConnected } = useAccount();
  const [violationId, setViolationId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const { write, data } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "submitPayment",
  });

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      setStatus({
        type: "success",
        message: `Payment proof submitted successfully! Transaction hash: ${data?.hash}`,
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 10000);
    },
  });

  const handleSubmit = async () => {
    if (!isConnected) {
      setStatus({ type: "error", message: "Please connect wallet first" });
      return;
    }

    if (!violationId || !paymentId) {
      setStatus({
        type: "error",
        message: "Please enter both violation ID and payment proof ID",
      });
      return;
    }

    try {
      setStatus({ type: "warning", message: "Submitting payment proof..." });

      write({
        args: [parseInt(violationId), parseInt(paymentId)],
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: `Submission failed: ${error.message}`,
      });
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-purple-600 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Payment Processing
      </h2>

      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Violation ID:
        </label>
        <input
          type="number"
          value={violationId}
          onChange={(e) => setViolationId(e.target.value)}
          placeholder="Enter violation ID"
          min="1"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Payment Proof ID (Encrypted):
        </label>
        <input
          type="text"
          value={paymentId}
          onChange={(e) => setPaymentId(e.target.value)}
          placeholder="Enter payment proof ID"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isConnected || isConfirming}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
      >
        {isConfirming ? "Submitting..." : "Submit Payment Proof"}
      </button>

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
