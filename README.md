# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/51359302-63a1-483f-94b9-44f05ac67174

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/51359302-63a1-483f-94b9-44f05ac67174) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/51359302-63a1-483f-94b9-44f05ac67174) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## Work Tracker: E-commerce Shopping Cart System (2025-08-27)

The following project and tasks have been documented in the in-app Work Tracker (/work-tracker):

- Database Integration & Migration — done
- Product Management System — done
- Enhanced Shopping Cart — done
- Checkout Flow Implementation — done
- Order Processing & Success — done
- Search & Navigation — done
- User Experience & Polish — done
- AI Inventory System — done

Quick test routes:
- Shop home: /shop
- Search: /shop/search
- Category: /shop/category/:id
- Cart: /shop/cart
- Checkout: /shop/checkout
- Order success: /shop/order/success?orderId=...

Security note: Supabase linter reports an OTP expiry warning (platform setting). Review and adjust in your Supabase Dashboard if needed: https://supabase.com/docs/guides/platform/going-into-prod#security
