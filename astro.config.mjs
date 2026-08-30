// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    integrations: [
        starlight({

            locales: {
                root: {
                    label: '简体中文',
                    lang: 'zh-CN',
                },
            },
            title: '雪地语资料库',

            customCss: ['./src/styles/custom.css'],
            
                    sidebar: [
            {
                label: '语言',
                items: [
                    { label: '语言介绍', slug: 'introduction' },
                    { label: '音系', slug: 'phonology' },
                    { label: '词典', slug: 'dictionary' },
                ],
            },
            {
                label: '语法',
                items: [
                    { autogenerate: { directory: 'grammar' } },
                ],
            },
            {
                label: '例文',
                items: [
                    { autogenerate: { directory: 'texts' } },
                ],
            },
            {
                label: '文章',
                items: [
                    { autogenerate: { directory: 'articles' } },
                ],
            },
        ],
        }),
    ],
});