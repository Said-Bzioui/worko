import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found.</p>
      <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
        Back to Home
      </Link>
    </div>
  );
}
