<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const backHome = () => {
    router.back();
};
</script>

<template>
    <section>
        <h2>About</h2>
        <p>This is another route, also SSR-rendered.</p>
        <button @click="backHome">Back to home</button>
    </section>
</template>
