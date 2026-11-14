# Artisan Connect

A front-end demonstration of a two-sided service marketplace. Customers post jobs, artisans send
quotations, and each job moves through clear stages from posting to completion, review and, when
needed, refund or dispute.

> **This is a demonstration project.** There is no backend. Everything is saved in the browser
> (localStorage), and **all payments are simulated**: a status changes, and no money moves. Browser
> storage is not secure escrow.

## What it does

**Customers**
- Register, log in, and keep a profile (phone, address, photo).
- Post jobs with a category, location, budget, preferred date and up to 4 reference photos.
- Compare artisans' quotations (price, time, skills, rating), then accept or decline.
- Record a simulated payment, follow progress, confirm the finished work and leave a review.
- Cancel before payment, or ask for a refund or report a problem afterwards.
- See notifications and job history.

**Artisans**
- Register, log in, and build a professional profile (skills, experience, bio, location, photo, portfolio).
- Browse and filter open jobs, and send quotations.
- Withdraw quotations, start accepted jobs, update progress and mark jobs completed.
- Accept or contest refund requests.
- See simulated earnings, ratings and customer reviews.

**Demo Reviewer**
- Decides refund requests and disputes between customers and artisans (simulated outcomes).

**Everyone**
- A public artisan directory and artisan profiles, with search and filters kept in the address.

## Job stages

Open for Applications, Applications Received, Artisan Selected, Awaiting Payment, Payment Held,
Job in Progress, Awaiting Customer Confirmation, Completed.
Other outcomes: Cancelled, Refund Requested, Refunded, Disputed.

Every status change goes through one place, `src/lib/statusMachine.ts`, which only allows the
moves in its rule list. For example, a customer cannot confirm a job the artisan has not marked as
completed.

## Tech stack

React, TypeScript, Vite, Tailwind CSS v4, Motion (`motion/react`), Lucide React, React Router
(`react-router`), and browser localStorage.

## Getting started

You need Node.js 20.19 or newer (or 22.12 or newer).

```bash
npm install
npm run dev
```

Then open http://localhost:5173/.

Other commands:

```bash
npm run build     # type-checks the code and creates a production build in dist/
npm run preview   # serves the production build locally
```

## Using the demo

The app starts empty. There are no built-in accounts.

1. Click **Sign up** and create a **customer** account.
2. Log out, then create an **artisan** account with a different email. Complete the artisan's
   profile (skills, location, bio) so it can apply for jobs.
3. Optional, to try refunds and disputes: on the Sign up page, choose **Setting up the Demo
   Reviewer?** and enter the reviewer code from `src/lib/config.ts`. **Change that code before you
   share the project.**
4. Log in as the customer, post a job, then log in as the artisan to send a quotation. Switch
   between accounts by logging out and in again.

Each account has one role, so trying both sides needs at least two accounts. Use **one browser**:
accounts, jobs and the login session are saved per browser, so a second browser or a private
window starts empty.

## Project structure

```
src/
├── components/   ui, layout, jobs, artisans, auth, landing, dashboard, routing
├── context/      sign-in state (AuthProvider)
├── data/         service categories
├── hooks/        useAuth, useNotifications
├── lib/          saving helpers, status rules, formatters, validators, images, config, routes
├── pages/        public, customer, artisan, reviewer, shared
├── services/     every read and write of saved data
└── types/        TypeScript models
```

Pages and components never read or write browser storage directly. They call services, and the
services use the helpers in `src/lib/storage.ts`.

## Data and storage

- Everything lives under keys that start with `ac_` in the browser's localStorage.
- Browser storage holds about 5 MB, so uploaded photos are shrunk before they are saved.
- To start again, clear the site's data in the browser, or use **Reset saved data** on the
  "Something went wrong" screen.

## Limitations

This project is for demonstration and learning. It is **not** safe for real use.

- Passwords are stored as plain text in the browser, and sign-in is checked in the browser.
- Page guards only change what the interface shows. They do not protect data.
- The reviewer code is readable in the browser's developer tools.
- Data exists only in one browser on one computer. Different people on different devices
  cannot see each other's changes.
- Payments, refunds and earnings are simulated. No platform fee is modelled.
- There are no automated tests yet. The workflow was checked by hand.

## Accessibility

Forms have labels and error messages tied to their fields, and focus moves to the first
invalid field. Keyboard navigation, a skip link, visible focus outlines, and reduced-motion
support are included. Status and progress are written out in text, not shown by colour alone.