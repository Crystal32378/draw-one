# Draw One 公開送審包｜草稿 v0.1

此包尚不可直接送審；未上傳、未提交、未發布。不含服務端原始碼或私有研究。審查透過既有 HTTPS MCP 服務進行。

## 待完成

- Crystal 的 organization ID 與所選 project；ID 本身不等於開發者驗證通過。確認組織 owner 或 Apps Management Write。
- 發布者驗證：本人在 https://platform.openai.com/settings/organization/general 完成。不得將證件或 API key 放入包。
- 已確認個人發布者 Crystal Chang，公開客服 crystalys.chang@gmail.com；政策與條款草稿仍待核准。
- 將 public-pages 四頁部署成可存取的 HTTPS 頁，將 websiteURL、supportURL、privacyPolicyURL、termsOfServiceURL 加入 manifest interface。政策現為草稿，不能用草稿頁聲稱已完成法律與隱私審閱。
- 核對 Vercel 真實日誌設定、資料保存範圍，以及文字／現代版本整理資料的公開授權。
- category 暫沿用 Lifestyle，依 dashboard 的合法分類選項調整。
- assets/icon.svg 為新製的籤片圖示草稿，需 Crystal 視覺核准。
- Astra 影片完成後，補 review.demo_recording_url。網址需審查者無須申請權限即可播放。
- manifest 中五正三負為待執行送審案例，不可宣稱已全部通過。現有實測是 SDK 三籤系、本機 UI 保留、ChatGPT 觀音抽籤與切換籤系保留；負向宿主案例尚待跑。
- 在 CSP 啟用的宿主跑完整 5+3 案例，確認 UI bridge、儲存、非 model 可見工具及來源狀態。先前真正 ChatGPT 測試時顯示 CSP off，未變更設定。
- 平台 MCPs Connect 產生 domain challenge 後，部署 exact token 到 /.well-known/openai-apps-challenge，再驗證與 scan。

## 提交入口

https://platform.openai.com/plugins → Upload new or existing plugin → verified Developer identity → Upload plugin。
檢查 Metadata & Skills、MCPs；Review information → Review details 核對案例與影片。
所有必要錯誤排除後，Submit for review；政策聲明由發布者了解並確認。審核通過後再 Publish plugin。

此服务 No authentication，因此不需測試帳號；不要捏造 reviewer credentials。
官方流程：https://developers.openai.com/plugins/deploy/submission

## 宮廟體驗修正

已改回原版宮廟、直排籤紙、籤簿、私人筆記與分享；先前簡化表單截圖已過期，正式送審影片與截圖須使用更新後版本。SDK 全 260 籤排版通過；本機宮廟、保留、筆記及 PNG 下載通過。ChatGPT 完整版本驗收另記於最新狀態檔，不提前宣稱 5+3 全過。


## 宮廟接入最新驗收

截圖已換為 v0.1.1 真正 ChatGPT 的原版籤紙。關帝第八十九籤、籤簿回看與私人筆記已通過；圖片預覽已通過，一鍵下載仍受 ChatGPT 沙盒與未提供 downloadFile 能力限制。CSP on 及正式 5+3 案例尚待驗收，不可提交為全部通過。
