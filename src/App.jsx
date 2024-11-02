import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import NotionBoard from './Components/NotionBoard.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <NotionBoard />
    </>
  )
}

export default App
