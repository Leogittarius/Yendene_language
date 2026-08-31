// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    integrations: [
        starlight({
            title: '雪地语资料库',

            locales: {
                root: {
                    label: '简体中文',
                    lang: 'zh-CN',
                },
            },

            customCss: ['./src/styles/custom.css'],

            sidebar: [
                {
                    label: '关于',
                    items: [
                        {
                            label: '资料库介绍',
                            slug: 'about',
                        },
                        {
                            label: '语言介绍',
                            slug: 'introduction',
                        },
                    ],
                },

                {
                    label: '语言资料',
                    items: [
                        {
                            label: '音系',
                            slug: 'phonology',
                        },
                    ],
                },

                {
                    label: '语法',
                    items: [
                        {
                            autogenerate: {
                                directory: 'grammar',
                            },
                        },
                    ],
                },

                {
                    label: '例文',
                    items: [
                        {
                            autogenerate: {
                                directory: 'texts',
                            },
                        },
                    ],
                },

                {
                    label: '世界观与其他资料',
                    items: [
                        {
                            autogenerate: {
                                directory: 'world',
                            },
                        },
                    ],
                },

                {
                    label: '工具',
                    items: [
                        {
                            label: '词典',
                            slug: 'dictionary',
                        },
                        {
                            label: '词条生成器',
                            slug: 'tools/entry-builder',
                        },
                        {
                            label: '词典维护',
                            slug: 'tools/dictionary-maintenance',
                        },
                        
                    ],
                },

                {
                    label: '出版物',
                    items: [
                        {
                            label: '雪地语语法书',
                            link: '/files/yendene-grammar.pdf',
                            badge: 'PDF',
                            attrs: {
                                target: '_blank',
                                rel: 'noopener noreferrer',
                            },
                        },
                    ],
                },
            ],
        }),
    ],
});