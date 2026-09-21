# rentalBack

Node.js + Express + MongoDB API for the Rental Management & Rent Collection system.

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

API: http://localhost:5100

## Stack

Express · Mongoose · JWT · node-cron · Razorpay · WhatsApp Cloud API (mock supported)

## Structure

`routes → controllers → services → repositories → models`
