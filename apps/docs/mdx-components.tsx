import { useMDXComponents as getNextraMDXComponents } from 'nextra-theme-docs'

export function useMDXComponents(components) {
    return {
        ...getNextraMDXComponents(components)
    }
}
