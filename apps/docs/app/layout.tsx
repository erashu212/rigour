import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import React from 'react'
import 'nextra-theme-docs/style.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const pageMap = await getPageMap()

    const logo = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                🛡️ RIGOUR
            </span>
            <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>LABS</span>
        </div>
    )

    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <Head />
            <body className="antialiased">
                <Layout
                    navbar={<Navbar logo={logo} projectLink="https://github.com/rigour-labs/rigour" />}
                    footer={
                        <Footer>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                {new Date().getFullYear()} ©{' '}
                                <a href="https://rigour.run" target="_blank" rel="noopener">
                                    Rigour Labs
                                </a>
                                . Engineered with precision.
                            </div>
                        </Footer>
                    }
                    pageMap={pageMap}
                >
                    {children}
                </Layout>
            </body>
        </html>
    )
}
