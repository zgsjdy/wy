<template>
  <div class="box">
    <!-- 左边导航部分 -->
    <div class="left-Navigation" :style="`background-position: 0 ${msg}vh;`">
      <div class="left-list" v-for="(_, index) in 5" :key="index" 
      :style="`top: ${index*15 + 5}vh;`"
      @click="modifyContent(index)">
        左边导航</div>
    </div>
    
    <!-- 右边内容区 -->
    <div class="right-content">
      <!-- 路由展示 -->
      <router-view></router-view>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';

let router = useRouter();

const msg:Ref = ref(-8);


const modifyContent = (index: number) => {
  if (msg.value === 0) {
    msg.value = -8;
  }else{
    msg.value = -8 + index * 15;
  }

  // 路由跳转
  let name = index === 0 ? 'Home' : 'home2';
  router.push({ 
    name: name,
  });

}


</script>


<style scoped lang="scss">
  .box {
    min-width: 100vw;
    min-height: 100vh;
    

    .left-Navigation {
      backdrop-filter: blur(10px);
      width: 0.5%;
      height: 100vh;
      background-image: linear-gradient(-225deg, #5D9FFF00 0%, #B8DCFF 48%, #6BBBFF00 100%);
      background-size: 50% 30%;
      background-repeat: no-repeat;
      background-position: 0 -8vh;
      float: left;
      position: relative;
      transition: all 0.8s;

      .left-list {
        position: absolute;
        left: 10%;
        width: 95px;
        height: 30px;
        border: 3px double #fff;
        border-radius: 0 50px 50px 0;
        text-align: center;
        line-height: 25px;
        color: #fff;
        cursor: pointer;
        user-select: none; /* 阻止文本选择 */
        transition: all 0.3s;
        &:hover {
          background-color: #fff;
          color: #000;
          width: 110px;
        }
      }
    }

    .right-content {
      margin: 2vh;
      width: 90%;
      height: 95vh;
      float: right;
      border: 3px solid #fff;
      border-radius: 50px;
    }

    &::after {
      content: '';
      display: block;
      clear: both;
    }
  }
</style>
