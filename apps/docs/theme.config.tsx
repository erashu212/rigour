import React from 'react'

const config = {
    logo: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                🛡️ RIGOUR
            </span>
            <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>LABS</span>
        </div>
    ),
    project: {
        link: 'https://github.com/rigour-labs/rigour',
    },
    docsRepositoryBase: 'https://github.com/rigour-labs/rigour/tree/main/apps/docs',
    sidebar: {
        defaultMenuCollapsed: false,
    },
    footer: {
        text: (
            <span>
                {new Date().getFullYear()} ©{' '}
                <a href="https://rigour.run" target="_blank">
                    Rigour Labs
                </a>
                . Engineered with precision.
            </span>
        ),
    },
    useNextSeoProps() {
        return {
            titleTemplate: '%s – Rigour'
        }
    },
    head: (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta property="og:title" content="Rigour" />
            <meta property="og:description" content="The Quality Gate Loop for AI-Assisted Engineering" />
        </>
    ),
}

export default config
