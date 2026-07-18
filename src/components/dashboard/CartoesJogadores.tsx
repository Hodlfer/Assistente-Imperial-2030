import type { Estado } from '../../engine'
import { CartaoJogador } from './CartaoJogador'

interface Props {
  estado: Estado
}

export function CartoesJogadores({ estado }: Props) {
  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {estado.jogadores.map((jogador) => (
        <CartaoJogador key={jogador.id} estado={estado} jogador={jogador} />
      ))}
    </section>
  )
}
