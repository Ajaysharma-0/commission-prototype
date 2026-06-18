# Hotel Revenue & Multi-Level Partner Commission Engine

## Software Requirement Specification (SRS)

### Prototype Version 1.0

---

# 1. Objective

Develop a **standalone and reusable Commission Engine** that can be integrated into any booking application.

Initially, it will be used for **Hotel Booking**, but the architecture must support future integration with:

* Hotel CRS
* Flight Booking
* Holiday Packages
* Activities
* Visa
* Insurance
* Any future booking product

The commission engine must be completely independent and reusable.

---

# 2. Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* ShadCN UI

## Backend

* Node.js
* Express.js
* TypeScript

## Database

* PostgreSQL

## ORM

* Prisma ORM

---

# 3. Architecture

Follow a modular architecture.

```
Frontend
        │
        ▼
REST API
        │
        ▼
Booking Module
        │
        ▼
Commission Engine
        │
        ▼
Commission Database Tables
```

The booking system should only create a booking.

All revenue and commission calculations must be handled by the Commission Engine.

---

# 4. Business Flow

1. Customer selects a hotel.
2. Customer books the hotel.
3. Booking record is created.
4. Commission Engine receives booking details.
5. Travacot revenue is calculated.
6. Transaction fee is calculated.
7. Owner net revenue is calculated.
8. Safety net is calculated.
9. Customer partner slots are checked.
10. New partner is assigned if a slot is available.
11. Dynamic partner commissions are calculated using **slot-wise** predefined rates.
12. Commission records are stored.
13. Partner wallet balances are updated.

---

# 5. Revenue Calculation

Example

Hotel Price = ₹75

Travacot Revenue = 15%

Travacot Revenue

75 × 15%

= ₹11.25

Transaction Fee = 4%

75 × 4%

= ₹3.00

Owner Net Revenue

11.25 − 3

= ₹8.25

Safety Net

8.25 ÷ 2

= ₹4.125

---

# 6. Formula

```
Travacot Revenue
=
Booking Amount × Travacot Percentage

Transaction Fee
=
Booking Amount × Transaction Fee Percentage

Owner Net Revenue
=
Travacot Revenue − Transaction Fee

Safety Net
=
Owner Net Revenue ÷ 2
```

Percentages should be configurable from the database.

---

# 7. Customer Slot System

Each customer can have a maximum of three commission partners.

Slots:

* Slot 1
* Slot 2
* Slot 3

Only these three partners are eligible for commissions.

Commission rates are **not** set per partner. Each slot has a configurable commission percentage stored in `commission_configuration` (see Section 9).

Once all slots are occupied, no new partner is assigned.

---

# 8. Slot Assignment Example

Booking 1

Partner A

Slot 1 → Partner A

Booking 2

Partner B

Slot 1 → Partner A

Slot 2 → Partner B

Booking 3

Partner C

Slot 1 → Partner A

Slot 2 → Partner B

Slot 3 → Partner C

Booking 4

Partner D

No slot assigned.

Partner D receives no commission.

---

# 9. Slot-Wise Commission Rates

Commission percentages are **not** set per partner.

Instead, each customer slot has a **predefined commission rate** configured in the system:

| Slot    | Commission |
| ------- | ---------- |
| Slot 1  | 20%        |
| Slot 2  | 15%        |
| Slot 3  | 10%        |

When a partner is assigned to a slot (because their mapped hotel was booked for the first time), that partner earns the **slot rate** — not a partner-specific rate.

Example:

* Partner A is assigned to **Slot 1** → earns **20%** on every future booking for that customer
* Partner B is assigned to **Slot 2** → earns **15%**
* Partner C is assigned to **Slot 3** → earns **10%**

Commission rates must never be hardcoded in application logic.

The engine should always read the current slot commission rates from the database configuration.

---

# 10. Commission Calculation

```
Slot Commission

=
Commission Base × Slot Commission Rate
```

The commission rate used is determined by the **slot number** (1, 2, or 3), not by which partner occupies the slot.

The commission base should be configurable, allowing future changes without code modifications.

---

# 11. Prototype Dashboard

Create a modern single-page admin dashboard.

### Section 1 - Partner Management

* Add Partner
* Edit Partner
* Delete Partner

Partners do **not** have individual commission rates. Commission is determined by slot assignment.

---

### Section 2 - Hotel Management

* Add Hotel
* Edit Hotel
* Delete Hotel
* Map Hotel to Partner

Each hotel belongs to one partner.

---

### Section 3 - Configuration

Manage:

