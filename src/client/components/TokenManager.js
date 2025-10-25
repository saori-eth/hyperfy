import { useDoppler } from '../hooks/useDoppler'
import { useEffect, useState } from 'react'
import { CoinsIcon } from 'lucide-react'
import { css } from '@firebolt-dev/css'
import { cls } from './cls'

export const TokensButton = ({ world, activePane }) => {
  const { sdk } = useDoppler()

  useEffect(() => {
    console.log('doppler sdk', sdk)
  }, [sdk])
  
  const handleClick = () => {
    world.ui.togglePane('tokens')
  }
  
  return (
    <div 
      className="sidebar-btn"
      css={css`
        width: 2.75rem;
        height: 1.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
        cursor: pointer;
        
        .sidebar-btn-dot {
          display: none;
          position: absolute;
          top: 0.8rem;
          right: 0.2rem;
          width: 0.3rem;
          height: 0.3rem;
          border-radius: 0.15rem;
          background: white;
        }
        
        &:hover {
          cursor: pointer;
          color: white;
        }
        
        ${activePane === 'tokens' && `
          color: white;
          .sidebar-btn-dot {
            display: block;
          }
        `}
      `}
      onClick={handleClick}
    >
      <CoinsIcon size='1.25rem' />
      <div className='sidebar-btn-dot' />
    </div>
  )
}

function Content({ width = '20rem', hidden, children }) {
  return (
    <div
      className={cls('sidebar-content', { hidden })}
      css={css`
        width: ${width};
        pointer-events: auto;
        .sidebar-content-main {
          background: rgba(11, 10, 21, 0.85);
          border: 0.0625rem solid #2a2b39;
          backdrop-filter: blur(5px);
          border-radius: 1rem;
          padding: 1rem;
          height: 100%;
        }
        &.hidden {
          display: none;
        }
      `}
    >
      <div className='sidebar-content-main'>{children}</div>
    </div>
  )
}

export const TokensPane = ({ world, hidden }) => {
  const { sdk, createStaticAuction } = useDoppler()
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState('')

  const handleCreateAuction = async () => {
    if (!sdk) {
      setStatus('SDK not initialized. Please connect your wallet.')
      return
    }

    try {
      setIsCreating(true)
      setStatus('Creating dynamic auction...')
      
      const result = await createStaticAuction()
      
      setStatus(`Auction created successfully! Hook: ${result.hookAddress}, Token: ${result.tokenAddress}`)
    } catch (error) {
      console.error('Failed to create auction:', error)
      setStatus(`Failed to create auction: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Content hidden={hidden}>
      <div css={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}>
        <h2 css={css`
          color: white;
          margin: 0;
          font-size: 1.2rem;
        `}>
          Token Manager
        </h2>
        
        <button
          onClick={handleCreateAuction}
          disabled={isCreating || !sdk}
          css={css`
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            font-size: 0.9rem;
            
            &:hover:not(:disabled) {
              background: #4338ca;
            }
            
            &:disabled {
              background: #6b7280;
              cursor: not-allowed;
            }
          `}
        >
          {isCreating ? 'Creating...' : 'Create Dynamic Auction'}
        </button>
        
        {status && (
          <div css={css`
            color: white;
            font-size: 0.8rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 0.25rem;
            word-break: break-all;
          `}>
            {status}
          </div>
        )}
      </div>
    </Content>
  )
}