import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GuideLine from './component/GuideLine'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 해당 위치에 react component 추가 
      <GuideLine /> 
    */}
  </StrictMode>,
)