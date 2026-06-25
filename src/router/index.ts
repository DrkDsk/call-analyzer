import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/upload-file',
        },
        {
            path: '/upload-file',
            name: 'upload-file',
            component: () => import('../views/UploadFileView.vue'),
        },
        {
            path: '/analyze-summary/:id',
            name: 'analyze-summary',
            component: () => import('../views/AnalyzeSummaryView.vue'),
        }
    ],
})

export default router
