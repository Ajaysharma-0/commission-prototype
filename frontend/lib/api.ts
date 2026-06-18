const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Partner {
  id: string;
  name: string;
  commissionRate: number;
  status: string;
}

export interface Hotel {
  id: string;
  name: string;
  price: number;
  partnerId: string;
  status: string;
  partner?: { id: string; name: string; commissionRate: number };
}

export interface Config {
  id: string;
  travacotPercentage: number;
  transactionFeePercentage: number;
  safetyNetPercentage: number;
  commissionBase: string;
  active: boolean;
}

export interface BookingResult {
  bookingId: string;
  revenue: {
    bookingAmount: number;
    travacotRevenue: number;
    transactionFee: number;
    ownerNetRevenue: number;
    safetyNet: number;
  };
  slotAssignment: {
    assigned: boolean;
    slotNumber?: number;
    partnerId: string;
    partnerName: string;
  };
  customerSlots: Array<{
    slotNumber: number;
    partnerId: string;
    partnerName: string;
    commissionRate: number;
    commissionAmount: number;
  }>;
  partnerCommissions: Array<{
    partnerId: string;
    partnerName: string;
    slotNumber: number;
    commissionRate: number;
    commissionAmount: number;
  }>;
}

export interface BookingHistoryItem {
  id: string;
  customer: string;
  customerId: string;
  hotel: string;
  partner: string;
  bookingAmount: number;
  travacotRevenue: number;
  transactionFee: number;
  ownerNetRevenue: number;
  safetyNet: number;
  slot1Commission: { partnerName: string | null; commissionAmount: number };
  slot2Commission: { partnerName: string | null; commissionAmount: number };
  slot3Commission: { partnerName: string | null; commissionAmount: number };
  bookingDate: string;
}

export interface CustomerWithSlots {
  id: string;
  name: string;
  slots: Array<{
    slotNumber: number;
    partnerId: string;
    partnerName: string;
    commissionRate: number;
  }>;
}

export const api = {
  getPartners: () => request<Partner[]>("/partners"),
  createPartner: (data: { name: string; commissionRate: number }) =>
    request<Partner>("/partners", { method: "POST", body: JSON.stringify(data) }),
  updatePartner: (id: string, data: Partial<Partner>) =>
    request<Partner>(`/partners/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePartner: (id: string) =>
    request<void>(`/partners/${id}`, { method: "DELETE" }),

  getHotels: () => request<Hotel[]>("/hotels"),
  createHotel: (data: { name: string; price: number; partnerId: string }) =>
    request<Hotel>("/hotels", { method: "POST", body: JSON.stringify(data) }),
  updateHotel: (id: string, data: Partial<Hotel>) =>
    request<Hotel>(`/hotels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHotel: (id: string) =>
    request<void>(`/hotels/${id}`, { method: "DELETE" }),

  getConfig: () => request<Config | null>("/config"),
  updateConfig: (data: Partial<Config>) =>
    request<Config>("/config", { method: "PUT", body: JSON.stringify(data) }),

  createBooking: (data: { customerName: string; hotelId: string }) =>
    request<BookingResult>("/bookings", { method: "POST", body: JSON.stringify(data) }),
  deleteBooking: (bookingId: string) =>
    request<void>(`/bookings/${bookingId}`, { method: "DELETE" }),
  getBookingHistory: () => request<BookingHistoryItem[]>("/bookings/history"),
  getCustomers: () => request<CustomerWithSlots[]>("/config/customers"),
  getWallets: () =>
    request<
      Array<{
        partnerId: string;
        partnerName: string;
        commissionRate: number;
        availableBalance: number;
      }>
    >("/commission/wallets"),

  adminReset: (opts?: { reseed?: boolean }) =>
    request<{ ok: boolean; reseeded: boolean }>("/admin/reset", {
      method: "POST",
      body: JSON.stringify({ reseed: opts?.reseed ?? true }),
    }),
};
