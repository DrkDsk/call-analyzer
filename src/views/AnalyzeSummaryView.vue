<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import type {ApexOptions} from "apexcharts";
import VueApexCharts from "vue3-apexcharts";
import {
  loadAnalyzeEvents,
  loadAnalyzeEventsAnalytics,
  loadPhoneEvents,
  type AnalyzePhoneEventsResponse,
  type CallDirectionFilter,
  type PhoneEventsAnalyticsResponse,
  type PhoneEvent,
  type PhoneEventsPaginatedResponse,
} from "../services/fileUploadService";
import {useRoute} from "vue-router";
import {formatDuration, formatNumber} from "../helpers/numberHelper";

const analyzeEvent = ref<AnalyzePhoneEventsResponse | null>(null)
const phoneEvents = ref<PhoneEvent[]>([])
const phoneEventsPagination = ref<PhoneEventsPaginatedResponse | null>(null)
const callAnalytics = ref<PhoneEventsAnalyticsResponse | null>(null)
const isLoadingAnalyzeSummary = ref(false)
const isLoadingPhoneEvents = ref(false)
const isLoadingCallAnalytics = ref(false)
const errorMessage = ref<string | null>(null)
const phoneEventsError = ref<string | null>(null)
const callAnalyticsError = ref<string | null>(null)
const selectedCallDateKey = ref<string | null>(null)
const selectedCallDirection = ref<CallDirectionFilter>('all')

const route = useRoute();
const importId = Number(route.params.id);

type ChartCallDirection = Exclude<CallDirectionFilter, 'all'>

const callDirectionFilters: { label: string; value: CallDirectionFilter }[] = [
  {label: 'Todas', value: 'all'},
  {label: 'Entrantes', value: 'incoming'},
  {label: 'Salientes', value: 'outgoing'},
  {label: 'Sin clasificar', value: 'unknown'},
]

const callDirectionSeries: { name: string; value: ChartCallDirection; color: string }[] = [
  {name: 'Entrantes', value: 'incoming', color: '#38bdf8'},
  {name: 'Salientes', value: 'outgoing', color: '#c084fc'},
  {name: 'Sin clasificar', value: 'unknown', color: '#22d3ee'},
]

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
  {
    label: 'Llamadas entrantes',
    value: analyzeEvent.value?.data.summary.incoming_calls_count ?? 0,
    accentClass: 'text-neon-blue',
  },
  {
    label: 'Llamadas salientes',
    value: analyzeEvent.value?.data.summary.outgoing_calls_count ?? 0,
    accentClass: 'text-neon-purple',
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

const callsByDate = computed(() => callAnalytics.value?.data ?? [])

const callAnalyticsTotal = computed(() => callAnalytics.value?.meta.total ?? 0)

const callChartVisibleDirections = computed(() => {
  if (selectedCallDirection.value === 'all') {
    return callDirectionSeries
  }

  return callDirectionSeries.filter((direction) => direction.value === selectedCallDirection.value)
})

const callChartSeries = computed(() => {
  return callChartVisibleDirections.value.map((direction) => ({
    name: direction.name,
    data: callsByDate.value.map((item) => item[direction.value]),
  }))
})

const callChartCategories = computed(() => callsByDate.value.map((item) => item.label))

const callChartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 360,
    toolbar: {
      show: false,
    },
    foreColor: '#d8e8f8',
    background: 'transparent',
    events: {
      dataPointSelection: (_event, _chartContext, config) => {
        const dateGroup = callsByDate.value[config.dataPointIndex]
        const direction = getChartSeriesDirection(config.seriesIndex)

        if (!dateGroup || !direction) {
          return
        }

        selectedCallDateKey.value = dateGroup.date
        selectedCallDirection.value = direction
        void loadCallAnalyticsData()
      },
    },
  },
  colors: callChartVisibleDirections.value.map((direction) => direction.color),
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 4,
      columnWidth: '58%',
    },
  },
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: '#243047',
    strokeDashArray: 4,
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    labels: {
      colors: '#d8e8f8',
    },
    markers: {
      width: 10,
      height: 10,
      radius: 3,
    },
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (value) => `${formatNumber(value)} llamadas`,
    },
  },
  xaxis: {
    categories: callChartCategories.value,
    labels: {
      rotate: -35,
      style: {
        colors: '#9fb1c7',
      },
    },
    axisBorder: {
      color: '#334155',
    },
    axisTicks: {
      color: '#334155',
    },
  },
  yaxis: {
    labels: {
      formatter: (value) => formatNumber(Math.round(value)),
      style: {
        colors: '#9fb1c7',
      },
    },
  },
}))

