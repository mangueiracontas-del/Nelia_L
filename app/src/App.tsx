import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GoogleOneTap } from './components/auth/GoogleOneTap'
import { PhoneLogin } from './components/auth/PhoneLogin'

const AcompanharPedido = lazy(() =>
  import('./pages/AcompanharPedido').then((m) => ({ default: m.AcompanharPedido })),
)

export default function App() {
  return (
    <BrowserRouter>
      <GoogleOneTap />
      <Suspense fallback={<div className="p-6 text-gray-400">Carregando…</div>}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/pedido/:id" element={<AcompanharPedido />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function LoginPage() {
  return (
    <main className="min-h-screen bg-night flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-extrabold text-white">
        Lanchonete <span className="text-brand">Premium</span>
      </h1>
      <PhoneLogin />
      <p className="text-gray-500 text-sm">ou entre automaticamente com sua Conta Google</p>
    </main>
  )
}
