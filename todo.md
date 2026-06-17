# Easy Cash - Project TODO

## Database & Backend
- [x] Database schema: currencies, rates, deposit_addresses, orders tables
- [x] DB helpers for CRUD operations on all tables
- [x] tRPC routers: public (create order, get order status, get rates, get currencies)
- [x] tRPC routers: admin (manage orders, rates, deposit addresses)
- [x] Owner notification on new order submission
- [x] Admin role-based access control via Manus OAuth

## Frontend - Client Facing
- [x] Homepage with exchange form (You give / You receive)
- [x] Currency selectors with all currencies from casher.is
- [x] Real-time exchange rate display with countdown timer
- [x] Order creation flow: amount, payout details, Telegram handle
- [x] Order confirmation page with deposit address
- [x] Order status page with order ID lookup

## Frontend - Admin Panel
- [x] Admin dashboard with order list
- [x] Order detail view with manual status update controls
- [x] Manage crypto deposit addresses (add, edit, delete)
- [x] Manage exchange rates per currency pair (manual rate + markup %)
- [x] Admin authentication restricted to admin role only

## Design & Polish
- [x] Dark elegant premium theme with refined typography
- [x] Responsive design for mobile and desktop
- [x] Smooth animations and micro-interactions
- [x] Consistent spacing and visual hierarchy

## Testing
- [x] Vitest tests for routers (8 tests passing)

## Future (per user request)
- [ ] Rate parsing from external source
- [ ] Percentage markup auto-calculation from parsed rates

## UI Improvements
- [x] Redesign exchange form: left side "You give", right side "You receive" (horizontal layout)
- [x] Hide currency list behind dropdown/modal selector instead of showing all currencies at once

## Form Layout v2
- [x] Reorder form: currency selector first, then amount input (for both give and receive)
- [x] Add separate "К выплате:" line showing the calculated receive amount
- [x] Add test exchange rates to the database

## Acquiring Section
- [x] Create Acquiring page with P2P payment gateway info (based on greengo.cc)
- [x] Add route and navigation link for Acquiring page
