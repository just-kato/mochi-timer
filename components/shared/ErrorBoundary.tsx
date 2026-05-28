'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="px-4 py-8 text-center">
          <p className="font-medium text-zinc-900">Something went wrong.</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 text-sm underline text-zinc-500"
          >
            Refresh page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
