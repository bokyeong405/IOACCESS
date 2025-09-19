<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Refs for reactive data
const latestEventText = ref('태그를 기다리는 중...');
const latestEventStatus = ref('');
const occupantsCount = ref(0);
const occupantsList = ref([]);
const occupantFilter = ref('');
const manualUserId = ref('');

// Filtered computed property
const filteredOccupants = computed(() => {
    if (!occupantFilter.value) {
        return occupantsList.value;
    }
    return occupantsList.value.filter(occupant =>
        occupant.toLowerCase().includes(occupantFilter.value.toLowerCase())
    );
});

// Refs for chart canvases
const hourlyCanvas = ref(null);
const successFailureCanvas = ref(null);
const userEntryCanvas = ref(null);

// Refs for chart instances
let hourlyChart, successFailureChart, userEntryChart;

let intervalId = null;

// --- Manual Entry ---
async function handleManualEntry() {
    if (!manualUserId.value) {
        alert('사용자 ID를 입력하세요.');
        return;
    }
    try {
        const response = await fetch('/api/manual-entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: manualUserId.value }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '수동 입장에 실패했습니다.');
        }
        manualUserId.value = '';
        alert('수동 입장이 처리되었습니다.');
        updateDashboard(); // Refresh dashboard immediately
    } catch (error) {
        alert(error.message);
    }
}

// --- Data Fetching and UI Update Logic ---
async function updateDashboard() {
    console.log('Updating dashboard...');
    try {
        const [eventsRes, hourlyRes, usersRes, occupantsRes] = await Promise.all([
            fetch('/api/events'),
            fetch('/api/stats/hourly-traffic'),
            fetch('/api/users'),
            fetch('/api/status/occupants')
        ]);

        if (!eventsRes.ok || !hourlyRes.ok || !usersRes.ok || !occupantsRes.ok) {
            throw new Error('Failed to fetch one or more resources');
        }

        const eventsData = await eventsRes.json();
        const hourlyData = await hourlyRes.json();
        const usersData = await usersRes.json();
        const occupantsData = await occupantsRes.json();

        // Update reactive data
        updateLatestEvent(eventsData.data);
        updateCurrentOccupants(occupantsData.data);

        // Update charts
        renderHourlyTrafficChart(hourlyData.data);
        renderSuccessFailureChart(eventsData.data);
        renderUserEntryChart(eventsData.data, usersData.data);

    } catch (error) {
        console.error('Dashboard update failed:', error);
    }
}

function updateLatestEvent(events) {
    if (!events || events.length === 0) {
        latestEventText.value = '데이터 없음';
        return;
    }
    const latest = events[0];
    const userName = latest.user_name || '알 수 없음';
    const eventText = latest.event_type === 'IN' ? '입장' : '퇴장';
    
    latestEventText.value = `${userName} - ${eventText} (${latest.status})`;
    latestEventStatus.value = `status-${latest.status}`;
}

function updateCurrentOccupants(occupants) {
    occupantsCount.value = occupants.length;
    occupantsList.value = occupants;
}

// --- Chart Rendering Logic ---

