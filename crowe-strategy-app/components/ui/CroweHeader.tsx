/* eslint-disable @next/next/no-img-element */
'use client'

/**
 * CroweHeader — barra superior ao estilo do site crowe.com/pt:
 * fundo branco, logo oficial à esquerda com "Strategy Studio",
 * botão navy "Contacte-nos" à direita.
 */
export default function CroweHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10"
      style={{
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E0E5EE',
      }}
    >
      <a href="/diagnostico" className="flex items-center gap-3">
        <img src="/crowe-logo.svg" alt="Crowe" style={{ height: 26, width: 'auto' }} />
        <span
          style={{
            borderLeft: '1px solid #D5DBE7',
            paddingLeft: 12,
            color: '#002D62',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Strategy Studio
        </span>
      </a>
      <a
        href="https://www.crowe.com/pt/contacte-nos"
        target="_blank"
        rel="noopener"
        className="transition-opacity hover:opacity-90"
        style={{
          background: '#002D62',
          color: '#FFFFFF',
          padding: '9px 22px',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        Contacte-nos
      </a>
    </header>
  )
}
