import { lazy } from 'react';

// Lazy load pages for code splitting
export const LazyHomepage = lazy(() => import('./pages/Homepage'));
export const LazyShopIndex = lazy(() => import('./pages/shop/ShopIndex'));
export const LazyShopCategories = lazy(() => import('./pages/shop/ShopCategories'));
export const LazyCategoryPage = lazy(() => import('./pages/shop/CategoryPage'));
export const LazyShopCart = lazy(() => import('./pages/shop/ShopCart'));
export const LazyShopCheckout = lazy(() => import('./pages/shop/ShopCheckout'));
export const LazyOrderTrack = lazy(() => import('./pages/shop/OrderTrack'));
export const LazyOrderSuccess = lazy(() => import('./pages/shop/OrderSuccess'));
export const LazyShopHowItWorks = lazy(() => import('./pages/shop/ShopHowItWorks'));
export const LazyShopSearch = lazy(() => import('./pages/shop/ShopSearch'));
export const LazyShopOrder = lazy(() => import('./pages/shop/ShopOrder'));

// Admin and Dashboard pages
export const LazyMainDashboard = lazy(() => import('./pages/MainDashboard'));
export const LazyAdmin = lazy(() => import('./pages/Admin'));
export const LazyCustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
export const LazyShopperDashboard = lazy(() => import('./pages/ShopperDashboard'));
export const LazyDriverDashboard = lazy(() => import('./pages/DriverDashboard'));
export const LazyStoreManagerDashboard = lazy(() => import('./pages/StoreManagerDashboard'));
export const LazyConciergeDashboard = lazy(() => import('./pages/ConciergeDashboard'));

// Other pages
export const LazyAuth = lazy(() => import('./pages/Auth'));
export const LazyProfile = lazy(() => import('./pages/Profile'));
export const LazyBotTesting = lazy(() => import('./pages/BotTesting'));
export const LazyOrderWorkflowDashboard = lazy(() => import('./pages/OrderWorkflowDashboard'));
export const LazyWorkflowTesting = lazy(() => import('./pages/WorkflowTesting'));
export const LazyProductionReadiness = lazy(() => import('./pages/ProductionReadiness'));
export const LazyIntegrationPlan = lazy(() => import('./pages/IntegrationPlan'));
export const LazySystemArchitecture = lazy(() => import('./pages/SystemArchitecture'));
export const LazySitemap = lazy(() => import('./pages/Sitemap'));
export const LazyNotFound = lazy(() => import('./pages/NotFound'));
