import { useState, useEffect } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { WalletIcon, XIcon } from 'lucide-react'

export const WalletConnect = ({ onConnect, className, style }) => {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [disconnectTimer, setDisconnectTimer] = useState(null)

  useEffect(() => {
    if (isConnected && onConnect) {
      onConnect(true)
    }
  }, [isConnected, onConnect])

  useEffect(() => {
    return () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer)
      }
    }
  }, [disconnectTimer])

  const handleConnect = () => {
    if (isConnected) {
      if (showDisconnect) {
        disconnect()
        setShowDisconnect(false)
        if (disconnectTimer) {
          clearTimeout(disconnectTimer)
          setDisconnectTimer(null)
        }
        if (onConnect) {
          onConnect(false)
        }
      } else {
        setShowDisconnect(true)
        const timer = setTimeout(() => {
          setShowDisconnect(false)
          setDisconnectTimer(null)
        }, 5000)
        setDisconnectTimer(timer)
      }
    } else {
      const injectedConnector = connectors.find(c => c.type === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      }
    }
  }

  return (
    <div 
      className={className}
      style={{
        ...style,
        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.3)' : undefined,
        borderColor: isConnected ? 'rgba(34, 197, 94, 0.5)' : undefined
      }}
      onClick={handleConnect}
    >
      {showDisconnect ? (
        <XIcon size='1.25rem' />
      ) : (
        <WalletIcon size='1.25rem' />
      )}
    </div>
  )
}