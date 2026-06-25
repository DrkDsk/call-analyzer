<script setup lang="ts">

import {computed, ref} from "vue";
import {AnalyzePhoneEventsResponse, loadAnalyzeEvents} from "../services/fileUploadService";
import {useRoute} from "vue-router";
import {formatDuration, formatNumber} from "../helpers/numberHelper";

const analyzeEvent = ref<AnalyzePhoneEventsResponse | null>(null)

const route = useRoute();
const importId = Number(route.params.id);

const originalFilename = computed(() => {
  const data = analyzeEvent.value?.data.import;

  if (!data) {
    return 'Archivo desconocido';
  }

  return data.original_filename;
})

const summaryCards = computed(() => {
  if (!analyzeEvent.value) {
    return []
  }

  const summary = analyzeEvent.value.data.summary;

  return [
    {label: 'Total eventos', value: formatNumber(summary.total_events)},
    {label: 'Total llamadas', value: formatNumber(summary.total_calls)},
    {label: 'Total datos', value: formatNumber(summary.total_data)},
    {label: 'Duración total', value: formatDuration(summary.total_duration)},
    {label: 'Promedio duración', value: formatDuration(summary.average_duration)},
    {label: 'Contactos únicos', value: formatNumber(summary.unique_contacts)},
    {label: 'Contacto principal', value: summary.top_contact ?? 'Sin datos'},
    {label: 'Hora pico', value: summary.peak_hour ?? 'Sin datos'},
    {label: 'Días activos', value: formatNumber(summary.active_days)},
  ]
})

const loadAnalyzeEventsData = async () => {
  analyzeEvent.value = await loadAnalyzeEvents(importId)
}

loadAnalyzeEventsData()

</script>

<template>
  <main class="min-h-screen bg-tech-gradient px-5 py-8 text-light-50 sm:px-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center">
      <div class="grid w-full gap-8 lg:grid-cols-1 lg:items-start">
        <div class="space-y-5">
          <section
              v-if="analyzeEvent"
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

              <p class="truncate text-sm text-light-100/60">
                {{ originalFilename }}
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

<style scoped>

</style>