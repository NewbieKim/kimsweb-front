<template>
  <div class="page-container">
    <div class="header">
      <div class="header-content">
        <!-- 头像区域 - 添加点击事件 -->
        <span class="avatar" style="width: 48px;height: 48px;line-height: 48px;" @click="toggleProfileCard">
          <img src="https://q1.qlogo.cn/g?b=qq&nk=190848757&s=640" alt="">
        </span>
        <div class="date-info">
          早安, kim, 开始您一天的工作吧！工欲善其事必先利其器！
        </div>
      </div>
      <!-- 搜索框组件 -->
      <SearchBox />
    </div>
    
    <div class="container">
        <div class="left">
          <div class="top section-title">
            <el-icon class="el-icon-paperclip" style="font-size: 18px;margin: 5px;"></el-icon>
            <span>项目地址</span>
          </div>
          <div class="project-container">
            <div class="project flip-card" v-for="(item, index) in projectData" :key="index">
                  <div class="flip-inner">
                    <div class="front">
                      <span class="project_name">
                        <!-- <svg-icon :name="'link'" /> -->
                        <svg-icon class="svg-icon" :name="item.image" />
                        <span style="padding: 5px;">{{ item.title }}</span>
                      </span>
                      <div class="project_introduce">项目简介：{{ item.introduce }}</div>
                    </div>
                    <div class="back">
                      <div class="url_goto">
                        <div class="env-add" v-if="item.dev_url"><a :href="item.dev_url" target="_blank">点击跳转开发环境</a></div>
                        <div class="env-add" v-if="item.test_url"><a :href="item.test_url" target="_blank">点击跳转测试环境</a></div>
                        <div class="env-add" v-if="item.prod_url"><a :href="item.prod_url" target="_blank">点击跳转生产环境</a></div>
                      </div>
                    </div>
              </div>

            </div>
          </div>
        </div>
        <div class="right">
          <ToDo />
          <div class="illustration-section">
            <img src="@/svg/svg/illustration.svg" alt="插图">
          </div>
        </div>
    </div>
    <div class="sort-container">
      <div v-for="(item, index) in sortTable" :key="index" class="category-section" :class="{'hot-tools-section': item.title === '热门工具', 'hot-tutorials-section': item.title === '热门教程'}">
        <h4 class="section-title" :class="{'hot-tools-title': item.title === '热门工具', 'hot-tutorials-title': item.title === '热门教程'}">
          <el-icon class="el-icon-paperclip" style="font-size: 18px;margin: 5px;"></el-icon>
          <span>{{ item.title }}</span>
          <span v-if="item.title === '热门工具'" class="hot-badge">HOT</span>
          <span v-if="item.title === '热门教程'" class="tutorial-badge">教程</span>
        </h4>
        <div class="sort">
          <div class="s1 glow-card" v-for="(item1,index1) in item.data" :key="index1" @click="handleGo(item1)">
            <!-- link -->
            <div class="tool-icon">
              <span class="project_name">
                <img 
                  style="width: 50px;height: 50px;border-radius: 8px;" 
                  :src="item1.image || defaultImage" 
                  :alt="item1.name"
                  @error="handleImageError"
                >
              </span>
            </div>
            <div class="tool-content">
              <h3 class="tool-name">{{ item1.name }}</h3>
              <p class="tool-description">{{ item1.introduce }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ProfileCard弹框 -->
  <div v-if="showProfileCard" class="profile-card-modal" @click="closeProfileCard">
      <div class="profile-card-container" @click.stop>
        <ProfileCard 
          :avatar-url="'https://q1.qlogo.cn/g?b=qq&nk=190848757&s=640'"
          :name="'jinming jiang'"
          :title="'前端工程师'"
          :handle="'newbiekim'"
          :status="'Online'"
          :contact-text="'联系'"
          class="profile-card-animation"
        />
        <button class="close-profile-btn" @click="closeProfileCard">
          <svg-icon :name="'undo'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue'
  import defaultImg from '@/assets/vue-favicon.png'
  import ToDo from '@/components/ToDo.vue'
  import SearchBox from '@/components/SearchBox.vue'
  import ProfileCard from '@/components/ProfileCard.vue'

  const defaultImage = defaultImg

  // ProfileCard显示状态
  const showProfileCard = ref(false)
  
  // 切换ProfileCard显示状态
  const toggleProfileCard = () => {
    showProfileCard.value = !showProfileCard.value
  }
  
  // 关闭ProfileCard
  const closeProfileCard = () => {
    showProfileCard.value = false
  }
  
  const projectData: Array<any> = reactive([
    {
      title: '讯易链',
      image: 'shequfuwu',
      introduce: '生命是一个不断探索的过程。',
      test_url: 'https://beehive-scf.qhhrly.cn/#/',
      dev_url: 'https://beehive-scf.lianyirong.com.cn/#/',
      prod_url: 'https://xyc.llschain.com/#/'
    },
    {
      title: '微企链',
      image: 'cemianji',
      introduce: '苟日新，日日新，又日新。',
      test_url: 'https://wecscf.qhhrly.cn/#/',
      dev_url: 'https://wecscf.lianyirong.com.cn/#/',
      prod_url: 'https://wecscf.weqchain.com/#/'
    },
    {
      title: '上海银行',
      image: 'rangqizhang',
      introduce: '博学之，审问之，慎思之，明辨之，笃行之。',
      test_url: 'https://bosc-wecscf.qhhrly.cn/#/',
      dev_url: 'https://bosc-wecscf.lianyirong.com.cn/#/',
      prod_url: 'https://bosc-wecscf.weqchain.com/#/'
    },
    {
      title: '产融内管平台',
      image: 'link',
      introduce: '工欲善其事必先利其器',
      dev_url: 'https://ams-fin.lianyirong.com.cn/index.html#/login',
      test_url: 'https://ams-fin.qhhrly.cn/#/login',
      prod_url: 'https://ams-fin.llschain.com/#/login'
    },
    {
      title: '知识库',
      image: 'shebeixingxi',
      introduce: '重复 是为了更加坦荡地接受孤独',
      prod_url: 'https://doc.linklogis.com/books_space/62736e2d026ee7001506965f/view/6459b4a6ef13090014f215fd'
    },
    {
      title: 'Swagger文档',
      image: 'zuzhijigou',
      introduce: '众生皆具如来智慧德相',
      dev_url: 'https://beehive-scf.lianyirong.com.cn/scfpc-web/swagger-ui.html#/',
    },
    {
      title: '智慧场馆',
      image: 'gym',
      introduce: '智慧场馆服务一体化',
      dev_url: '',
      test_url: 'http://sports.jinzhengtaoche.com:9097/shSports/index.html#/page/stadium/list',
      prod_url: ''
    },
    {
      title: '元洪在线',
      image: 'food',
      introduce: '一站式全球食材供采平台',
      dev_url: '',
      test_url: '',
      prod_url: 'https://www.yhspzx.com:17443/'
    },
    {
      title: '万匠大作',
      image: 'art',
      introduce: '高端艺术品交易平台',
      dev_url: '',
      test_url: 'https://console.wjdz.art/mallYun-operator/#/dashboard',
      prod_url: 'https://console.wjdz.art/mallYun-operator/#/dashboard'
    },
  ])
  const sortTable: Array<any> = reactive([
    {
      title: '热门工具',
      data: [
        { 
          name: '豆包', 
          introduce: '字节跳动推出的免费AI智能助手', 
          url: 'https://www.doubao.com/',
          image: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/logo-icon.png'
        },
        { 
          name: '即梦AI', 
          introduce: '字节跳动推出的一站式AI创作平台', 
          url: 'https://jimeng.jianying.com/',
          image: 'https://lf26-web-site-static.bytedance.com/obj/eden-cn/zlmsnh_pjbunp/jimeng/favicon.ico'
        },
        { 
          name: 'TRAE编程', 
          introduce: '字节跳动推出的免费AI编程工具，基于Claude模型', 
          url: 'https://www.doubao.com/',
          image: 'https://img.icons8.com/fluent/48/code.png'
        },
        { 
          name: 'AiPPT', 
          introduce: 'AI快速生成高质量PPT', 
          url: 'https://www.aippt.cn/',
          image: 'https://img.icons8.com/fluent/48/microsoft-powerpoint-2019.png'
        },
        { 
          name: '秘塔AI搜索', 
          introduce: '最好用的AI搜索工具，没有广告，直达结果', 
          url: 'https://metaso.cn/',
          image: 'https://s.metaso.cn/favicon.ico'
        },
        { 
          name: '码上飞', 
          introduce: '一句话生成微信小程序、APP、H5网页', 
          url: 'https://www.codethis.ai/',
          image: 'https://img.icons8.com/fluent/48/code.png'
        },
        { 
          name: '堆友AI', 
          introduce: '阿里出品的免费AI绘画和出图神器', 
          url: 'https://d.design/',
          image: 'https://img.icons8.com/fluent/48/design.png'
        },
        { 
          name: '美图设计室', 
          introduce: 'AI图像创作和设计平台', 
          url: 'https://design.meitu.com/',
          image: 'https://img.icons8.com/fluent/48/image.png'
        },
        { 
          name: '绘蛙', 
          introduce: 'AI电商营销工具，免费生成商品图', 
          url: 'https://www.huiwa.com/',
          image: 'https://img.icons8.com/fluent/48/shopping-cart.png'
        },
        { 
          name: '办公小浣熊', 
          introduce: '最强AI数据分析助手', 
          url: 'https://raccoon.sensetime.com/',
          image: 'https://img.icons8.com/fluent/48/bar-chart.png'
        },
        { 
          name: '稿定AI设计', 
          introduce: '一站式AI设计与灵感创作平台', 
          url: 'https://www.gaoding.com/',
          image: 'https://img.icons8.com/fluent/48/design.png'
        },
        { 
          name: '扣子-AI办公', 
          introduce: '全面免费开放，提供专业AI Agent服务', 
          url: 'https://www.coze.cn/',
          image: 'https://img.icons8.com/fluent/48/robot.png'
        },
      ]
    },
    {
      title: '热门教程',
      data: [
        { 
          name: 'ES6 教程', 
          introduce: '阮一峰ES6教程', 
          url: 'https://es6.ruanyifeng.com/',
          image: 'https://img.icons8.com/fluent/48/javascript.png'
        },
        { 
          name: 'JavaScript 教程', 
          introduce: '最通俗易懂的 JavaScript 教程', 
          url: 'https://wangdoc.com/javascript/',
          image: 'https://img.icons8.com/fluent/48/javascript.png'
        },
        { 
          name: 'JS 代码规范', 
          introduce: '优秀的 JS 代码规范', 
          url: 'https://github.com/ryanmcdermott/clean-code-javascript',
          image: 'https://img.icons8.com/fluent/48/github.png'
        },
        { 
          name: 'TypeScript 教程', 
          introduce: '通俗易懂的 TypeScript 教程', 
          url: 'https://github.com/xcatliu/typescript-tutorial',
          image: 'https://img.icons8.com/fluent/48/typescript.png'
        },
        { 
          name: 'ms之道', 
          introduce: '牛客热心网友知识整理', 
          url: 'https://juejin.cn/post/7028478428680552456#heading-97',
          image: 'https://img.icons8.com/fluent/48/book.png'
        },
        { 
          name: 'Node.js 学习指南', 
          introduce: 'Node.js 学习指南，笔记系统整理',
          image: 'https://img.icons8.com/fluent/48/nodejs.png'
        },
      ]
    }
  ])
  function handleGo(data: any) {
    window.open(data.url)
  }

  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement
    img.src = defaultImage
  }
