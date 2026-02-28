import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md">
                        <h2 className="text-2xl font-bold text-red-500 mb-2">¡Ups! Algo salió mal</h2>
                        <p className="text-gray-400 mb-6">
                            Ha ocurrido un error inesperado en la aplicación. Por favor, intenta recargar la página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Recargar Página
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-4 p-4 bg-black/30 rounded text-left text-xs text-red-300 overflow-auto max-h-40">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
