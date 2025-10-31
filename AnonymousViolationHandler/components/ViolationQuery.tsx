"use client";

import { useState } from "react";
import { useAccount, useContractRead } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

interface ViolationInfo {
  id: number;
  location: string;
  timestamp: string;
  isPaid: boolean;
  isProcessed: boolean;
  reporter: string;
}

export function ViolationQuery() {
  const { address, isConnected } = useAccount();
  const [queryId, setQueryId] = useState("");
  const [violations, setViolations] = useState<ViolationInfo[]>([]);
  const [status, setStatus] = useState("");

  const { refetch: queryViolation } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getViolationInfo",
    args: queryId ? [parseInt(queryId)] : undefined,
    enabled: false,
  });

  const { refetch: getReporterViolations } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getReporterViolations",
    args: address ? [address] : undefined,
    enabled: false,
  });

  const handleQuery = async () => {
    if (!isConnected) {
      setStatus("Please connect wallet first");
      return;
    }

    try {
      const { data } = await queryViolation();
      if (data) {
        const [location, timestamp, isPaid, isProcessed, reporter] = data as any;
        setViolations([
          {
            id: parseInt(queryId),
            location,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            isPaid,
            isProcessed,
            reporter,
          },
        ]);
        setStatus("");
      }
    } catch (error: any) {
      setStatus(`Query failed: ${error.message}`);
    }
  };

  const loadMyReports = async () => {
    if (!isConnected || !address) {
      setStatus("Please connect wallet first");
      return;
    }

    try {
      const { data: reportIds } = await getReporterViolations();
      if (!reportIds || (reportIds as any).length === 0) {
        setViolations([]);
        setStatus("You have not submitted any violation reports yet.");
        return;
      }

      const violationPromises = (reportIds as any).map(async (id: bigint) => {
        const { data } = await useContractRead({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getViolationInfo",
          args: [Number(id)],
        }).refetch();

        if (data) {
          const [location, timestamp, isPaid, isProcessed, reporter] =
            data as any;
          return {
            id: Number(id),
            location,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            isPaid,
            isProcessed,
            reporter,
          };
        }
        return null;
      });

      const results = await Promise.all(violationPromises);
      setViolations(results.filter((v) => v !== null) as ViolationInfo[]);
      setStatus("");
    } catch (error: any) {
      setStatus(`Loading failed: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-8 border-l-4 border-purple-600 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Violation Records Query
      </h2>

      <div className="mb-6 flex gap-4">
        <input
          type="number"
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Enter violation ID to query"
          min="1"
          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
        />
        <button
          onClick={handleQuery}
          disabled={!isConnected}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Query Violation
        </button>
        <button
          onClick={loadMyReports}
          disabled={!isConnected}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          My Reports
        </button>
      </div>

      {status && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
          {status}
        </div>
      )}

      {violations.length > 0 && (
        <div className="space-y-4">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-600"
            >
              <h3 className="text-xl font-bold mb-4">
                Violation ID: #{violation.id}
              </h3>
              <p className="mb-2">
                <strong>Location:</strong> {violation.location}
              </p>
              <p className="mb-2">
                <strong>Report Time:</strong> {violation.timestamp}
              </p>
              <p className="mb-2">
                <strong>Payment Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    violation.isPaid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {violation.isPaid ? "Paid" : "Unpaid"}
                </span>
              </p>
              <p className="mb-2">
                <strong>Processing Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    violation.isProcessed ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {violation.isProcessed ? "Processed" : "Pending"}
                </span>
              </p>
              <p>
                <strong>Reporter:</strong> {violation.reporter.slice(0, 6)}...
                {violation.reporter.slice(-4)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
