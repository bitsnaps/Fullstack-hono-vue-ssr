<template>
    <section>
        <h2>Home</h2>
        <p>This page is server-side rendered with Vue 3.</p>
        <p v-if="message">API response: {{ message }}</p>
        <p v-else>Loading message from Hono backend...</p>
    </section>
</template>

<script>
export default {
    name: "HomePage",
    data() {
        return {
            message: "",
        };
    },
    async mounted() {
        try {
            const res = await fetch("/api/hello");
            const json = await res.json();
            this.message = json.message;
        } catch (e) {
            this.message = "Failed to load from API";
        }
    },
};
</script>
