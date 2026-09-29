import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { carregarDia, dataDeHoje } from './armazenamento/dia.ts'

const campo = () => screen.getByLabelText('Texto do dia') as HTMLTextAreaElement

/** Simula o que o navegador faz ao digitar (ou colar) um texto no campo. */
function digitar(valor: string, inputType = 'insertText') {
  fireEvent.input(campo(), { target: { value: valor }, inputType })
}

beforeEach(() => {
  localStorage.clear()
  // Só a data é falsa; os temporizadores continuam reais.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 29, 16, 5))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('tela da prova de conceito', () => {
  it('mostra o editor, os 5 botões de humor e 5 células de calendário', () => {
    render(<App />)
    expect(campo()).toBeInTheDocument()
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: `Humor ${n}` })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('img', { name: /^Dia \d+/ })).toHaveLength(5)
  })

  it('o texto salvo aparece ao reabrir', () => {
    const { unmount } = render(<App />)
    digitar('bom dia')
    unmount()

    render(<App />)
    expect(campo().value).toBe('bom dia')
    expect(carregarDia(dataDeHoje())).toBe('bom dia')
  })

  it('o botão de humor insere humor/N e salva', () => {
    render(<App />)
    digitar('oi')
    fireEvent.click(screen.getByRole('button', { name: 'Humor 4' }))
    expect(campo().value).toBe('humor/4\noi')
    expect(carregarDia(dataDeHoje())).toBe('humor/4\noi')
  })

  it('o botão de humor troca o humor que já existe', () => {
    render(<App />)
    digitar('humor/4\noi')
    fireEvent.click(screen.getByRole('button', { name: 'Humor 2' }))
    expect(campo().value).toBe('humor/2\noi')
  })

  it('digitar um segundo humor/ insere hora/ com a hora atual', () => {
    render(<App />)
    digitar('hora/14:32\nhumor/4\n\nhumor/3')
    expect(campo().value).toBe('hora/14:32\nhumor/4\n\nhora/16:05\nhumor/3')
    expect(screen.queryByText(/Já havia um humor/)).not.toBeInTheDocument()
  })

  it('colar um segundo humor/ não insere hora/: o parser abre bloco sem horário e avisa', () => {
    render(<App />)
    digitar('hora/14:32\nhumor/4\n\nhumor/3', 'insertFromPaste')
    expect(campo().value).toBe('hora/14:32\nhumor/4\n\nhumor/3')
    expect(screen.getByText(/Já havia um humor/)).toBeInTheDocument()
  })

  it('comando inválido aparece como aviso discreto', () => {
    render(<App />)
    digitar('humor/7')
    expect(screen.getByText(/Humor inválido/)).toBeInTheDocument()
  })
})

describe('navegação entre dias', () => {
  const clicar = (nome: string) => fireEvent.click(screen.getByRole('button', { name: nome }))

  it('começa em hoje e mostra a data por extenso', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /terça-feira, 29 de setembro de 2026/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoje' })).toBeDisabled()
  })

  it('vai para o dia anterior e para o seguinte', () => {
    render(<App />)
    clicar('‹ Anterior')
    expect(screen.getByRole('heading', { name: /segunda-feira, 28 de setembro/ })).toBeInTheDocument()
    clicar('Seguinte ›')
    clicar('Seguinte ›')
    expect(screen.getByRole('heading', { name: /quarta-feira, 30 de setembro/ })).toBeInTheDocument()
  })

  it('cada dia mostra o seu próprio texto e nada se perde ao ir e voltar', () => {
    render(<App />)
    digitar('texto de hoje')
    clicar('‹ Anterior')
    expect(campo().value).toBe('') // ontem está vazio
    digitar('texto de ontem')
    clicar('Seguinte ›')
    expect(campo().value).toBe('texto de hoje')
    clicar('‹ Anterior')
    expect(campo().value).toBe('texto de ontem')
    expect(carregarDia('2026-09-29')).toBe('texto de hoje')
    expect(carregarDia('2026-09-28')).toBe('texto de ontem')
  })

  it('só olhar um dia não grava nada', () => {
    render(<App />)
    clicar('‹ Anterior')
    clicar('‹ Anterior')
    expect(localStorage.length).toBe(0)
  })

  it('o botão de humor age no dia que está aberto', () => {
    render(<App />)
    clicar('‹ Anterior')
    fireEvent.click(screen.getByRole('button', { name: 'Humor 3' }))
    expect(carregarDia('2026-09-28')).toBe('humor/3\n')
    expect(carregarDia('2026-09-29')).toBe('')
  })

  it('o seletor de data leva a qualquer dia e o botão Hoje volta', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Ir para o dia'), { target: { value: '2026-01-10' } })
    expect(screen.getByRole('heading', { name: /sábado, 10 de janeiro de 2026/ })).toBeInTheDocument()
    expect(screen.getByText('10/01')).toBeInTheDocument()
    clicar('Hoje')
    expect(screen.getByRole('heading', { name: /29 de setembro/ })).toBeInTheDocument()
  })

  it('ao limpar o seletor de data, continua no mesmo dia', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Ir para o dia'), { target: { value: '' } })
    expect(screen.getByRole('heading', { name: /29 de setembro/ })).toBeInTheDocument()
  })
})

