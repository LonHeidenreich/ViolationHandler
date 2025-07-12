'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VIOLATION_TYPES } from '@/lib/contract';
import { useReportViolation, useTotalViolations, useReporterViolations } from '@/hooks/use-contract';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2, FileText, History } from 'lucide-react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { reportViolation, isPending, isSuccess, hash } = useReportViolation();
  const { data: totalViolations } = useTotalViolations();
  const { data: myViolations } = useReporterViolations(address);

  const [formData, setFormData] = useState({
    licensePlate: '',
    violationType: 1,
    severityScore: 25,
    isRepeatOffender: false,
    location: '',
  });

  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Success!",
        description: `Violation reported! TX: ${hash.slice(0, 10)}...`,
      });
      setFormData({
        licensePlate: '',
        violationType: 1,
        severityScore: 25,
        isRepeatOffender: false,
        location: '',
      });
    }
  }, [isSuccess, hash, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    try {
      await reportViolation(
        formData.licensePlate,
        formData.violationType,
        formData.severityScore,
        formData.isRepeatOffender,
        formData.location
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #070910 0%, #0a0d16 50%, #070910 100%)' }}>
      <header className="border-b border-[var(--color-border)] bg-[var(--color-panel)]/50 backdrop-blur-[18px] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent)] rounded-[1.05rem] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">Traffic Violation Reporter</h1>
              <p className="text-xs text-[var(--color-text-dim)]">Decentralized reporting on Sepolia</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-dim)]">Total Violations</p>
                  <p className="text-3xl font-bold text-[var(--color-text)]">{totalViolations?.toString() || '0'}</p>
                </div>
                <FileText className="w-10 h-10 text-[var(--accent)] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-dim)]">Your Reports</p>
                  <p className="text-3xl font-bold text-[var(--color-text)]">{myViolations?.length || '0'}</p>
                </div>
                <History className="w-10 h-10 text-[var(--success)] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-dim)]">Network</p>
                  <p className="text-lg font-bold text-[var(--color-text)]">Sepolia</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-[var(--accent)] opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Report a Violation</CardTitle>
                <CardDescription>
                  Submit a traffic violation report to the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-[var(--color-text)]">License Plate *</Label>
                    <Input
                      id="licensePlate"
                      placeholder="e.g., ABC-1234"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="violationType" className="text-[var(--color-text)]">Violation Type *</Label>
                    <select
                      id="violationType"
                      value={formData.violationType}
                      onChange={(e) => setFormData({ ...formData, violationType: Number(e.target.value) })}
                      className="flex h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel-alt)] px-4 py-2 text-sm text-[var(--color-text)] transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:shadow-[0_0_0_2px_var(--accent),0_0_20px_-4px_var(--accent)]"
                      required
                    >
                      {VIOLATION_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-[var(--color-text)]">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Main St & 5th Ave"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severityScore" className="text-[var(--color-text)]">
                      Severity: {formData.severityScore}
                    </Label>
                    <input
                      type="range"
                      id="severityScore"
                      min="0"
                      max="100"
                      value={formData.severityScore}
                      onChange={(e) => setFormData({ ...formData, severityScore: Number(e.target.value) })}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRepeatOffender"
                      checked={formData.isRepeatOffender}
                      onChange={(e) => setFormData({ ...formData, isRepeatOffender: e.target.checked })}
                      className="w-4 h-4 accent-[var(--accent)] rounded"
                    />
                    <Label htmlFor="isRepeatOffender" className="text-[var(--color-text)]">Repeat Offender</Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending || !isConnected}
                    className="w-full"
                  >
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Report'}
                  </Button>

                  {!isConnected && (
                    <p className="text-sm text-center text-[var(--warning)] flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />Connect wallet to submit
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="text-[var(--color-text-dim)]">Network</p>
                  <p className="text-[var(--color-text)] font-medium">Sepolia Testnet</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-dim)] mb-1">Contract</p>
                  <a
                    href="https://sepolia.etherscan.io/address/0x4db282A151AbfF62B27FF3032003118Ee58Ed0E8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline text-xs break-all font-mono transition-colors duration-200"
                  >
                    0x4db282A151AbfF62B27FF3032003118Ee58Ed0E8
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-panel)]/50 backdrop-blur-[18px] mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-[var(--color-text-dim)] text-sm">
          <p>Built with Next.js, TypeScript, wagmi, and RainbowKit</p>
        </div>
      </footer>
    </div>
  );
}
