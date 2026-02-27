'use client'

import dynamic from 'next/dynamic'

const GlobeComponent = dynamic(() => import('../components/GlobeComponent'), {
  ssr: false
})

export default function Home() {
  return <GlobeComponent />
}