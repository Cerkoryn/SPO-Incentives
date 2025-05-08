# spo-incentives

Interactive SvelteKit app visualizing Cardano stake pool saturation and ROI.

Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Production Build](#production-build)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [Updating Pool Data](#updating-pool-data)
- [Contributing](#contributing)
- [License](#license)

## Overview

**spo-incentives** is a single-page SvelteKit application that allows users to explore and compare different rewards formulas for Cardano stake pools. Adjust parameters via sliders, toggle between different formulas, and see real-time updates of ROI bubbles on an interactive Chart.js plot.

## Features

- Real-time graph updates driven by reactive Svelte stores.
- Slider controls for protocol parameters (k, a0, L, L2).
- Toggle between different rewards formulas.
- Toggle zoom for detailed pledge/stake ranges.
- Show/hide custom pool and drag its bubble to simulate different pledge/stake.

## Tech Stack

- Framework: **SvelteKit**
- Language: **TypeScript**
- Charting: **Chart.js**
- Styling: **Tailwind CSS**
- Bundler: **Vite**
- Formatting & Linting: **Prettier**

## Getting Started

### Prerequisites

- Node.js >= 16
- npm (or yarn)
- Python (optional, for updating pool data)

### Installation

```bash
git clone <repository-url>
cd spo-incentives
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Usage

- **Sliders** adjust protocol parameters:
  - `k`: Desired number of pools (saturation parameter).
  - `a0`: Influence factor for pool pledge in reward formula.
  - `L`, `L2`: Additional slopes for linear/exponential formulas.
- **Formula** radio buttons switch between different formulas
- **Checkboxes** toggle pool groups and custom pool.
- **Toggle Zoom** focuses on low-range pledge/stake values.
- **Custom Pool** bubble can be dragged to simulate different values.

## Updating Pool Data

To refresh `pools.json` using Koios API and external MAV data:

```bash
cd src/lib/data
python fetch_pools.py
```

Requires `requests` Python package.

## Contributing

Please follow these guidelines:

- Maintain existing code style (TypeScript, Svelte, Tailwind).
- Run `npm run format` before committing.
- Open an issue or pull request for enhancements/bug fixes.

## License

This project is marked as private in `package.json`. Include a valid license if making it public.
