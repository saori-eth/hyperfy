import { useDoppler } from '../hooks/useDoppler'
import { useEffect } from 'react'
import { CoinsIcon } from 'lucide-react'

export const TokenManager = ({ className, style }) => {
  const sdk = useDoppler()


  useEffect(() => {
    console.log('doppler sdk', sdk)
  }, [sdk])
  
  return (
    <div 
      className={className}
      style={style}
    >
      <CoinsIcon size='1.25rem' />
    </div>
  )
}