const selectedCallDateLabel = computed(() => {
  if (!selectedCallDateKey.value) {
    return null
  }

  return callsByDate.value.find((item) => item.date === selectedCallDateKey.value)?.label ?? 'Sin fecha'
})

const filteredCallEvents = computed(() => {
  return phoneEvents.value.filter((event) => {
    if (!isCallEvent(event)) {
      return false
    }

    const eventDateKey = getDateKey(getCallEventDate(event))

    if (selectedCallDateKey.value && eventDateKey !== selectedCallDateKey.value) {
      return false
    }

    const directionGroup = getCallDirectionGroup(event.call_direction)

    return !(selectedCallDirection.value !== 'all' && directionGroup !== selectedCallDirection.value);
  })
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

function isCallEvent(event: PhoneEvent) {
  if (event.type) {
    return event.type === 'call'
  }

  return event.calls_count > 0
}

function getCallEventDate(event: PhoneEvent) {
  return event.first_seen_at ?? event.date ?? event.time ?? event.last_seen_at ?? event.created_at ?? null
}

function getDateKey(value?: string | null) {
  if (!value) {
    return 'sin-fecha'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    const rawDate = value.split(/[T\s]/)[0]

    return rawDate || 'sin-fecha'
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.split(/[T\s]/)[0] || 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function getCallDirectionGroup(direction?: string | null): 'incoming' | 'outgoing' | 'unknown' {
  if (direction === 'incoming') {
    return 'incoming'
  }

  if (direction === 'outgoing') {
    return 'outgoing'
  }

  return 'unknown'
}

function formatCallDirection(direction?: string | null) {
  const directionGroup = getCallDirectionGroup(direction)

  if (directionGroup === 'incoming') {
    return 'Entrante'
  }

  if (directionGroup === 'outgoing') {
    return 'Saliente'
  }

  return 'Sin clasificar'
}

function getCallEventNumber(event: PhoneEvent) {
  return event.number || event.phone || event.number_b || event.number_a || 'Sin numero'
}

function formatCallDuration(duration?: number | string | null) {
  const value = Number(duration ?? 0)

  return formatDuration(Number.isFinite(value) ? value : 0)
}

function getChartSeriesDirection(seriesIndex: number): ChartCallDirection | null {
  return callChartVisibleDirections.value[seriesIndex]?.value ?? null
}

function selectCallDirection(direction: CallDirectionFilter) {
  selectedCallDirection.value = direction
  void loadCallAnalyticsData()
}

function clearCallDateSelection() {
  selectedCallDateKey.value = null
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

const loadCallAnalyticsData = async () => {
  if (!importId) {
    callAnalyticsError.value = 'No se encontro el identificador del analisis.'
    return
  }

  isLoadingCallAnalytics.value = true
  callAnalyticsError.value = null

  try {
    callAnalytics.value = await loadAnalyzeEventsAnalytics(importId, selectedCallDirection.value)
  } catch {
    callAnalytics.value = null
    callAnalyticsError.value = 'No se pudo cargar la grafica de llamadas.'
  } finally {
    isLoadingCallAnalytics.value = false
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
    loadCallAnalyticsData(),
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
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

            <div class="mt-6 rounded-md border border-dark-700 bg-dark-950/50 p-4">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-neon-purple">
                    Llamadas por fecha
                  </p>
                  <h3 class="mt-1 text-xl font-bold text-light-50">
                    Entrantes, salientes y sin clasificar
                  </h3>
                  <p class="mt-2 text-sm text-light-100/60">
                    {{ formatNumber(callAnalyticsTotal) }} llamadas detectadas
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                      v-for="filter in callDirectionFilters"
                      :key="filter.value"
                      class="rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900"
                      :class="selectedCallDirection === filter.value
                        ? 'border-neon-cyan bg-neon-cyan text-dark-950'
                        : 'border-neon-blue/60 text-neon-blue hover:border-neon-cyan hover:text-neon-cyan'"
                      type="button"
                      @click="selectCallDirection(filter.value)"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <div
                  v-if="isLoadingCallAnalytics"
                  class="mt-5 rounded-lg border border-dark-700 bg-dark-800/75 p-5 text-sm font-semibold text-neon-blue"
              >
                Cargando grafica de llamadas...
              </div>

              <p
                  v-if="callAnalyticsError"
                  class="mt-5 rounded-md border border-neon-pink/50 bg-dark-800 px-4 py-3 text-sm text-neon-pink"
              >
                {{ callAnalyticsError }}
              </p>

              <div
                  v-if="!isLoadingCallAnalytics && !callAnalyticsError && callsByDate.length"
                  class="mt-5 min-h-[360px]"
              >
                <VueApexCharts
                    height="360"
                    type="bar"
                    :options="callChartOptions"
                    :series="callChartSeries"
                />
              </div>

              <p
                  v-else-if="!isLoadingCallAnalytics && !callAnalyticsError"
                  class="mt-5 rounded-md border border-dark-700 bg-dark-800/75 px-4 py-4 text-sm text-light-100/70"
              >
                No hay llamadas suficientes para graficar.
              </p>

              <div
                  class="mt-5 flex flex-col gap-2 border-t border-dark-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-sm text-light-100/70">
                  <span class="font-semibold text-light-50">
                    {{ formatNumber(filteredCallEvents.length) }}
                  </span>
                  eventos filtrados en la pagina actual
                  <span v-if="selectedCallDateLabel">
                    en {{ selectedCallDateLabel }}
                  </span>
                </div>

                <button
                    v-if="selectedCallDateKey"
                    class="self-start rounded-md border border-neon-purple/60 px-3 py-2 text-sm font-semibold text-neon-purple transition hover:border-neon-cyan hover:text-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 sm:self-auto"
                    type="button"
                    @click="clearCallDateSelection"
                >
                  Ver todas las fechas
                </button>
              </div>

              <div
                  v-if="filteredCallEvents.length"
                  class="mt-4 overflow-x-auto rounded-md border border-dark-700"
              >
                <table class="min-w-full divide-y divide-dark-700 text-left text-sm">
                  <thead class="bg-dark-800/90 text-xs uppercase tracking-wide text-light-100/50">
                  <tr>
                    <th class="px-4 py-3 font-semibold">Fecha</th>
                    <th class="px-4 py-3 font-semibold">Numero</th>
                    <th class="px-4 py-3 font-semibold">Tipo</th>
                    <th class="px-4 py-3 font-semibold">Dirección</th>
                    <th class="px-4 py-3 text-right font-semibold">Duración</th>
                  </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-700 bg-dark-900/60">
                  <tr
                      v-for="event in filteredCallEvents"
                      :key="`call-${event.id}`"
                      class="transition hover:bg-dark-800/70"
                  >
                    <td class="whitespace-nowrap px-4 py-3 text-light-100/70">
                      {{ formatDate(getCallEventDate(event)) }}
                    </td>
                    <td class="px-4 py-3 text-neon-cyan">
                      {{ getCallEventNumber(event) }}
                    </td>
                    <td class="whitespace-nowrap px-4 py-3 text-light-100/70">
                      {{ event.type || 'call' }}
                    </td>
                    <td class="whitespace-nowrap px-4 py-3 text-light-100/70">
                      {{ formatCallDirection(event.call_direction) }}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-light-50">
                      {{ formatCallDuration(event.duration) }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <p
                  v-else-if="callsByDate.length"
                  class="mt-4 rounded-md border border-dark-700 bg-dark-800/75 px-4 py-4 text-sm text-light-100/70"
              >
                No hay llamadas para el filtro seleccionado.
              </p>
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
                  <th class="px-4 py-3 font-semibold">Dirección llamada</th>
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
                    {{ formatCallDirection(event.call_direction) }}
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
