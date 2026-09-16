import React, { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class SceneErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SceneErrorBoundary caught runtime crash:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-[#0D0A14] text-white p-6 select-none">
          <div className="max-w-md w-full bg-[#181324] border border-[#3E325E] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              {this.props.fallbackTitle || 'Scene Viewport Recovered'}
            </h3>

            <p className="text-xs text-[#A09BB5] leading-relaxed mb-4">
              An unexpected render issue was safely intercepted to prevent a blank screen. You can restore default viewport settings below.
            </p>

            {this.state.error && (
              <div className="w-full bg-[#100D18] border border-[#2E2548] rounded-xl p-2.5 mb-5 text-left overflow-x-auto max-h-24">
                <code className="text-[11px] font-mono text-red-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </code>
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleRecover}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8C7BFF] to-[#6A54E8] hover:from-[#9D8EFF] hover:to-[#7B66FF] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#8C7BFF]/25"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Viewport</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
