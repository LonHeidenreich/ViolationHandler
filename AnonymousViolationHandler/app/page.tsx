"use client";

import { WalletInfo } from "@/components/WalletInfo";
import { ReportViolation } from "@/components/ReportViolation";
import { PaymentProcessing } from "@/components/PaymentProcessing";
import { ViolationQuery } from "@/components/ViolationQuery";
import { AdminPanel } from "@/components/AdminPanel";
import { SystemStats } from "@/components/SystemStats";

export default function Home() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-400 to-orange-500 text-white p-12 text-center">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            🚗 Anonymous Violation Handler
          </h1>
          <p className="text-xl opacity-90">
            Privacy-Protected Traffic Violation Processing Platform using Zama
            FHE Technology
          </p>
        </div>

        <div className="p-8">
          <WalletInfo />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ReportViolation />
            <PaymentProcessing />
          </div>

          <ViolationQuery />

          <AdminPanel />

          <SystemStats />
        </div>
      </div>
    </div>
  );
}
