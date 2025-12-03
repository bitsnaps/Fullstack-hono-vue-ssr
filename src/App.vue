<script setup>
import Header from "@/components/Header.vue";
</script>

<template>
    <section class="container">
        <Header />

        <main>
            <router-view />
        </main>
    </section>
</template>
