# AI Rules for Fiscal Obligations and Taxes Application

This document outlines the core technologies and library usage guidelines for developing and maintaining this application.

## Tech Stack Overview

*   **Framework**: Next.js for server-side rendering, routing, and API routes.
*   **Language**: TypeScript for type safety and improved code quality.
*   **Styling**: Tailwind CSS for all styling, ensuring a consistent and responsive design.
*   **UI Components**: shadcn/ui, built on Radix UI primitives, for a robust and accessible component library.
*   **Icons**: Lucide React for a comprehensive set of customizable SVG icons.
*   **State Management**: React's built-in `useState` and `useEffect` hooks for local component state.
*   **Form Handling**: React Hook Form for efficient form management and Zod for schema validation.
*   **Date Utilities**: `date-fns` for all date manipulation and formatting tasks.
*   **Data Visualization**: Recharts for creating interactive charts and graphs.
*   **Local Storage**: Browser's `localStorage` for client-side data persistence.
*   **Carousels**: Embla Carousel React for touch-friendly and flexible carousels.
*   **Toasts**: A custom toast notification system for user feedback.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following rules when using libraries:

*   **UI Components**: Always prioritize `shadcn/ui` components. If a specific component is not available or requires significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify `shadcn/ui` files directly.**
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or separate CSS files unless absolutely necessary for global styles (e.g., `app/globals.css`).
*   **Icons**: Use icons from the `lucide-react` library.
*   **Forms**: For any form creation and validation, use `react-hook-form` for form state management and `zod` for defining validation schemas.
*   **Date Operations**: All date parsing, formatting, and calculations should utilize functions from `date-fns`.
*   **Data Persistence**: For client-side data storage, use the `localStorage` API as implemented in `lib/storage.ts`.
*   **Charts**: When implementing data visualizations, use the `recharts` library.
*   **Carousels**: For any carousel or slider functionality, use `embla-carousel-react`.
*   **Toasts**: Use the custom toast notification system available via the `useToast` hook from `hooks/use-toast.ts` and the `Toast` components from `components/ui/toast.tsx` for all user feedback notifications.