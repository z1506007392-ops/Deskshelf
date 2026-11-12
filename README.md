# deskshelf

桌搭图库网站的前端静态原型：收录博主授权的真实桌搭照片，每张桌搭附一份「同款清单」，并能用 3D 小工具把桌面布局复刻出来。

目前包含两个页面，纯 HTML / CSS / JS，没有构建步骤和依赖。

| 文件 | 说明 |
| --- | --- |
| `index.html` + `app.js` | 首页：导航、大标题区、分类筛选 / 搜索 / 排序、瀑布流卡片、加载更多、页脚 |
| `detail.html` + `detail.js` | 详情页：按 `?slug=` 渲染图集、博主卡片、同款清单、3D 复刻预览、相似桌搭 |
| `shared.js` | 两个页面共用的示例数据 `SETUPS`、卡片渲染、登录占位弹层 |
| `styles.css` | 两个页面共用的样式和设计变量 |

## 本地预览

直接双击 `index.html` 即可，或者起一个静态服务器：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 设计约定

- 白底黑字、大量留白、圆角卡片、瀑布流
- 字体：Inter + JetBrains Mono + Noto Sans SC（Google Fonts）
- 路径式标签用等宽字体，例如 `/setups/white-oak-minimal`
- 只有一个强调色 `#E8542A`，定义在 `styles.css` 的 `--accent`，只用于 New 角标等少数位置
- 不用渐变和 emoji

## 现在是占位的部分

- 所有图片都是色块占位，没有使用任何真实博主的照片
- 博主昵称、路径名、清单物品都是示例数据，价格统一写作 `[价格]`
- 桌搭数据写死在 `shared.js` 的 `SETUPS` 里，接后端时替换成接口数据；只有 `white-oak-minimal` 单独写了简介和清单，其余按分类套用同一份示例
- 投稿、赞助、「去看看」、「打开 3D 小工具」等链接暂时指向 `#`
- 登录还没接后端，点击后弹出一段说明
- 收藏存在浏览器的 `localStorage` 里（键名 `deskshelf:saved`），不跨设备

## 地址参数

- 首页：`index.html?cat=极简&q=理线&sort=saved`。`cat` 是分类，`q` 搜索标题、路径、博主和标签，`sort` 可取 `new`（默认）、`saved`、`d3`。在页面上改筛选会同步写回地址栏
- 详情页：`detail.html?slug=white-oak-minimal`。不带 `slug` 显示第一张，`slug` 不存在时显示「没有找到」