function renderHourlyTrafficChart(data) {
    const labels = data.map(item => `${item.hour}h`);
    const counts = data.map(item => item.count);

    if (hourlyChart) {
        hourlyChart.data.labels = labels;
        hourlyChart.data.datasets[0].data = counts;
        hourlyChart.update();
    } else {
        hourlyChart = new Chart(hourlyCanvas.value.getContext('2d'), {
            type: 'line',
            data: { labels, datasets: [{ label: '입장 횟수', data: counts, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }] },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}

function renderSuccessFailureChart(events) {
    const today = new Date().toISOString().slice(0, 10);
    let successCount = 0, failureCount = 0;
    events.forEach(event => {
        if (event.timestamp.startsWith(today)) {
            if (event.status === 'SUCCESS') successCount++;
            else if (event.status === 'FAILURE') failureCount++;
        }
    });

    if (successFailureChart) {
        successFailureChart.data.datasets[0].data = [successCount, failureCount];
        successFailureChart.update();
    } else {
        successFailureChart = new Chart(successFailureCanvas.value.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['성공', '실패'],
                datasets: [{ label: '횟수', data: [successCount, failureCount], backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'], borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'], borderWidth: 1 }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}

function renderUserEntryChart(events, users) {
    const today = new Date().toISOString().slice(0, 10);
    const userCounts = {};
    users.forEach(user => { userCounts[user.id] = { name: user.name, count: 0 }; });
    events.forEach(event => {
        if (event.timestamp.startsWith(today) && event.status === 'SUCCESS' && event.user_id && userCounts[event.user_id]) {
            userCounts[event.user_id].count++;
        }
    });

    const sortedUsers = Object.values(userCounts).sort((a, b) => b.count - a.count);
    const labels = sortedUsers.map(u => u.name);
    const counts = sortedUsers.map(u => u.count);

    if (userEntryChart) {
        userEntryChart.data.labels = labels;
        userEntryChart.data.datasets[0].data = counts;
        userEntryChart.update();
    } else {
        userEntryChart = new Chart(userEntryCanvas.value.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: '입장 횟수', data: counts, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgb(54, 162, 235)', borderWidth: 1 }] },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}

// --- Lifecycle Hooks ---
onMounted(() => {
    updateDashboard();
    intervalId = setInterval(updateDashboard, 5000);
});

onBeforeUnmount(() => {
    clearInterval(intervalId);
});

</script>

<template>
    <header>
        <h1>Smart Access Dashboard</h1>
    </header>

    <main>
        <div class="container">
            <div id="latestEvent" class="status-box">
                <h2>최신 인식 정보</h2>
                <p :class="latestEventStatus">{{ latestEventText }}</p>
            </div>
            <div id="currentOccupants" class="status-box">
                <h2>현재 입장 인원</h2>
                <p>인원: {{ occupantsCount }}명</p>
                <input type="text" v-model="occupantFilter" placeholder="이름으로 필터링..." class="filter-input">
                <ul>
                    <li v-for="occupant in filteredOccupants" :key="occupant">{{ occupant }}</li>
                </ul>
            </div>
            <div class="control-box">
                <h2>수동 입장</h2>
                <p class="example-text">예: 사용자 ID 1, 2, 3...</p>
                <input type="text" v-model="manualUserId" placeholder="사용자 ID 입력">
                <button @click="handleManualEntry">입장 처리</button>
            </div>
        </div>

        <div class="container">
            <div class="chart-container">
                <h2>시간대별 입장 추이</h2>
                <canvas ref="hourlyCanvas"></canvas>
            </div>
            <div class="chart-container">
                <h2>금일 총 입장 횟수</h2>
                <canvas ref="successFailureCanvas"></canvas>
            </div>
            <div class="chart-container">
                <h2>사용자별 입장 횟수 (금일)</h2>
                <canvas ref="userEntryCanvas"></canvas>
            </div>
        </div>
    </main>
</template>

<style>
body {
    font-family: sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f7f6;
}

header h1 {
    text-align: center;
    margin-bottom: 40px;
}

.container {
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    margin-bottom: 40px;
}

.chart-container {
    width: 450px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-box, .control-box {
    width: 300px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
}

.status-box h2, .control-box h2 {
    margin-top: 0;
}

.control-box input, .filter-input {
    width: calc(100% - 22px);
    padding: 8px 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.control-box .example-text {
    font-size: 0.8em;
    color: #666;
    margin-top: -10px;
    margin-bottom: 15px;
}

.control-box button {
    width: 100%;
    padding: 10px;
    border: none;
    background-color: #5c67f2;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.control-box button:hover {
    background-color: #4a54c4;
}

#currentOccupants ul {
    list-style-type: none;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
    text-align: left;
}

#currentOccupants li {
    padding: 5px;
    border-bottom: 1px solid #eee;
}

#latestEvent p {
    font-size: 1.2em;
    font-weight: bold;
}

.status-SUCCESS {
    color: green;
}

.status-FAILURE {
    color: red;
}
</style>