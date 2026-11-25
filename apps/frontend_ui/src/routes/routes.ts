import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/_public/HomePage';
import { NotFoundPage } from '@/pages/_public/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [{ index: true, Component: HomePage }],
  },
  { path: '*', Component: NotFoundPage },
]);
