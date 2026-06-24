import { createRouter, createWebHistory } from 'vue-router'
import UploadFileView from '../views/UploadFileView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'upload-file',
      component: UploadFileView,
    },
  ],
})

export default router
