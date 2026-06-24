<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  'file-selected': [file: File]
  'file-rejected': []
}>()

const allowedExtensions = ['xls', 'xlsx', 'csv']
const allowedMimeTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]
const maxFileSize = 2 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const errorMessage = ref('')
const isDragging = ref(false)

const selectedFileSize = computed(() => {
  if (!selectedFile.value) {
    return ''
  }

  return `${(selectedFile.value.size / 1024 / 1024).toFixed(2)} MB`
})

function openFilePicker() {
  fileInput.value?.click()
}

function validateFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const hasValidExtension = Boolean(extension && allowedExtensions.includes(extension))
  const hasValidMime = !file.type || allowedMimeTypes.includes(file.type)

  if (!hasValidExtension) {
    return 'Solo se permiten archivos .xls, .xlsx o .csv.'
  }

  if (!hasValidMime) {
    return 'El tipo de archivo no coincide con un Excel o CSV valido.'
  }

  if (file.size > maxFileSize) {
    return 'El archivo no puede pesar mas de 2 MB.'
  }

  return ''
}

function handleFile(file?: File) {
  if (!file) {
    return
  }

  const validationError = validateFile(file)

  if (validationError) {
    selectedFile.value = null
    errorMessage.value = validationError
    emit('file-rejected')
    return
  }

  errorMessage.value = ''
  selectedFile.value = file
  emit('file-selected', file)
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  handleFile(input.files?.[0])
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  handleFile(event.dataTransfer?.files?.[0])
}
</script>

<template>
  <section
    class="group relative rounded-lg border border-dashed p-1 transition duration-200"
    :class="[
      isDragging
        ? 'border-neon-cyan bg-dark-800 shadow-neon'
        : 'border-dark-600 bg-dark-800/80 hover:border-neon-blue',
      errorMessage ? 'border-neon-pink' : '',
    ]"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div class="rounded-md border border-dark-700 px-6 py-9 text-center">
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        @change="handleInputChange"
      >

      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-neon-cyan/40 bg-dark-900 text-neon-cyan shadow-neon">
        <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>

      <div class="mt-5 space-y-2">
        <h2 class="text-xl font-semibold text-light-50">
          Arrastra tu archivo aqui
        </h2>
        <p class="text-sm text-light-100/70">
          XLS, XLSX o CSV hasta 2 MB
        </p>
      </div>

      <button
        class="mt-6 rounded-md border border-neon-blue/60 px-5 py-2.5 text-sm font-semibold text-neon-blue transition hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-800"
        type="button"
        @click="openFilePicker"
      >
        Seleccionar archivo
      </button>

      <div v-if="selectedFile" class="mt-6 rounded-md border border-dark-600 bg-dark-900 px-4 py-3 text-left">
        <p class="text-xs uppercase tracking-wide text-neon-cyan">
          Archivo seleccionado
        </p>
        <p class="mt-1 truncate text-sm font-medium text-light-50">
          {{ selectedFile.name }}
        </p>
        <p class="mt-1 text-xs text-light-100/60">
          {{ selectedFileSize }}
        </p>
      </div>

      <p v-if="errorMessage" class="mt-5 rounded-md border border-neon-pink/50 bg-dark-900 px-4 py-3 text-sm text-neon-pink">
        {{ errorMessage }}
      </p>
    </div>
  </section>
</template>
