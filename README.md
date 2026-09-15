# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Project Layout

- `src/` contains the React frontend.
- `backend/` contains the existing backend service and blockchain integration.
- `backend/fastapi/` contains the FastAPI service imported from the `Military_Box_backend` repository.

To run the imported FastAPI service, install `backend/fastapi/requirements.txt` and start it from that directory with `uvicorn app.main:app --reload`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
