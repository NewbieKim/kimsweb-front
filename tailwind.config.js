export default {
  content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
          colors: { // 背景颜色和文本颜色  bg-blue text-white 等
            blue: 'blue',
            white: 'white',
            pink:'pink'
          },
          width: (() => { // 元素宽度 w-0(0rem) - w-1000(rem)  宽高范围跟着UI图走的
            const widths = {};
            for (let i = 0; i <= 750; i++) {
              widths[`${i}`] = `${i}rem`; // 直接使用像素值作为键和值
            }
            return widths;
          })(),
          height: (() => { // 元素高度 h-0(0rem) - h-1448(1448rem)   宽高范围跟着UI图走的
            const height = {};
            for (let i = 0; i <= 1448; i++) {
              height[`${i}`] = `${i}rem`; // 直接使用像素值作为键和值
            }
            return height;
          })(),
          fontSize: (() => { // 字体大小 text-0(0rem) - text-100(100rem) 
            const fontSize = {};
            for (let i = 0; i <= 1000; i++) {
              fontSize[`${i}`] = `${i}rem`; // 直接使用像素值作为键和值
            }
            return fontSize;
          })(),
          lineHeight: (() => { // 行高值 leading-5
            const lineHeight = {};
            for (let i = 0; i <= 300; i++) {
              lineHeight[`${i}`] = `${i}rem`; // 直接使用像素值作为键和值
            }
            return lineHeight;
          })(),
          spacing: (() => { // 上下左右间距 left/right/bottom/top left-60
            const spacing = {};
            for (let i = 0; i <= 1448; i++) {
              spacing[`${i}`] = `${i}rem`;
            }
            return spacing;
          })(),
          margin: (() => { // 上下左右间距
            const margin = {};
            for (let i = 0; i <= 750; i++) {
              margin[`${i}`] = `${i}rem`;
            }
            return margin;
          })(),
          zIndex: (() => { // 层级
            const zIndex = {};
            for (let i = 0; i <= 100; i++) {
              zIndex[`${i}`] = `${i}`;
            }
            return zIndex;
          })()
      },
  },
  plugins: [],
}