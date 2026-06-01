import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/30 py-10 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border p-8 space-y-6">
        <header className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="text-lg font-semibold text-[#1A3A6B]">ViandApp</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/politica-privacidad" className="text-primary hover:underline">Privacidad</Link>
            <Link href="/terminos" className="text-primary hover:underline">Términos</Link>
          </nav>
        </header>
        <article className="prose prose-sm max-w-none leading-relaxed">
          {children}
        </article>
      </div>
    </main>
  )
}
