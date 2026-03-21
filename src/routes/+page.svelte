<script lang="ts">
    type WeatherData = {
        temperature: number;
        pressure: number;
        humidity: number;
        light: number;
        updatedAt: string;
        stationStatus: 'Online' | 'Offline';
        gatewayStatus: 'Connected' | 'Disconnected';
    };

    let data: WeatherData = {
        temperature: 22.4,
        pressure: 1013,
        humidity: 58,
        light: 720,
        updatedAt: new Date().toLocaleTimeString(),
        stationStatus: 'Online',
        gatewayStatus: 'Connected'
    };

    let temperatureTrend = [20, 21, 21.5, 22, 22.3, 22.4, 22.1, 22.4];
    let humidityTrend = [50, 52, 51, 55, 57, 56, 58, 58];
    let pressureTrend = [1010, 1011, 1012, 1012, 1013, 1014, 1013, 1013];

    function updateFakeData() {
        data = {
            temperature: +(20 + Math.random() * 8).toFixed(1),
            pressure: Math.floor(1005 + Math.random() * 15),
            humidity: Math.floor(40 + Math.random() * 35),
            light: Math.floor(200 + Math.random() * 900),
            updatedAt: new Date().toLocaleTimeString(),
            stationStatus: Math.random() > 0.08 ? 'Online' : 'Offline',
            gatewayStatus: Math.random() > 0.1 ? 'Connected' : 'Disconnected'
        };

        temperatureTrend = [...temperatureTrend.slice(1), data.temperature];
        humidityTrend = [...humidityTrend.slice(1), data.humidity];
        pressureTrend = [...pressureTrend.slice(1), data.pressure];
    }

    function getPolylinePoints(values: number[], width = 320, height = 120) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        return values
            .map((value, index) => {
                const x = (index / (values.length - 1)) * width;
                const y = height - ((value - min) / range) * (height - 16) - 8;
                return `${x},${y}`;
            })
            .join(' ');
    }

    import { onDestroy } from 'svelte';
    const interval = setInterval(updateFakeData, 4000);
    onDestroy(() => clearInterval(interval));
</script>

<div class="min-h-screen bg-slate-100 text-slate-800">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">IoT Meteostation Dashboard</h1>
            <p class="mt-2 text-sm text-slate-600">
                Real-time overview of temperature, pressure, humidity and light conditions
            </p>
        </header>

        <!-- Top row: main cards -->
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Temperature</p>
                <div class="mt-3 flex items-end justify-between">
                    <h2 class="text-4xl font-bold">{data.temperature} °C</h2>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Live</span>
                </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Pressure</p>
                <div class="mt-3 flex items-end justify-between">
                    <h2 class="text-4xl font-bold">{data.pressure} hPa</h2>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Live</span>
                </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Humidity</p>
                <div class="mt-3 flex items-end justify-between">
                    <h2 class="text-4xl font-bold">{data.humidity} %</h2>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Live</span>
                </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Light</p>
                <div class="mt-3 flex items-end justify-between">
                    <h2 class="text-4xl font-bold">{data.light} lx</h2>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Live</span>
                </div>
            </div>
        </section>

        <!-- Middle row: statuses -->
        <section class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Station status</p>
                <div class="mt-3 flex items-center gap-3">
          <span
                  class={`inline-block h-3 w-3 rounded-full ${
              data.stationStatus === 'Online' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          ></span>
                    <p class="text-2xl font-semibold">{data.stationStatus}</p>
                </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Last update</p>
                <p class="mt-3 text-2xl font-semibold">{data.updatedAt}</p>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <p class="text-sm text-slate-500">Gateway status</p>
                <div class="mt-3 flex items-center gap-3">
          <span
                  class={`inline-block h-3 w-3 rounded-full ${
              data.gatewayStatus === 'Connected' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
                    <p class="text-2xl font-semibold">{data.gatewayStatus}</p>
                </div>
            </div>
        </section>

        <!-- Bottom row: trends -->
        <section class="mt-6 grid gap-4 lg:grid-cols-3">
            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Temperature trend</h3>
                    <span class="text-sm text-slate-500">last samples</span>
                </div>

                <svg viewBox="0 0 320 120" class="h-32 w-full">
                    <polyline
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            class="text-slate-700"
                            points={getPolylinePoints(temperatureTrend)}
                    />
                </svg>

                <p class="mt-3 text-sm text-slate-500">
                    Current value: <span class="font-medium text-slate-700">{data.temperature} °C</span>
                </p>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Humidity trend</h3>
                    <span class="text-sm text-slate-500">last samples</span>
                </div>

                <svg viewBox="0 0 320 120" class="h-32 w-full">
                    <polyline
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            class="text-slate-700"
                            points={getPolylinePoints(humidityTrend)}
                    />
                </svg>

                <p class="mt-3 text-sm text-slate-500">
                    Current value: <span class="font-medium text-slate-700">{data.humidity} %</span>
                </p>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Pressure trend</h3>
                    <span class="text-sm text-slate-500">last samples</span>
                </div>

                <svg viewBox="0 0 320 120" class="h-32 w-full">
                    <polyline
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            class="text-slate-700"
                            points={getPolylinePoints(pressureTrend)}
                    />
                </svg>

                <p class="mt-3 text-sm text-slate-500">
                    Current value: <span class="font-medium text-slate-700">{data.pressure} hPa</span>
                </p>
            </div>
        </section>

        <section class="mt-6">
            <div class="rounded-2xl bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 class="text-lg font-semibold">Controls</h3>
                        <p class="text-sm text-slate-500">Temporary actions for testing dashboard updates</p>
                    </div>

                    <button
                            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                            on:click={updateFakeData}
                    >
                        Refresh now
                    </button>
                </div>
            </div>
        </section>
    </div>
</div>