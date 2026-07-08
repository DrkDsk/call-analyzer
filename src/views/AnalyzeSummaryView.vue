<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {
  loadAnalyzeEvents,
  loadPhoneEvents,
  type AnalyzePhoneEventsResponse,
  type PhoneEvent,
  type PhoneEventsPaginatedResponse,
} from "../services/fileUploadService";
import {useRoute} from "vue-router";
import {formatDuration, formatNumber} from "../helpers/numberHelper";

const analyzeEvent = ref<AnalyzePhoneEventsResponse | null>(null)
const phoneEvents = ref<PhoneEvent[]>([])
const phoneEventsPagination = ref<PhoneEventsPaginatedResponse | null>(null)
const isLoadingAnalyzeSummary = ref(false)
const isLoadingPhoneEvents = ref(false)
const errorMessage = ref<string | null>(null)
const phoneEventsError = ref<string | null>(null)

const route = useRoute();
const importId = Number(route.params.id);

const originalFilename = computed(() => {
  const data = analyzeEvent.value?.data.import;

  if (!data) {
    return 'Archivo desconocido';
  }

  return data.original_filename;
})

const eventTypeCards = computed(() => [
  {
    label: 'Llamadas Totales',
    value: analyzeEvent.value?.data.summary.total_calls ?? 0,
    accentClass: 'text-neon-blue',
  },
  {
    label: 'Mensajes Totales',
    value: analyzeEvent.value?.data.summary.total_messages ?? 0,
    accentClass: 'text-neon-purple',
  },
  {
    label: 'Datos Totales',
    value: analyzeEvent.value?.data.summary.total_data ?? 0,
    accentClass: 'text-neon-cyan',
  },
])

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

const phoneEventsMeta = computed(() => phoneEventsPagination.value?.meta ?? null)

const phoneEventsPageLinks = computed(() => {
  return phoneEventsMeta.value?.links.filter((link) => link.page !== null && /^\d+$/.test(link.label)) ?? []
})

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin datos'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const loadAnalyzeEventsData = async () => {
  if (!importId) {
    errorMessage.value = 'No se encontro el identificador del analisis.'
    return
  }

  isLoadingAnalyzeSummary.value = true
  errorMessage.value = null

  try {
    analyzeEvent.value = await loadAnalyzeEvents(importId)
  } catch {
    analyzeEvent.value = null
    errorMessage.value = 'No se pudo cargar el analisis. Intenta nuevamente mas tarde.'
  } finally {
    isLoadingAnalyzeSummary.value = false
  }
}

const loadPhoneEventsData = async (page = 1) => {
  if (!importId) {
    phoneEventsError.value = 'No se encontro el identificador del analisis.'
    return
  }

  isLoadingPhoneEvents.value = true
  phoneEventsError.value = null

  try {
    const response = await loadPhoneEvents(importId, page)
    phoneEventsPagination.value = response
    phoneEvents.value = response.data
  } catch {
    phoneEvents.value = []
    phoneEventsPagination.value = null
    phoneEventsError.value = 'No se pudieron cargar los eventos telefonicos. Intenta nuevamente mas tarde.'
  } finally {
    isLoadingPhoneEvents.value = false
  }
}

function goToPhoneEventsPage(page: number) {
  if (!phoneEventsPagination.value) {
    return
  }

  const meta = phoneEventsPagination.value.meta

  if (page < 1 || page > meta.last_page || page === meta.current_page) {
    return
  }

  loadPhoneEventsData(page)
}

onMounted(async () => {
  await Promise.all([
    loadAnalyzeEventsData(),
    loadPhoneEventsData(),
  ])
})

</script>

