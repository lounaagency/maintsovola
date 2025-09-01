import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{error?: Error}> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{error?: Error}> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{error?: Error}> = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center p-6">
      <h1 className="text-xl font-semibold text-foreground mb-4">
        Une erreur s'est produite
      </h1>
      <p className="text-muted-foreground mb-4">
        L'application a rencontré un problème. Veuillez redémarrer l'application.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Redémarrer
      </button>
      {error && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Détails de l'erreur
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export default ErrorBoundary;