</script>

<style lang="scss" scoped>
.page-container {
  .header .footer{
    height:40px;
    width:100%;
    background:red;
  }
  .header {
    padding: 20px;
    line-height: 1.5;
    background: linear-gradient(135deg, #f5f7fa 0%, #598bef 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      
      .avatar > img {
        height: 48px;
        width: 48px;
        display: block;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .date-info {
          align-items: center;
          display: flex;
          margin: 0 20px;
          font-size: 18px;
          font-weight: bold;
          background: linear-gradient(90deg, #ff00cc, #3333ff, #00ccff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-flow 3s linear infinite;
      }
      
      .summary-container {
        align-items: center;
        display: flex;
        justify-content: flex-end;
        padding: 10px 20px;
        background: #ffffff;
        border-radius: 10px;
        color: #606266;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }
    
    @keyframes gradient-flow {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }
    
    @media (max-width: 768px) {
      padding: 16px;
      border-radius: 0 0 16px 16px;
      
      .header-content {
        flex-wrap: wrap;
        margin-bottom: 12px;
        
        .date-info {
          margin: 12px 0;
          font-size: 16px;
        }
        
        .summary-container {
          width: 100%;
          justify-content: center;
          margin-top: 12px;
        }
      }
    }
  }
  .container {
    display: flex;
    margin: 20px;
    // align-items: flex-start;
    gap: 20px;
    @media (max-width: 768px) {
      flex-direction: column;
      margin: 16px;
      gap: 16px;
    }
    .left{
      flex: 0 1 65%;
      background: #ffffff;
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      min-height: 500px;
      @media (max-width: 768px) {
        flex: 1;
        min-height: auto;
        padding: 20px;
      }
      .top {
        font-size: 18px;
        margin: 0 0 24px 0;
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #333;
      }
      .project-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 10px;
        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 480px) {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .project {
          height: 140px;
          border: 1px solid #e8eaed;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          .project_name {
            display: flex;
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            align-items: center;
            margin: 0 0 10px 0;
            .svg-icon {
              width: 2.5rem;
              height: 2.5rem;
              fill: rgb(18 92 242);
            }
            img {
              width: 40px;
              height: 40px;
            }
          }
          .project_introduce {
            font-size: 13px;
            color: #666;
            line-height: 1.4;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            line-clamp: 3;
            -webkit-box-orient: vertical;
            height: 54px;
            word-break: break-all;
          }
          .url_goto {
            display: flex;
            flex-direction: column;
            gap: 10px;
            .env-add {
              a {
                display: block;
                padding: 10px 16px;
                background: linear-gradient(45deg, #4285f4, #34a853);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                text-align: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                &:hover {
                  background: linear-gradient(45deg, #3367d6, #2d7d32);
                  transform: translateY(-2px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }
                &:active {
                  transform: translateY(0);
                  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
              }
            }
          }
        }
        .project:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(66, 133, 244, 0.2);
          border-color: #4285f4;
        }
        .project:active {
          transform: translateY(-2px) scale(1.01);
          transition-duration: 0.1s;
        }
      }
    }
    .right{
      flex: 0 1 30%;
      background: #ffffff;
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      min-height: 500px;
      @media (max-width: 768px) {
        min-height: 300px;
        padding: 20px;
      }
      
      .illustration-section {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        
        img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          max-height: 120px;
        }
      }
    }
  }
  .sort-container {
    margin: 0 20px 40px 20px;
    .category-section {
      margin-bottom: 30px;
    }
    .hot-tools-section {
      background: linear-gradient(135deg, rgba(255, 69, 0, 0.05), rgba(255, 140, 0, 0.05));
      border-radius: 12px;
      padding: 20px;
      margin: 10px 0;
      border: 1px solid rgba(255, 69, 0, 0.1);
    }
    .hot-tutorials-section {
      background: linear-gradient(135deg, rgba(34, 139, 34, 0.05), rgba(50, 205, 50, 0.05));
      border-radius: 12px;
      padding: 20px;
      margin: 10px 0;
      border: 1px solid rgba(34, 139, 34, 0.1);
    }
    .section-title {
      font-size: 18px;
      margin: 20px 20px 10px 10px;
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #333;
      position: relative;
    }
    .hot-tools-title {
      color: #ff4500;
      .hot-badge {
        margin-left: 8px;
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        animation: pulse 2s infinite;
      }
    }
    .hot-tutorials-title {
      color: #228b22;
      .tutorial-badge {
        margin-left: 8px;
        background: linear-gradient(45deg, #32cd32, #90ee90);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        animation: pulse 2s infinite;
      }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .sort {
      display: flex;
      flex-wrap: wrap;
      margin: 0px 20px 20px 20px;
      .s1 {
        width: 22%;
        display: flex;
        align-items: center;
        height: 100px;
        position: relative;
        background: #fff;
        margin: 0 1% 15px 1%;
        border: 1px solid #e8eaed;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        box-sizing: border-box;
      }
      .s1:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        border-color: #4285f4;
      }
      .tool-icon {
        flex-shrink: 0;
        margin-right: 16px;
        .project_name img {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
      .tool-content {
        flex: 1;
        overflow: hidden;
      }
      .tool-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1.4;
      }
      .tool-description {
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  }
}
</style>
<style>
.glow-card {
  background: #f7f6f6;
  position: relative;
  overflow: hidden;
}

.glow-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, 
    transparent, #08c96f, transparent);
  animation: rotate 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.glow-card:hover::before {
  opacity: 1;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
<style>
.flip-card {
  width: 100%;
  height: 200px;
  perspective: 1000px;
}

.flip-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  position: relative;
}

.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}

.front, .back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  /* display: flex;
  align-items: center;
  justify-content: center; */
  border-radius: 10px;
  /* padding: 20px; */
}

.front {
  background: #ffffff;
  text-align: left;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 12px;
}

.back {
  background: #f8f9fa;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 12px;
}
</style>

<style scoped>
/* ProfileCard弹框样式 */
.profile-card-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.profile-card-container {
  position: relative;
  animation: slideIn 0.3s ease;
}

.profile-card-animation {
  animation: scaleIn 0.3s ease;
}

.close-profile-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-profile-btn:hover {
  background: white;
  transform: scale(1.1);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 头像点击效果 */
.avatar {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;
  overflow: hidden;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>