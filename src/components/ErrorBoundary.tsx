import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = `Firestore Error: ${parsedError.error} (${parsedError.operationType} on ${parsedError.path})`;
          }
        }
      } catch (e) { /* ignore */ }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-neon-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-neon-pink" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Application Error</h2>
            <p className="text-white/50 mb-8">{errorMessage}</p>
            <button onClick={() => window.location.reload()} className="btn-neon w-full flex items-center justify-center gap-2">
              <RefreshCcw size={18} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
