import { Suspense, Component, ReactNode } from 'react';
import { LoadingSpinner } from './loading-spinner';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingText?: string;
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{error.message}</p>
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryComponent extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <DefaultErrorFallback error={this.state.error} retry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

export function AsyncBoundary({ 
  children, 
  fallback, 
  errorFallback,
  loadingText = "Loading..."
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundaryComponent onError={(error) => console.error('AsyncBoundary error:', error)}>
      <Suspense fallback={fallback || <LoadingSpinner text={loadingText} />}>
        {children}
      </Suspense>
    </ErrorBoundaryComponent>
  );
}