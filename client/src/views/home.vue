<template>
    <div class="home">
        <h1>Welcome to Home Page</h1>
        <p>This is a simple Vue 3 template.</p>
    </div>
</template>

<script setup lang="ts">
    fetch('http://localhost:3001/api/data').then(res => {
        return res.text()
    }).then(data => {
        console.log(data)
    })
</script>

<style scoped lang="scss">
.home {
    text-align: center;
    margin-top: 50px;
}
</style>