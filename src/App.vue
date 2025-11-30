<template>
    <div>
        <header>
            <h1>Hono + Vue 3 SSR</h1>
            <nav>
                <router-link to="/">Home</router-link>
                |
                <router-link to="/about">About</router-link>
            </nav>
            <hr />
        </header>

        <main>
            <router-view />
        </main>
    </div>
</template>
