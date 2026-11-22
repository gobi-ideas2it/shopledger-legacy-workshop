# Repository Guidelines

## Stack

ShopLedger is a Node.js application using CommonJS and Express 4 with `body-parser`. Its browser UI is plain HTML, CSS, and JavaScript. Data is stored in `data/db.json`; there is no database service or frontend build system.

## Module Map

- `server.js` creates the Express app, serves `public/`, and mounts the API routers.
- `routes/` contains product and coupon, order, customer settlement, and report endpoints.
- `lib/` contains `store` (JSON persistence), `orders`, `inventory`, `pricing`, `coupons`, `tax`, `ledger`, `reports`, `invoice`, and `dates` logic.
- `public/` contains the UI assets; `config.js` contains shop, tax, inventory, and coupon settings; `data/db.json` contains application data.

## Commands

- `npm start` starts the server at port 3000, or at the port set by `PORT`.
- `npm test` currently exits with “no test specified”; no test suite is configured.
- There is no build command.

## Change Rules

- Before changing behaviour, write characterization tests for the existing behaviour being changed.
- Change only the module the ticket is about; avoid unrelated edits and cleanup.
- Tests must never read from or write to `data/db.json`. Use isolated test data.
- Add no dependencies. Use the existing runtime and packages.
