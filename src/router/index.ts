import { createRouter, createWebHistory } from 'vue-router'
import UploadFileView from '../views/UploadFileView.vue'

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
      component: UploadFileView,
    },
  ],
})

export default router
