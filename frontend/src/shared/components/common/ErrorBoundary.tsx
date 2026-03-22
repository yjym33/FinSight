'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-12 border-none bg-red-50/50 dark:bg-red-950/20 text-center rounded-[32px] flex flex-col items-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-red-900 dark:text-red-100">오류가 발생했습니다</h3>
            <p className="text-slate-500 font-bold max-w-md mx-auto">
              데이터를 불러오는 중 문제가 발생했습니다. 일시적인 현상일 수 있으니 다시 시도해 주세요.
            </p>
          </div>
          <Button 
            onClick={this.handleReset}
            variant="outline" 
            className="mt-4 rounded-2xl gap-2 font-bold border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
