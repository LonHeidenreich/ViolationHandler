"use client";

import { useState } from "react";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, VIOLATION_TYPES } from "@/lib/contract";

export function ReportViolation() {
  const { address, isConnected } = useAccount();
  const [licenseHash, setLicenseHash] = useState("");
  const [violationType, setViolationType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const { write, data } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "reportViolation",
  });

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      setStatus({
        type: "success",
        message: `Violation report submitted successfully! Transaction hash: ${data?.hash}`,
      });
      setLicenseHash("");
      setViolationType("");
      setLocation("");
      setTimeout(() => setStatus({ type: null, message: "" }), 10000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setStatus({ type: "error", message: "Please connect wallet first" });
      return;
    }

    if (!licenseHash || !violationType || !location) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    try {
      setStatus({ type: "warning", message: "Submitting violation report..." });

      // Convert license hash to uint32
      let processedLicenseHash: number;
      if (licenseHash.startsWith("0x")) {
        const hexValue = parseInt(licenseHash, 16);
        processedLicenseHash = hexValue % 2 ** 32;
      } else {
        let hash = 0;
        for (let i = 0; i < licenseHash.length; i++) {
          const char = licenseHash.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        processedLicenseHash = Math.abs(hash) % 2 ** 32;
      }

      write({
        args: [processedLicenseHash, parseInt(violationType), location],
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
        Report Violation
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">
            License Plate Hash (Anonymized):
          </label>
          <input
            type="text"
            value={licenseHash}
            onChange={(e) => setLicenseHash(e.target.value)}
            placeholder="e.g., ABC123, XYZ789, or license plate number"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            required
          />
          <small className="text-gray-600">
            Enter license plate info - will be converted to anonymous hash
            automatically
          </small>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">
            Violation Type:
          </label>
          <select
            value={violationType}
            onChange={(e) => setViolationType(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            required
          >
            <option value="">Select violation type</option>
            {Object.entries(VIOLATION_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name} ({value.fee})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">
            Violation Location:
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Detailed location information"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!isConnected || isConfirming}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
        >
          {isConfirming ? "Confirming..." : "Submit Report"}
        </button>
      </form>

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
