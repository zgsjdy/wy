<template>
  <div class="box" ref="BOX">
    <!-- 左边导航部分 -->
    <div class="left-Navigation" ref="LNAV">
      <!-- 选中 -->
      <div class="selected"></div>
      <div
        class="left-list"
        v-for="(item, index) in navigation"
        :key="index"
        @click="navSwitch(index, item)"
      >
        {{ item.name }}
      </div>
    </div>

    <!-- 右边内容区 -->
    <div class="right-content" ref="RCON">
      <!-- 路由展示 -->
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

// 页面容器
const BOX = ref<HTMLElement>();
// 导航栏区域
const LNAV = ref<HTMLElement>();
// 内容区域
const RCON = ref<HTMLElement>();

// 页面左边导航引射表
interface NavigationItem {
  name: string;
  path: string;
  pathName?: string;
}
const navigation: NavigationItem[] = [
  {
    name: "大文件上传",
    path: "/uploadLargeFiles",
    pathName: "uploadLargeFiles",
  },
  {
    name: "左边导航",
    path: "/other",
    pathName: "other",
  },
  {
    name: "左边导航",
    path: "/other",
    pathName: "other",
  },
  {
    name: "左边导航",
    path: "/other",
    pathName: "other",
  },
  {
    name: "左边导航",
    path: "/other",
    pathName: "other",
  },
  {
    name: "左边导航",
    path: "/other",
    pathName: "other",
  },
];

// 更新页面高度,dom渲染后才可调用
function pageResize(): void {
  if (!BOX.value) {
    console.warn("BOX.value ==>>> 未获取到dom值", BOX.value);
    return;
  }
  BOX.value.style.height = window.innerHeight + "px";
}
/**
 * 必须在真实dom渲染后才能调用,依赖Navigation.value
 * @param distance 距离 默认5
 */
function navMargin(distance: number = 5): void {
  if (!LNAV.value) {
    console.warn("LNAV.value ==>>> 未获取到dom值", LNAV.value);
    return;
  }
  const lM: number = LNAV.value.offsetHeight;
  const scale = Math.max((lM / (distance * 100)) * 0.01, 0); //比例计算
  // 修改css变量
  LNAV.value.style.setProperty("--lsMar", `${lM * scale}px 0px ${lM * scale}px 0px`);
}

let lastTime: number = 0;
/**
 * 设置选中图标位置,传值更新位置不传值用上一次位置
 * @param index  选中图标位置,下标从0开始
 */
function setExcessive(index?: number): void {
  if (!LNAV.value) {
    console.warn("LNAV.value ==>>> 未获取到dom值", LNAV.value);
    return;
  }
  index = index === undefined ? lastTime : index;

  if (window?.$gl?.ish5) {
    for (let i = 1; i < LNAV.value.children.length; i++) {
      const act = LNAV.value.children[i] as HTMLElement;
      i === index + 1
        ? (act.style.cssText += `background-color:#ff9b48;color:#000;transform:scale(1, 1);`)
        : (act.style.cssText += `background-color:transparent;color:#fff;transform:scale(0.8, 1);`);
    }
  } else {
    // 计算偏移量
    const overflowHeight = LNAV.value.scrollTop;
    const lnavWidth = LNAV.value.offsetWidth;
    const seleMiddle = (LNAV.value.children[0] as HTMLElement).offsetHeight / 2;
    const seleWidth = (LNAV.value.children[0] as HTMLElement).offsetWidth;
    const actWeight = (LNAV.value.children[index + 1] as HTMLElement).offsetWidth;
    const rectTop = LNAV.value.children[index + 1].getBoundingClientRect().top;
    const actMiddle = (LNAV.value.children[index + 1] as HTMLElement).offsetHeight / 2;
    const offsetX = actWeight >= lnavWidth - seleWidth ? lnavWidth - seleWidth : actWeight;

    LNAV.value.style.setProperty(
      "--actY",
      `${rectTop + overflowHeight + actMiddle - seleMiddle}px`
    );
    LNAV.value.style.setProperty("--actX", `${offsetX}px`);
  }

  lastTime = index;
}

let routerTimeoutId: number;
/**
 * 路由跳转，需要过度效果要在RCON.value的样式中添加过度
 * @param itemObj  选中对象，路由切换
 * @param time  防抖时间，默认500ms
 * @param sinkingDistance  选中图标下沉距离，默认1 => 1% 的距离
 */
function routeSwitch(
  itemObj: NavigationItem,
  time: number = 500,
  sinkingDistance: number = 1
): void {
  if (!RCON.value) {
    console.warn("LNAV.value ==>>> 未获取到dom值", RCON.value);
    return;
  }

  RCON.value.style.cssText = `
    transform: translate(0,${sinkingDistance}%);
    opacity: 0;
  `;

  clearTimeout(routerTimeoutId);
  routerTimeoutId = setTimeout(async () => {
    try {
      // 路由跳转
      const { pathName } = itemObj;

      // 路由切换
      await router.push({
        name: pathName,
      });
    } catch (error) {
      console.error(
        "%c error ::===>>> ",
        "font-size:13px; background:#d75704; color:#ff9b48;",
        error
      );
    } finally {
      RCON.value!.style.cssText += `
        transform: translate(0,0);
        opacity: 1;
      `;
    }
  }, time);
}

