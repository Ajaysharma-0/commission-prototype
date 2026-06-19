"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, Zap } from "lucide-react";
import {
  api,
  BookingHistoryItem,
  BookingResult,
  Config,
  CustomerWithSlots,
  Hotel as HotelType,
  Partner,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  StatCard,
  Table,
} from "@/components/ui";

export default function DashboardPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerWithSlots[]>([]);
  const [wallets, setWallets] = useState<
    Array<{ partnerName: string; availableBalance: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [partnerForm, setPartnerForm] = useState({ name: "" });
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [hotelForm, setHotelForm] = useState({
    name: "",
    price: "",
    partnerId: "",
  });
  const [editingHotel, setEditingHotel] = useState<HotelType | null>(null);

  const [configForm, setConfigForm] = useState({
    travacotPercentage: "15",
    transactionFeePercentage: "4",
    slot1CommissionPercentage: "7.5",
    slot2CommissionPercentage: "5",
    slot3CommissionPercentage: "2.5",
  });

  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    hotelId: "",
  });
  const [lastBooking, setLastBooking] = useState<BookingResult | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const selectedHotel = hotels.find((h) => h.id === bookingForm.hotelId);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [p, h, c, hist, cust, w] = await Promise.all([
        api.getPartners(),
        api.getHotels(),
        api.getConfig(),
        api.getBookingHistory(),
        api.getCustomers(),
        api.getWallets(),
      ]);
      setPartners(p);
      setHotels(h);
      setConfig(c);
      setHistory(hist);
      setCustomers(cust);
      setWallets(w);
      if (c) {
        setConfigForm({
          travacotPercentage: String(c.travacotPercentage),
          transactionFeePercentage: String(c.transactionFeePercentage),
          slot1CommissionPercentage: String(c.slot1CommissionPercentage),
          slot2CommissionPercentage: String(c.slot2CommissionPercentage),
          slot3CommissionPercentage: String(c.slot3CommissionPercentage),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handlePartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingPartner) {
        await api.updatePartner(editingPartner.id, {
          name: partnerForm.name,
        });
        setEditingPartner(null);
      } else {
        await api.createPartner({
          name: partnerForm.name,
        });
      }
      setPartnerForm({ name: "" });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Partner save failed");
    }
  }

  async function handleHotelSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const partnerId = hotelForm.partnerId || null;
      if (editingHotel) {
        await api.updateHotel(editingHotel.id, {
          name: hotelForm.name,
          price: parseFloat(hotelForm.price),
          partnerId,
        });
        setEditingHotel(null);
      } else {
        await api.createHotel({
          name: hotelForm.name,
          price: parseFloat(hotelForm.price),
          partnerId,
        });
      }
      setHotelForm({ name: "", price: "", partnerId: "" });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hotel save failed");
    }
  }

  async function handleConfigSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.updateConfig({
        travacotPercentage: parseFloat(configForm.travacotPercentage),
        transactionFeePercentage: parseFloat(configForm.transactionFeePercentage),
        slot1CommissionPercentage: parseFloat(configForm.slot1CommissionPercentage),
        slot2CommissionPercentage: parseFloat(configForm.slot2CommissionPercentage),
        slot3CommissionPercentage: parseFloat(configForm.slot3CommissionPercentage),
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Config save failed");
    }
  }

  async function handleBookHotel() {
    if (!bookingForm.customerName || !bookingForm.hotelId) return;
    setBookingLoading(true);
    try {
      const result = await api.createBooking({
        customerName: bookingForm.customerName,
        hotelId: bookingForm.hotelId,
      });
      setLastBooking(result);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    try {
      await api.deleteBooking(bookingId);
      if (lastBooking?.bookingId === bookingId) setLastBooking(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete booking failed");
    }
  }

  async function handleResetAllData() {
    if (
      !confirm(
        "This will delete ALL records (partners, hotels, customers, bookings, wallets) and reseed demo data. Continue?"
      )
    ) {
      return;
    }
    setResetLoading(true);
    try {
      await api.adminReset({ reseed: true });
      setLastBooking(null);
      setBookingForm({ customerName: "", hotelId: "" });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetLoading(false);
    }
  }

  const activeCustomer = customers.find(
    (c) => c.name.toLowerCase() === bookingForm.customerName.toLowerCase()
  );

  const displaySlots =
    lastBooking?.customerSlots ??
    activeCustomer?.slots.map((s) => ({
      ...s,
      commissionAmount: 0,
    })) ??
    [];

  const displayCommissions = lastBooking?.partnerCommissions ?? [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Commission Engine</h1>
              <p className="text-sm text-muted-foreground">
                Hotel Revenue & Multi-Level Partner Commission
              </p>
            </div>
          </div>
          <Badge variant="success">Prototype v1.0</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <button
              className="ml-4 underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Section 1 - Partner Management */}
          <Card
            title="Partner Management"
            description="Add, edit, delete partners — commission is slot-based, not per partner"
          >
            <form onSubmit={handlePartnerSubmit} className="space-y-3 mb-4">
              <Input
                label="Partner Name"
                value={partnerForm.name}
                onChange={(e) =>
                  setPartnerForm({ ...partnerForm, name: e.target.value })
                }
                placeholder="Partner A"
                required
              />
              <div className="flex gap-2">
                <Button type="submit">
                  {editingPartner ? "Update Partner" : "Add Partner"}
                </Button>
                {editingPartner && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingPartner(null);
                      setPartnerForm({ name: "" });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
            <Table
              headers={["Name", "Status", "Actions"]}
              rows={partners.map((p) => [
                p.name,
                <Badge key={p.id}>{p.status}</Badge>,
                <div key={`a-${p.id}`} className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      setEditingPartner(p);
                      setPartnerForm({
                        name: p.name,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="px-2 py-1 text-xs"
                    onClick={async () => {
                      if (confirm(`Delete ${p.name}?`)) {
                        try {
                          await api.deletePartner(p.id);
                          await loadAll();
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "Delete partner failed"
                          );
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>,
              ])}
            />
          </Card>

          {/* Section 2 - Hotel Management */}
          <Card
            title="Hotel Management"
            description="Manage hotels — optionally map each to a partner"
          >
            <form onSubmit={handleHotelSubmit} className="space-y-3 mb-4">
              <Input
                label="Hotel Name"
                value={hotelForm.name}
                onChange={(e) =>
                  setHotelForm({ ...hotelForm, name: e.target.value })
                }
                placeholder="Grand Palace Hotel"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (₹)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={hotelForm.price}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, price: e.target.value })
                  }
                  placeholder="75"
                  required
                />
                <Select
                  label="Partner (optional)"
                  value={hotelForm.partnerId}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, partnerId: e.target.value })
                  }
                >
                  <option value="">No partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingHotel ? "Update Hotel" : "Add Hotel"}
                </Button>
                {editingHotel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingHotel(null);
                      setHotelForm({ name: "", price: "", partnerId: "" });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
            <Table
              headers={["Hotel", "Price", "Partner", "Actions"]}
              rows={hotels.map((h) => [
                h.name,
                formatCurrency(h.price),
                h.partner?.name ?? "No partner",
                <div key={`h-${h.id}`} className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      setEditingHotel(h);
                      setHotelForm({
                        name: h.name,
                        price: String(h.price),
                        partnerId: h.partnerId ?? "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="px-2 py-1 text-xs"
                    onClick={async () => {
                      if (confirm(`Delete ${h.name}?`)) {
                        try {
                          await api.deleteHotel(h.id);
                          await loadAll();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Delete hotel failed");
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>,
              ])}
            />
          </Card>
        </div>

        {/* Section 3 - Configuration */}
        <Card
          title="Configuration"
          description="NIR pool and socket earning rates — NIR Pool = (Travacot Net − Transaction Fee) ÷ 2"
        >
          <form
            onSubmit={handleConfigSave}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Input
              label="Travacot Net Revenue %"
              type="number"
              step="0.01"
              value={configForm.travacotPercentage}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  travacotPercentage: e.target.value,
                })
              }
            />
            <Input
              label="Transaction Fee % (of booking)"
              type="number"
              step="0.01"
              value={configForm.transactionFeePercentage}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  transactionFeePercentage: e.target.value,
                })
              }
            />
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center">
              NIR Pool divisor is fixed at ÷ 2 per spec
            </div>
            <Input
              label="Socket A rate % (of NIR pool)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={configForm.slot1CommissionPercentage}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  slot1CommissionPercentage: e.target.value,
                })
              }
            />
            <Input
              label="Socket B rate % (of NIR pool)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={configForm.slot2CommissionPercentage}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  slot2CommissionPercentage: e.target.value,
                })
              }
            />
            <Input
              label="Socket C rate % (of NIR pool)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={configForm.slot3CommissionPercentage}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  slot3CommissionPercentage: e.target.value,
                })
              }
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Section 4 - Booking Simulator */}
          <Card
            title="Booking Simulator"
            description="One click runs the full commission engine"
            className="lg:col-span-1"
          >
            <div className="space-y-4">
              <Input
                label="Customer Name"
                value={bookingForm.customerName}
                onChange={(e) =>
                  setBookingForm({
                    ...bookingForm,
                    customerName: e.target.value,
                  })
                }
                placeholder="Ajay"
              />
              <Select
                label="Select Hotel"
                value={bookingForm.hotelId}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, hotelId: e.target.value })
                }
              >
                <option value="">Choose hotel</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
              {selectedHotel && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Price: </span>
                    {formatCurrency(selectedHotel.price)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Partner: </span>
                    {selectedHotel.partner?.name ?? "No partner"}
                  </p>
                </div>
              )}
              <Button
                className="w-full"
                onClick={handleBookHotel}
                disabled={
                  bookingLoading ||
                  !bookingForm.customerName ||
                  !bookingForm.hotelId
                }
              >
                <Zap className="mr-2 h-4 w-4" />
                {bookingLoading ? "Processing..." : "Book Hotel"}
              </Button>
              {lastBooking?.slotAssignment && (
                <p className="text-xs text-muted-foreground">
                  {lastBooking.slotAssignment.partnerName
                    ? lastBooking.slotAssignment.assigned
                      ? `New slot assigned: Slot ${lastBooking.slotAssignment.slotNumber} → ${lastBooking.slotAssignment.partnerName}`
                      : `No new slot for ${lastBooking.slotAssignment.partnerName} (slots full or already assigned)`
                    : "No affiliated partner — slot assignment skipped"}
                </p>
              )}
            </div>
          </Card>

          {/* Section 5 - Calculation Summary */}
          <Card
            title="Calculation Summary"
            description="Revenue breakdown from last booking"
            className="lg:col-span-2"
          >
            {lastBooking ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  label="Booking Amount"
                  value={formatCurrency(lastBooking.revenue.bookingAmount)}
                />
                <StatCard
                  label="Travacot Net"
                  value={formatCurrency(lastBooking.revenue.travacotRevenue)}
                />
                <StatCard
                  label="Transaction Fee"
                  value={formatCurrency(lastBooking.revenue.transactionFee)}
                />
                <StatCard
                  label="Owner Net Revenue"
                  value={formatCurrency(lastBooking.revenue.ownerNetRevenue)}
                />
                <StatCard
                  label="NIR Pool"
                  value={formatCurrency(
                    lastBooking.revenue.nirPool ?? lastBooking.revenue.safetyNet
                  )}
                  highlight
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Complete a booking to see calculation summary
              </p>
            )}
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Section 6 - Customer Slots */}
          <Card
            title="Customer Sockets"
            description="Socket holders per customer — earnings are % of NIR pool"
          >
            {bookingForm.customerName ? (
              <div className="mb-3">
                <p className="text-sm font-medium">
                  Customer: {bookingForm.customerName}
                </p>
              </div>
            ) : null}
            <Table
              headers={["Socket", "Partner", "Socket Rate", "Earning"]}
              rows={
                displaySlots.length > 0
                  ? displaySlots.map((s) => [
                      s.slotNumber === 1
                        ? "Socket A"
                        : s.slotNumber === 2
                          ? "Socket B"
                          : "Socket C",
                      s.partnerName,
                      `${s.commissionRate}%`,
                      s.skipped
                        ? `${formatCurrency(s.commissionAmount)} (skipped)`
                        : formatCurrency(s.commissionAmount),
                    ])
                  : [1, 2, 3].map((n) => [
                      n === 1 ? "Socket A" : n === 2 ? "Socket B" : "Socket C",
                      "—",
                      config
                        ? `${[config.slot1CommissionPercentage, config.slot2CommissionPercentage, config.slot3CommissionPercentage][n - 1]}%`
                        : "—",
                      "—",
                    ])
              }
            />
          </Card>

          {/* Section 7 - Slot Commission Breakdown */}
          <Card
            title="Socket Earnings Breakdown"
            description="NIR earnings per socket on the latest booking"
          >
            <Table
              headers={["Partner", "Socket", "Rate", "Earning"]}
              rows={
                displayCommissions.length > 0
                  ? displayCommissions.map((c) => [
                      c.partnerName,
                      c.slotNumber === 1
                        ? "Socket A"
                        : c.slotNumber === 2
                          ? "Socket B"
                          : "Socket C",
                      `${c.commissionRate}%`,
                      c.skipped
                        ? `${formatCurrency(c.commissionAmount)} (skipped)`
                        : formatCurrency(c.commissionAmount),
                    ])
                  : []
              }
            />
          </Card>
        </div>

        {/* Partner Wallets */}
        <Card title="Partner Wallets" description="Current partner balances">
          <Table
            headers={["Partner", "Available Balance"]}
            rows={wallets.map((w) => [
              w.partnerName,
              formatCurrency(w.availableBalance),
            ])}
          />
        </Card>

        {/* Section 8 - Booking History */}
        <Card
          title="Booking History"
          description="All bookings with revenue and slot commissions"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Tip: delete bookings first if you want to delete hotels.
            </p>
            <Button
              variant="destructive"
              onClick={handleResetAllData}
              disabled={resetLoading}
            >
              {resetLoading ? "Resetting..." : "Reset all data (reseed demo)"}
            </Button>
          </div>
          <Table
            headers={[
              "ID",
              "Customer",
              "Hotel",
              "Partner",
              "Amount",
              "Travacot",
              "Txn Fee",
              "Owner Net",
              "NIR Pool",
              "Socket A",
              "Socket B",
              "Socket C",
              "Date",
              "Actions",
            ]}
            rows={history.map((b) => [
              b.id.slice(0, 8) + "…",
              b.customer,
              b.hotel,
              b.partner,
              formatCurrency(b.bookingAmount),
              formatCurrency(b.travacotRevenue),
              formatCurrency(b.transactionFee),
              formatCurrency(b.ownerNetRevenue),
              formatCurrency(b.safetyNet),
              b.slot1Commission.partnerName
                ? `${b.slot1Commission.partnerName}: ${formatCurrency(b.slot1Commission.commissionAmount)}`
                : "—",
              b.slot2Commission.partnerName
                ? `${b.slot2Commission.partnerName}: ${formatCurrency(b.slot2Commission.commissionAmount)}`
                : "—",
              b.slot3Commission.partnerName
                ? `${b.slot3Commission.partnerName}: ${formatCurrency(b.slot3Commission.commissionAmount)}`
                : "—",
              new Date(b.bookingDate).toLocaleString(),
              <Button
                key={`del-${b.id}`}
                variant="destructive"
                className="px-2 py-1 text-xs"
                onClick={() => {
                  if (confirm("Delete this booking? This also updates wallets.")) {
                    handleDeleteBooking(b.id);
                  }
                }}
              >
                Delete
              </Button>,
            ])}
          />
        </Card>
      </main>
    </div>
  );
}
