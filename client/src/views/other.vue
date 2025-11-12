<template>
  <div class="home">
    <div class="content">
      <h1 class="title">Welcome to Home Page</h1>
      <p class="subtitle">This is a simple Vue 3 template.</p>
      <div class="data-display" v-if="data">
        <h3>API Response:</h3>
        <pre>{{ data }}</pre>
      </div>
      <div class="loading" v-else>
        <div class="spinner"></div>
        <p>Loading data...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const data = ref<string>("");

onMounted(() => {
  fetch("http://localhost:3001/api/data")
    .then((res) => res.text())
    .then((response) => {
      data.value = response;
    })
    .catch((error) => {
      console.error("Error:", error);
      data.value = "Error loading data";
    });
});
</script>

<style scoped lang="scss">
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px;

  .content {
    text-align: center;
    max-width: 800px;
    width: 100%;
    padding: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    .title {
      font-size: 2.5em;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #fff, #e6e6e6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: fadeInDown 0.8s ease;
    }

    .subtitle {
      font-size: 1.2em;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 30px;
      animation: fadeInUp 0.8s ease;
    }

    .data-display {
      margin-top: 30px;
      padding: 20px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
      text-align: left;
      animation: fadeIn 1s ease;

      pre {
        color: #fff;
        font-family: "Courier New", monospace;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
