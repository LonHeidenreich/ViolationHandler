import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { useToast } from './use-toast';

export function useReportViolation() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { toast } = useToast();

  const reportViolation = async (
    licensePlate: string,
    violationType: number,
    severityScore: number,
    isRepeatOffender: boolean,
    location: string
  ) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'reportViolation',
        args: [licensePlate, violationType, severityScore, isRepeatOffender, location],
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to report violation',
      });
    }
  };

  return {
    reportViolation,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useSubmitPayment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitPayment = (violationId: number, paymentId: string, value: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'submitPayment',
      args: [violationId, paymentId as `0x${string}`],
      value,
    });
  };

  return {
    submitPayment,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useViolationInfo(violationId?: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getViolationInfo',
    args: violationId !== undefined ? [violationId] : undefined,
    query: {
      enabled: violationId !== undefined && violationId > 0,
    },
  });
}

export function useTotalViolations() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalViolations',
  });
}

export function useReporterViolations(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getReporterViolations',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useBaseFine(violationType: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBaseFine',
    args: [violationType],
  });
}
