<script setup>
import { ref, onMounted } from 'vue';

const message = ref("");

onMounted(async () => {
    try {
        const res = await fetch("/api/hello");
        const json = await res.json();
        message.value = json.message;
    } catch (e) {
        message.value = "Failed to load from API";
    }
});
</script>

<template>
    <section>
        <h2>Home</h2>
        <p>This page is server-side rendered with Vue 3.</p>
        <div class="card">
            <p v-if="message">API response: {{ message }}</p>
            <p v-else>Loading message from Hono backend...</p>
        </div>
    </section>
</template>
