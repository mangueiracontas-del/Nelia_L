import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * Login por telefone: envia OTP via SMS e valida o código.
 * O telefone fica salvo no perfil (handle_new_user no SQL).
 */
export function PhoneLogin() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    // E.164 mínimo exigido pelo Supabase (ex.: +5511999998888)
    const e164 = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`

    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
    setCarregando(false)

    if (error) setErro('Não foi possível enviar o código. Verifique o número.')
    else setEnviado(true)
  }

  async function verificarCodigo(e: FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const e164 = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: 'sms',
    })
    setCarregando(false)

    if (error) setErro('Código inválido ou expirado. Tente novamente.')
  }

  return (
    <form
      onSubmit={enviado ? verificarCodigo : enviarCodigo}
      className="w-full max-w-sm space-y-4"
      aria-label="Login com telefone"
    >
      <h2 className="text-xl font-bold text-white">Entrar com telefone</h2>

      <div>
        <label htmlFor="telefone" className="sr-only">Telefone</label>
        <input
          id="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-8888"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={enviado}
          required
          className="input-min"
        />
      </div>

      {enviado && (
        <div>
          <label htmlFor="otp" className="sr-only">Código de verificação</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Código de 6 dígitos"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="input-min text-center tracking-[0.5em] text-lg"
          />
        </div>
      )}

      {erro && (
        <p role="alert" className="text-sm text-red-400">{erro}</p>
      )}

      <button type="submit" disabled={carregando} className="btn-convert w-full disabled:opacity-60">
        {carregando ? 'Aguarde…' : enviado ? 'Confirmar código' : 'Receber código'}
      </button>
    </form>
  )
}