<template>
  <main class="min-h-screen bg-tech-gradient px-5 py-8 text-light-50 sm:px-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center">
      <div class="grid w-full gap-8 lg:grid-cols-1 lg:items-start">
        <div class="space-y-5">
          <div
              v-if="isLoadingAnalyzeSummary"
              class="rounded-lg border border-dark-700 bg-dark-900/80 p-5 text-sm font-semibold text-neon-blue shadow-2xl shadow-dark-900/40"
          >
            Cargando analisis...
          </div>

          <p
              v-if="errorMessage"
              class="rounded-md border border-neon-pink/50 bg-dark-800 px-4 py-3 text-sm text-neon-pink"
          >
            {{ errorMessage }}
          </p>

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

          <section
              v-if="analyzeEvent"
              class="rounded-lg border border-dark-700 bg-dark-900/80 p-5 shadow-2xl shadow-dark-900/40"
          >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                  v-for="card in eventTypeCards"
                  :key="card.label"
                  class="rounded-md border border-dark-700 bg-dark-950/60 p-5 text-center shadow-lg shadow-dark-950/30 backdrop-blur"
              >
                <p :class="['break-words text-3xl font-bold tracking-wide', card.accentClass]">
                  {{ card.value }}
                </p>

                <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-light-100/55">
                  {{ card.label }}
                </p>
              </div>
            </div>

            <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neon-purple">
                  Eventos
                </p>
                <h2 class="mt-1 text-2xl font-bold text-light-50">
                  Análisis detallado
                </h2>
              </div>

              <p class="text-sm text-light-100/60">
                {{ formatNumber(phoneEventsMeta?.total ?? phoneEvents.length) }} registros
              </p>
            </div>

            <div
                v-if="isLoadingPhoneEvents"
                class="mt-5 rounded-lg border border-dark-700 bg-dark-800/75 p-5 text-sm font-semibold text-neon-blue"
            >
              Cargando eventos...
            </div>

            <p
                v-if="phoneEventsError"
                class="mt-5 rounded-md border border-neon-pink/50 bg-dark-800 px-4 py-3 text-sm text-neon-pink"
            >
              {{ phoneEventsError }}
            </p>

            <p
                v-if="!isLoadingPhoneEvents && !phoneEventsError && !phoneEvents.length"
                class="mt-5 rounded-md border border-dark-700 bg-dark-800/75 px-4 py-4 text-sm text-light-100/70"
            >
              No hay eventos telefonicos registrados para este analisis.
            </p>

            <div v-if="phoneEvents.length" class="mt-5 overflow-x-auto rounded-md border border-dark-700">
              <table class="min-w-full divide-y divide-dark-700 text-left text-sm">
                <thead class="bg-dark-800/90 text-xs uppercase tracking-wide text-light-100/50">
                <tr>
                  <th class="px-4 py-3 font-semibold">Contacto</th>
                  <th class="px-4 py-3 font-semibold">Numero</th>
                  <th class="px-4 py-3 font-semibold">Primera vez</th>
                  <th class="px-4 py-3 font-semibold">Ultima vez</th>
                  <th class="px-4 py-3 text-right font-semibold">Llamadas</th>
                  <th class="px-4 py-3 text-right font-semibold">Mensajes</th>
                  <th class="px-4 py-3 text-right font-semibold">Datos</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-dark-700 bg-dark-900/60">
                <tr
                    v-for="event in phoneEvents"
                    :key="event.id"
                    class="transition hover:bg-dark-800/70"
                >
                  <td class="max-w-[14rem] px-4 py-3">
                    <span class="block truncate font-medium text-light-50">
                      {{ event.contact || 'Sin contacto' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-neon-cyan">
                    {{ event.number || 'Sin numero' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-light-100/70">
                    {{ formatDate(event.first_seen_at) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-light-100/70">
                    {{ formatDate(event.last_seen_at) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-light-50">
                    {{ formatNumber(event.calls_count) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-light-50">
                    {{ formatNumber(event.messages_count) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-light-50">
                    {{ formatNumber(event.data_count) }}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <div
                v-if="phoneEventsPagination && phoneEventsPagination.meta.last_page > 1"
                class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <button
                  class="rounded-md border border-neon-blue/60 px-4 py-2 text-sm font-semibold text-neon-blue transition hover:border-neon-cyan hover:text-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed disabled:border-dark-700 disabled:text-light-100/40"
                  type="button"
                  :disabled="isLoadingPhoneEvents || !phoneEventsPagination.links.prev"
                  @click="goToPhoneEventsPage(phoneEventsPagination.meta.current_page - 1)"
              >
                Anterior
              </button>

              <div class="flex flex-wrap items-center justify-center gap-2">
                <button
                    v-for="link in phoneEventsPageLinks"
                    :key="`${link.label}-${link.page}`"
                    class="h-10 min-w-10 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed"
                    :class="link.active
                      ? 'border-neon-cyan bg-neon-cyan text-dark-950'
                      : 'border-neon-blue/60 text-neon-blue hover:border-neon-cyan hover:text-neon-cyan disabled:border-dark-700 disabled:text-light-100/40'"
                    type="button"
                    :disabled="isLoadingPhoneEvents || link.active || link.page === null"
                    @click="link.page !== null && goToPhoneEventsPage(link.page)"
                >
                  {{ link.label }}
                </button>
              </div>

              <button
                  class="rounded-md border border-neon-blue/60 px-4 py-2 text-sm font-semibold text-neon-blue transition hover:border-neon-cyan hover:text-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 disabled:cursor-not-allowed disabled:border-dark-700 disabled:text-light-100/40"
                  type="button"
                  :disabled="isLoadingPhoneEvents || !phoneEventsPagination.links.next"
                  @click="goToPhoneEventsPage(phoneEventsPagination.meta.current_page + 1)"
              >
                Siguiente
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>

</style>
