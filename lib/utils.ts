import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEth(value: bigint): string {
  const eth = Number(value) / 1e18
  return eth.toFixed(6)
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function getViolationTypeName(type: number): string {
  const types = ['Unknown', 'Speeding', 'Illegal Parking', 'Red Light', 'No Seatbelt', 'Mobile Phone']
  return types[type] || 'Unknown'
}

export function getViolationTypeColor(type: number): string {
  const colors = ['', 'text-red-500', 'text-yellow-500', 'text-red-600', 'text-orange-500', 'text-blue-500']
  return colors[type] || ''
}