describe('calendário: o dia aberto, 2 antes e 2 depois', () => {
  const dias = () => screen.getAllByRole('img', { name: /^Dia \d+/ }).map((c) => c.getAttribute('aria-label'))

  it('mostra 5 dias em ordem, virando o mês', () => {
    render(<App />)
    expect(dias()).toEqual([
      'Dia 27, sem humor',
      'Dia 28, sem humor',
      'Dia 29, sem humor',
      'Dia 30, sem humor',
      'Dia 1, sem humor',
    ])
  })

  it('só o dia aberto tem o contorno (aria-current)', () => {
    render(<App />)
    const atuais = screen.getAllByRole('img', { name: /^Dia \d+/ }).filter((c) => c.hasAttribute('aria-current'))
    expect(atuais).toHaveLength(1)
    expect(atuais[0]).toHaveAttribute('aria-label', 'Dia 29, sem humor')
  })

  it('os dias vizinhos mostram os humores salvos neles', () => {
    localStorage.setItem('diario:2026-09-28', JSON.stringify({ data: '2026-09-28', texto: 'humor/2' }))
    localStorage.setItem('diario:2026-10-01', JSON.stringify({ data: '2026-10-01', texto: 'humor/4\nhora/10:00\nhumor/5' }))
    render(<App />)
    expect(dias()).toEqual([
      'Dia 27, sem humor',
      'Dia 28, humor 2',
      'Dia 29, sem humor',
      'Dia 30, sem humor',
      'Dia 1, humor 4, 5',
    ])
  })

  it('a célula do dia aberto acompanha o que se digita', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Humor 3' }))
    expect(dias()[2]).toBe('Dia 29, humor 3')
  })

  it('o calendário acompanha a navegação', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte ›' }))
    expect(dias()).toEqual([
      'Dia 28, sem humor',
      'Dia 29, sem humor',
      'Dia 30, sem humor',
      'Dia 1, sem humor',
      'Dia 2, sem humor',
    ])
  })
})

describe('autocomplete do hora/', () => {
  it('enquanto a pessoa está na linha, o hora/ fica como está (dá para digitar a própria hora)', () => {
    render(<App />)
    digitar('hora/')
    expect(campo().value).toBe('hora/')
    digitar('hora/9:30')
    expect(campo().value).toBe('hora/9:30')
  })

  it('ao apertar Enter num hora/ vazio, completa com a hora atual', () => {
    render(<App />)
    digitar('hora/\n', 'insertLineBreak')
    expect(campo().value).toBe('hora/16:05\n')
    expect(screen.queryByText(/Hora inválida/)).not.toBeInTheDocument()
  })

  it('ao mover o cursor para outra linha, completa', () => {
    render(<App />)
    digitar('abc\nhora/')
    campo().setSelectionRange(0, 0)
    fireEvent.select(campo())
    expect(campo().value).toBe('abc\nhora/16:05')
  })

  it('ao sair do campo, completa também a linha do cursor', () => {
    render(<App />)
    digitar('hora/')
    fireEvent.blur(campo())
    expect(campo().value).toBe('hora/16:05')
    expect(carregarDia(dataDeHoje())).toBe('hora/16:05')
  })

  it('não muda um hora/ que a pessoa já preencheu', () => {
    render(<App />)
    digitar('hora/8:15\nabc')
    fireEvent.blur(campo())
    expect(campo().value).toBe('hora/8:15\nabc')
  })

  it('o bloco completado vira um bloco com horário na leitura', () => {
    render(<App />)
    digitar('hora/\nfui almoçar', 'insertLineBreak')
    expect(screen.getByText(/Bloco das 16:05/)).toBeInTheDocument()
  })
})
