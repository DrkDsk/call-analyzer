<script setup lang="ts">
import {computed, ref} from 'vue'
import FileDropzone from '../components/FileDropzone.vue'
import {
  analyzePhoneEventsFile,
  type ImportResult,
  type PhoneEventsSummary,
} from '../services/fileUploadService'
import {useRouter} from "vue-router";
import {formatDuration, formatNumber} from "../helpers/numberHelper";

const selectedFile = ref<File | null>(null)
const isPreviewing = ref(false)
const isSaving = ref(false)
const summary = ref<PhoneEventsSummary | null>(null)
const persistedImport = ref<ImportResult | null>(null)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const router = useRouter();

const summaryCards = computed(() => {
  if (!summary.value) {
    return []
  }

  return [
    {label: 'Total eventos', value: formatNumber(summary.value.total_events)},
    {label: 'Total llamadas', value: formatNumber(summary.value.total_calls)},
    {label: 'Total datos', value: formatNumber(summary.value.total_data)},
    {label: 'Duración total', value: formatDuration(summary.value.total_duration)},
    {label: 'Promedio duración', value: formatDuration(summary.value.average_duration)},
    {label: 'Contactos únicos', value: formatNumber(summary.value.unique_contacts)},
    {label: 'Contacto principal', value: summary.value.top_contact ?? 'Sin datos'},
    {label: 'Hora pico', value: summary.value.peak_hour ?? 'Sin datos'},
    {label: 'Días activos', value: formatNumber(summary.value.active_days)},
  ]
})

const saveButtonText = computed(() => {
  if (isSaving.value) {
    return 'Guardando...'
  }

  if (persistedImport.value) {
    return 'Analisis guardado'
  }

  return 'Guardar analisis'
})

function clearAnalysisState() {
  summary.value = null
  persistedImport.value = null
  errorMessage.value = null
  successMessage.value = null
}

async function handlePreview(file: File) {
  selectedFile.value = file
  clearAnalysisState()

  isPreviewing.value = true

  try {
    const response = await analyzePhoneEventsFile(file, false)
    summary.value = response.data.summary
    persistedImport.value = null
  } catch {
    summary.value = null
    errorMessage.value = 'No se pudo analizar el archivo. Revisa el formato e intenta nuevamente.'
  } finally {
    isPreviewing.value = false
  }
}

function handleFileRejected() {
  selectedFile.value = null
  clearAnalysisState()
}

async function handleSaveAnalysis() {
  if (!selectedFile.value || isSaving.value || persistedImport.value) {
    return
  }

  isSaving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await analyzePhoneEventsFile(selectedFile.value, true)
    summary.value = response.data.summary
    persistedImport.value = response.data.import
    successMessage.value = 'Analisis guardado correctamente.'
  } catch {
    errorMessage.value = 'No se pudo guardar el analisis. El preview se conserva para que puedas intentar de nuevo.'
  } finally {
    isSaving.value = false
  }
}

async function goToSummary(id: number) {
  router.push({
    name: 'analyze-summary',
    params: {
      id,
    },
  });
}
</script>

<template>
  <main class="min-h-screen bg-tech-gradient px-5 py-8 text-light-50 sm:px-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
      <div class="grid w-full gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div class="space-y-6 lg:pt-8">
          <div
              class="inline-flex rounded-md border border-neon-cyan/40 bg-dark-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neon-cyan shadow-neon"
          >
            Call Analyzer
          </div>

          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-bold leading-tight text-neon-cyan sm:text-5xl">
              Analisis de eventos telefonicos
            </h1>
            <p class="max-w-2xl text-base leading-7 text-light-100/80">
              Carga un archivo Excel o CSV para previsualizar el resumen. Cuando todo luzca correcto, guarda el analisis
              en imports con una segunda confirmacion.
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
          </div>
        </div>

        <div class="space-y-5">
          <div class="rounded-lg border border-dark-700 bg-dark-900/80 p-5 shadow-2xl shadow-dark-900/60">
            <FileDropzone
                @file-selected="handlePreview"
                @file-rejected="handleFileRejected"
            />

            <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span
                    v-if="isPreviewing"
                    class="rounded-md border border-neon-blue/40 bg-dark-800 px-4 py-3 text-sm font-semibold text-neon-blue"
                >
                  Analizando...
                </span>

                <button
                    v-if="summary && selectedFile"
                    class="rounded-md bg-neon-cyan px-5 py-3 text-sm font-bold text-dark-900 transition hover:bg-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed disabled:bg-dark-700 disabled:text-light-100/40"
                    type="button"
                    :disabled="isSaving || Boolean(persistedImport)"
                    @click="handleSaveAnalysis"
                >
                  {{ saveButtonText }}
                </button>

                <button
                    v-if="persistedImport"
                    class="rounded-md bg-neon-cyan px-5 py-3 text-sm font-bold text-dark-900 transition hover:bg-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed disabled:bg-dark-700 disabled:text-light-100/40"
                    type="button"
                    @click="goToSummary(persistedImport.id)"
                >
                  Ir a resumen
                </button>
              </div>
            </div>

            <p
                v-if="successMessage"
                class="mt-5 rounded-md border border-neon-cyan/50 bg-dark-800 px-4 py-3 text-sm text-neon-cyan"
            >
              {{ successMessage }}
              <span v-if="persistedImport" class="block pt-1 text-light-100/70">
                Import #{{ persistedImport.id }} | {{ persistedImport.status }} | {{ persistedImport.progress }}%
              </span>
            </p>

            <p
                v-if="errorMessage"
                class="mt-5 rounded-md border border-neon-pink/50 bg-dark-800 px-4 py-3 text-sm text-neon-pink"
            >
              {{ errorMessage }}
            </p>
          </div>

          <section
              v-if="summary"
              class="rounded-lg border border-dark-700 bg-dark-900/80 p-5 shadow-2xl shadow-dark-900/40"
          >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neon-purple">
                  Preview
                </p>
                <h2 class="mt-1 text-2xl font-bold text-light-50">
                  Resumen del análisis
                </h2>
              </div>

              <p v-if="selectedFile" class="truncate text-sm text-light-100/60">
                {{ selectedFile.name }}
              </p>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div
                  v-for="card in summaryCards"
                  :key="card.label"
                  class="rounded-md border border-dark-700 bg-dark-800/75 px-4 py-4"
              >
                <p class="text-xs font-semibold uppercase tracking-wide text-light-100/50">
                  {{ card.label }}
                </p>
                <p class="mt-2 break-words text-2xl font-bold text-neon-cyan">
                  {{ card.value }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>
