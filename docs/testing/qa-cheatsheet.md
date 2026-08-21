# QA Cheat Sheet — arrival.html 的 dev 後門

維護註記（2026-08-21，大G 核示）：這些 URL flag 是 QA 後門，**保留、不做
production guard**——正常 user 不會看到；真正要防的是未來維護者找不到。
原則：**對 user 隱形，對 maintainer 顯眼。**

## URL flags（可疊加，如 `?weather=rain&devdraw=1`）

| flag | 作用 | 治理邊界 |
|---|---|---|
| `?weather=sunny\|cloudy\|rain\|wind` | 指定天氣試聽 | **不寫票**、跳過門檻；weather 永不進 draw（test 鎖死） |
| `?newday=1` | 撕掉今日票（`arrival.ticket.v1`），重新走入口門檻 | 誠實動線上一天一張票不可作弊——這是規則正確，不是 bug |
| `?devdraw=1` | 跳過拉籤手勢（點籤筒即完成抽籤） | 只縮短手勢，不繞過一事一籤 binding |
| `?halls=4` | 顯示假設性月老殿（增建中，fail-closed stress test） | 非 production；無任何 draw path 與殿內聲態 |

## 測試時被一事一籤關住？

同一問題（含空白問題）永遠回同一支籤——這是產品規則，不是 bug。
要重複測抽籤：**在案上寫一個新問題**即可；徹底重來用下方 localStorage。

## 本機狀態重置（devtools console）

```js
localStorage.clear() // 全部重來：初訪山門、空籤簿、無票、聲音偏好回預設
```

個別 key：`arrival.visited.v1`（初訪）、`arrival.ticket.v1`（今日票）、
`arrival.sound.v1`（「聲」偏好）、`arrival.lasthall.v1`（上次到訪）、
`drawone.book.v1`（籤簿——清掉＝清私人紀錄，勿在 user 裝置上動）。

## 測試怎麼跑

```
node scripts/test-draw-pool.mjs     # truth layer（CI 跑這套）
node scripts/test-slip-render.mjs   # The Slip
node scripts/test-arrival.mjs       # mechanics 契約
node scripts/test-sound.mjs         # 聲音層 source contracts
node scripts/test-sound-e2e.mjs     # runtime E2E（需 playwright-core＋本機 Chromium，無則 SKIP）
```

E2E 環境變數：`PW_CORE=` 指 playwright-core 路徑、`CHROMIUM=` 指瀏覽器執行檔
（預設找 `~/Library/Caches/ms-playwright/chromium-1228`）。
