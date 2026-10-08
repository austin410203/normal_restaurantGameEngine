# 用這個模板開發新的經營模擬遊戲

這個 repo 是一個「可直接玩的範例遊戲」＋「可重複使用的引擎」。
開新遊戲時，**不要從零寫**，而是複製這個 repo，改資料檔和少數畫面檔。

## 1. 建立新專案
```bash
git clone https://github.com/austin410203/normal_restaurantGameEngine.git my-new-game
cd my-new-game
rm -rf .git && git init          # 變成新專案
npm install
npm run dev                      # 先確認範例遊戲能跑
```
Blender 模型工具（要改 3D 物件時才需要）：`pip install bpy`（需 Python 3.13）。

## 2. 要改哪些檔案（依序）
| 步驟 | 檔案 | 改什麼 |
|---|---|---|
| ① 食材與餐點 | `src/game/types.ts` | `ItemId`（所有食材/半成品）、`MenuId`（可點的餐點） |
| ② 配方 | `src/game/data/recipes.ts` | 烹調規則、組裝配方、價格、HUD 用的 emoji 圖示 |
| ③ 廚房配置 | `src/game/data/layouts.ts` | 每個工作站的種類與座標 |
| ④ 關卡 | `src/game/data/levels.ts` | 8 關的車道數、菜單、來客速度、耐心、事件、三星條件、升級 |
| ⑤ 文字 | `src/ui/i18n.ts` | 遊戲名稱、關卡名、物品名、教學文字（中英各一） |
| ⑥ 3D 模型 | `tools/blender/*.py` | 新食物、新工作站、新角色、新車；改完跑 `npm run models` |
| ⑦ 存檔名稱 | `src/store/useGame.ts` | `KEY` 改成新遊戲的名字，避免和舊遊戲的存檔混在一起 |
| ⑧ 測試 | `src/game/__tests__/engine.test.ts` | 調整成新配方 |

場景外觀（環狀道路、街屋、餐廳牆面、招牌）在 `src/scene/City.tsx`、`World.tsx`；配色在 `src/styles.css` 的 `:root` 和 `src/scene/kit.ts` 的 `PAL`。

## 3. 已內建、不用重做的功能
- 訂單系統、排隊、耐心倒數、連擊倍率、評價、1–3 星結算、升級解鎖
- 8 關的關卡框架＋事件（下雨、塞車、尖峰、設備故障，都會提前 5 秒預告）
- 中英文切換、白天/晚上切換、音效開關、速度調整、暫停選單、除錯面板（按 `` ` ``）
- 開始畫面直接選關、關卡地圖、結算畫面、localStorage 存檔
- 鍵盤／手把／手機搖桿；手機專用精簡 HUD（直向、橫向都排好）
- Blender 建模流水線（倒角、細分、自動壓縮）與物件總覽圖
- Vercel 部署設定、可放進 Claude artifact 的單檔建置（`npm run build:single`）

## 4. 部署
- **Vercel**：把專案推上 GitHub，在 Vercel 後台 Import，不用改設定。
- **Claude artifact**：`npm run build:single`，把 `dist-single/` 發佈出去。

## 5. 省 token 的做法
1. 把 `docs/PROMPT_TEMPLATE.md` 的提示詞填好再貼給 Claude，一次講清楚主題、菜單、關卡。
2. 請 Claude「先讀 CLAUDE.md，只打開需要的檔案」——`CLAUDE.md` 已經寫好每個檔案負責什麼。
3. 改數值（難度、價格、時間）只要改 `levels.ts`／`recipes.ts`，不用動引擎。
4. 3D 物件先改 `tools/blender/` 對應的一個檔案，再 `npm run models`，不要叫 Claude 重寫整個場景。