* Travacot Revenue %
* Transaction Fee %
* Safety Net %
* **Slot 1 Commission %**
* **Slot 2 Commission %**
* **Slot 3 Commission %**
* Commission Base

No code changes should be required when these values change.

---

### Section 4 - Booking Simulator

Fields:

* Customer Name
* Select Hotel

On hotel selection:

* Hotel Price loads automatically.
* Partner loads automatically.

Button:

**Book Hotel**

One click should execute the full commission engine.

---

### Section 5 - Calculation Summary

Display:

* Booking Amount
* Travacot Revenue
* Transaction Fee
* Owner Net Revenue
* Safety Net

---

### Section 6 - Customer Slots

Display:

Customer

Ajay

Slot 1

Partner A

20% (Slot 1 rate)

Slot 2

Partner B

15% (Slot 2 rate)

Slot 3

Partner C

10% (Slot 3 rate)

---

### Section 7 - Slot Commission Breakdown

Display:

Partner

Slot

Rate (slot-wise)

Commission Amount

Partner A

Slot 1

20%

₹X

Partner B

Slot 2

15%

₹Y

Partner C

Slot 3

10%

₹Z

---

### Section 8 - Booking History

Display:

* Booking ID
* Customer
* Hotel
* Partner
* Booking Amount
* Travacot Revenue
* Transaction Fee
* Owner Net Revenue
* Safety Net
* Slot 1 Commission
* Slot 2 Commission
* Slot 3 Commission
* Booking Date

---

# 12. Database Design

## partners

* id
* name
* status
* timestamps

(No commission_rate — partners do not have individual rates.)

---

## hotels

* id
* name
* price
* partner_id
* status

---

## customers

* id
* name

---

## bookings

* id
* customer_id
* hotel_id
* booking_amount
* booking_date

(No commission fields should exist here.)

---

## commission_configuration

* id
* travacot_percentage
* transaction_fee_percentage
* safety_net_percentage
* slot1_commission_percentage
* slot2_commission_percentage
* slot3_commission_percentage
* commission_base
* active

---

## customer_partner_slots

* id
* customer_id
* slot_number
* partner_id
* assigned_at

Stores the first three eligible partners for each customer.

---

## booking_revenue

* id
* booking_id
* booking_amount
* travacot_revenue
* transaction_fee
* owner_net_revenue
* safety_net

Stores booking revenue calculations independently.

---

## booking_partner_commissions

* id
* booking_id
* customer_id
* partner_id
* slot_number
* commission_rate (snapshot of the slot rate at booking time)
* commission_amount
* status

Stores all partner commission transactions.

---

## partner_wallet

* id
* partner_id
* total_credit
* total_debit
* available_balance

Maintains current partner balance.

---

## partner_wallet_transactions

* id
* partner_id
* booking_id
* transaction_type
* amount
* remarks
* created_at

Acts as the partner ledger.

---

# 13. REST APIs

Partner APIs

* Create Partner
* Update Partner
* Delete Partner
* List Partners

Hotel APIs

* Create Hotel
* Update Hotel
* Delete Hotel
* List Hotels

Booking APIs

* Create Booking
* Booking History

Commission APIs

* Process Booking
* Calculate Commission
* Get Customer Slots
* Get Partner Earnings
* Get Partner Wallet
* Revenue Report

---

# 14. Reusable Commission Engine

The engine must be independent.

Example service:

```
CommissionEngine.processBooking({
    bookingId,
    customerId,
    partnerId,
    bookingAmount,
    productType
});
```

Any application should be able to call this service.

No business logic should exist in the booking module.

---

# 15. Future Integrations

The same engine should support:

* Hotel Booking
* Flight Booking
* Holiday Packages
* Activities
* Visa
* Insurance
* Car Rental

Only the product details should change.

The commission engine should remain unchanged.

---

# 16. Development Standards

* TypeScript only
* Prisma ORM
* Clean Architecture
* Repository Pattern
* Service Layer
* DTO Validation
* Modular Folder Structure
* Reusable Components
* Environment Configuration
* Proper Error Handling
* Logging
* Well-commented code

---

# 17. Deliverables

* Complete backend
* Complete frontend
* Prisma schema
* Database migrations
* REST APIs
* Single-page prototype
* Dynamic calculation engine
* Dynamic commission engine
* Customer slot engine
* Wallet management
* Booking history
* Revenue reports
* Reusable architecture suitable for integration into existing or future applications.

The final solution should be production-ready in architecture, modular in design, and capable of being plugged into other systems with minimal changes.