/**
 * 导航栏切换函数
 * @param index  选中图标位置,下标从0开始
 * @param itemObj  选中对象，路由切换
 */
function navSwitch(index: number, itemObj: NavigationItem): void {
  if (lastTime === index) return;
  setExcessive(index); //选中图标位置
  routeSwitch(itemObj); //路由切换
}

let setTimeoutId: number;
onMounted(() => {
  // 监听导航栏过度结束事件
  LNAV.value!.addEventListener("transitionend", (e: TransitionEvent) => {
    // 过滤不符合的过度结束事件,列表间距变化才运行
    if (
      !(
        (e.propertyName === "margin-bottom" || e.propertyName === "margin-top") &&
        (e.target as HTMLElement).classList.contains("left-list")
      )
    ) {
      return;
    }

    clearTimeout(setTimeoutId);
    setTimeoutId = setTimeout(setExcessive, 8);
  });

  //初始化选中图标位置
  const fullPath: string = window.location.pathname;
  let index = navigation.findIndex((item) => item.path === fullPath);
  index = Math.max(index, 0);
  lastTime = index;

  pageResize(); //初始化页面高度
  navMargin(); //初始化导航外边距

  window.addEventListener("resize", () => {
    pageResize();
    navMargin();
  });
});
</script>

<style scoped lang="scss">
// 主体
.box {
  width: 100%;
  overflow: hidden;
  display: -ms-grid;
  display: grid;
  -ms-grid-rows: 1fr;
  grid-template-rows: 1fr;
  -ms-grid-columns: 160px 1fr;
  grid-template-columns: 160px 1fr;

  // 为不支持grid的浏览器提供flexbox回退方案
  @supports not (display: grid) {
    display: -webkit-flex;
    display: flex;
    -webkit-align-items: center;
    align-items: center;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    .left-Navigation {
      flex: 0 0 auto;
      width: 160px;
    }
    .right-content {
      width: 100%;
      align-self: stretch;
    }
  }

  .left-Navigation {
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;

    &::-webkit-scrollbar {
      width: 1px;
      height: 1px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      &:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    }

    .selected {
      transform: translate(var(--actX, 0), var(--actY, 0));
      transition: all 0.5s cubic-bezier(1, 0.01, 0, 1.21);
      position: absolute;
      top: 0;
      left: 0;
      width: 30px;
      height: 30px;
      background-image: url("../public/icon.svg");
      background-position: center center;
      background-size: contain;
      background-repeat: no-repeat;
      z-index: 3;
    }

    .left-list {
      margin: var(--lsMar, 0);
      padding: 0px 3px 0px 0px;
      flex: 0 0 auto;
      width: 100%;
      min-height: 30px;
      line-height: 25px;
      transform: scale(0.8, 1);
      transform-origin: left center;
      border: 3px double #fff;
      border-radius: 0 50px 50px 0;
      text-align: center;
      color: #fff;
      letter-spacing: 3px;
      cursor: pointer;
      /* 阻止文本选择 */
      -webkit-user-select: none;
      -ms-user-select: none;
      -moz-user-select: none;
      -o-user-select: none;
      user-select: none;
      word-wrap: break-word;
      word-break: break-all;
      white-space: normal;
      transition: all 0.3s; //过渡取消会影响绑定过度事件的触发

      &:hover {
        background-color: #e4edffb2;
        color: #000;
        transform: scale(1, 1);
      }
      &:active {
        color: #fff;
        transform: scale(0.9, 1);
      }
    }
  }

  .right-content {
    margin: 2vh;
    border: 3px solid #fff;
    border-radius: 50px;
    padding: 15px;
    transition: all 0.5s;
    overflow: auto;
  }
}
// h5适配
@media screen and (max-width: 1024px) {
  .box {
    -ms-grid-rows: 50px 1fr;
    grid-template-rows: 50px 1fr;
    -ms-grid-columns: 1fr;
    grid-template-columns: 1fr;

    .left-Navigation {
      padding: 0 10px;
      flex-direction: row;
      align-items: center;
      overflow-y: hidden;
      overflow-x: auto;

      .selected {
        display: none;
      }

      .left-list {
        padding: 0 15px;
        width: auto;
        border: none;
        border-radius: 3px;
        transform-origin: center center;
        line-height: 30px;
        &:hover {
          background-color: transparent;
          color: #fff;
          transform: scale(0.8, 1);
        }
        &:active {
          color: #fff;
          transform: scale(0.8, 1);
        }
      }
    }

    .right-content {
      margin: 1vh;
      border-radius: 10px;
      padding: 5px;
    }
  }
}
</style>
