<script setup lang="ts">
import {ref} from 'vue'
import FileDropzone from '../components/FileDropzone.vue'
import {uploadFile} from '../services/fileUploadService'

const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

function handleFileSelected(file: File) {
  selectedFile.value = file
  successMessage.value = ''
  errorMessage.value = ''
}

function handleFileRejected() {
  selectedFile.value = null
  successMessage.value = ''
  errorMessage.value = ''
}

async function submitFile() {
  if (!selectedFile.value || isUploading.value) {
    return
  }

  isUploading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await uploadFile(selectedFile.value)
    successMessage.value = 'Archivo enviado correctamente.'
    selectedFile.value = null
  } catch {
    errorMessage.value = 'No se pudo subir el archivo. Revisa la API e intenta nuevamente.'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-tech-gradient px-5 py-8 text-light-50 sm:px-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
      <div class="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div class="space-y-6">
          <div
              class="inline-flex rounded-md border border-neon-cyan/40 bg-dark-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neon-cyan shadow-neon">
            Call Analyzer
          </div>

          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-bold leading-tight text-neon-cyan sm:text-5xl">
              Carga inteligente de archivos Excel y CSV
            </h1>
            <p class="max-w-2xl text-base leading-7 text-light-100/80">
              Sube tus archivos de analisis para enviarlos a la API de Laravel. La interfaz valida formato y peso antes
              de iniciar la transferencia.
            </p>
          </div>

          <div class="grid gap-3 text-sm text-light-100/70 sm:grid-cols-3">
            <div class="rounded-md border border-dark-700 bg-dark-800/70 px-4 py-3">
              <p class="font-semibold text-neon-blue">Formatos</p>
              <p class="mt-1">XLS, XLSX, CSV</p>
            </div>
            <div class="rounded-md border border-dark-700 bg-dark-800/70 px-4 py-3">
              <p class="font-semibold text-neon-purple">Limite</p>
              <p class="mt-1">2 MB max.</p>
            </div>
            <div class="rounded-md border border-dark-700 bg-dark-800/70 px-4 py-3">
              <p class="font-semibold text-neon-cyan">API</p>
              <p class="mt-1">/files/upload</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-dark-700 bg-dark-900/80 p-5 shadow-2xl shadow-dark-900/60">
          <FileDropzone
              @file-selected="handleFileSelected"
              @file-rejected="handleFileRejected"
          />

          <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-light-100/65">
              El archivo se enviara como campo <span class="font-semibold text-neon-cyan">file</span>.
            </p>

            <button
                class="rounded-md bg-neon-cyan px-5 py-3 text-sm font-bold text-dark-900 transition hover:bg-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed disabled:bg-dark-700 disabled:text-light-100/40"
                type="button"
                :disabled="!selectedFile || isUploading"
                @click="submitFile"
            >
              {{ isUploading ? 'Subiendo...' : 'Subir archivo' }}
            </button>
          </div>

          <p v-if="successMessage"
             class="mt-5 rounded-md border border-neon-cyan/50 bg-dark-800 px-4 py-3 text-sm text-neon-cyan">
            {{ successMessage }}
          </p>

          <p v-if="errorMessage"
             class="mt-5 rounded-md border border-neon-pink/50 bg-dark-800 px-4 py-3 text-sm text-neon-pink">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
