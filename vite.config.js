import { defineConfig } from 'vite'

export default defineConfig({
    base: '/migraine-calendar/',
    server: {
        watch: {
            ignored: ['**/.vs/**']
        }
    }
})