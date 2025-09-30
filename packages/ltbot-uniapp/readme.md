# HBuilderX 启动  

1. 如果 pnpm 安装不可以， 就使用 npm 安装。原因可能是qrcode包不兼容
2. 使用hbuilder的菜单上的运行到chrome 启动页面。 
3. 打包发布可能需要登录hbuilder, 并更新应用标识才行。  

开发功能模块：
1. `pages/index` 商品列表页面
2. `pages/cart` 购物车页面
3. `store.uts` 中，对接 @opentiny/next-sdk 的 client和server, 在 App.uvue中引入。
4. `store.uts` 中，添加一组 mcp 工具
5. `pages/qr.uvue` 网页上添加二维码功能，扫码可以遥控页面。