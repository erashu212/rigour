import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('nextra')

export async function generateMetadata(props: { params: Promise<{ nextra: string[] }> }) {
    const params = await props.params
    const { metadata } = await importPage(params.nextra)
    return metadata
}

export default async function Page(props: { params: Promise<{ nextra: string[] }> }) {
    const params = await props.params
    const { default: MDXContent, toc, metadata } = await importPage(params.nextra)
    const components = useMDXComponents({})
    const Wrapper = components.wrapper as React.FC<{ children: React.ReactNode; toc: any; metadata: any }>

    return (
        <Wrapper toc={toc} metadata={metadata}>
            <MDXContent {...props} params={params} />
        </Wrapper>
    )
}
