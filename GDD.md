# GAME DESIGN DOCUMENT (GDD)
## RỒNG RẮN LÊN MÂY REMIX

> **Khẩu hiệu (Tagline):** *"Né Thầy Thuốc · Bẻ Cua Quất Đuôi · Bay Lên Cõi Mây Neon!"*  
> **Cuộc thi:** IT GAME JAM 2026 – WITH AI (LCĐ Khoa CNTT, Trường ĐH Khoa học, ĐH Huế)  
> **Thể loại:** Action-Physics Arcade / Roguelite nhẹ  
> **Chế độ chơi:** 1 người chơi (Single-player: Cô Tấm + chuỗi khúc đuôi lồng đèn / hóa Rồng Ánh Sáng)  
> **Công nghệ:** HTML, CSS (Tailwind CSS v4), TypeScript, React 19, Phaser 4.2.1 (`Phaser.CANVAS`, Vite 8) + Web Audio API  
> **Độ phân giải chuẩn đấu trường:** `1440 × 810` (`Phaser.Scale.FIT`, tự căn giữa responsive)  
> **Thời lượng một ván:** 2 – 3 phút (Quick session, 3 Đợt + Đấu Trùm)

---

## 1. Ý TƯỞNG (CONCEPT & ĐIỂM SÁNG TẠO)

### 1.1. Tóm tắt ý tưởng (High Concept)
**Rồng Rắn Lên Mây Remix** chuyển thể trò chơi dân gian Việt Nam thành một web game hành động vật lý tốc độ cao dành cho **1 người chơi**. Người chơi điều khiển **Cô Tấm** dẫn đầu kéo theo **4 khúc đuôi lồng đèn phát sáng** uốn lượn theo vật lý dây xích (*Snake-Chain Physics*) qua các lối đi quanh **Cây Đa, Ao Sen và 4 đảo bụi tre/đá** của sân đình làng quê. Người chơi vừa né sự truy đuổi tìm đường thông minh (A\*) của **Thầy Thuốc**, vừa nhặt **Lồng Đèn Hồi Khúc** mỗi 10 giây, vừa canh nhịp **Quất Đuôi Vật Lý** (hồi chiêu 10s) để làm choáng Boss, và gom **Hạt Mây Năng Lượng** để **biến hình hoàn toàn thành Rồng Ánh Sáng** đảo ngược thế trận rượt húc Thầy Thuốc.

### 1.2. Điểm sáng tạo cốt lõi & Đối chiếu Thể lệ (Thang điểm 100)

| Tiêu chí Thể lệ | Điểm | Cách **Rồng Rắn Lên Mây Remix** hiện thực hóa trong code |
| --- | :---: | --- |
| **Ý tưởng sáng tạo** | **40** | - **Nghịch lý "Điểm yếu = Vũ khí":** Chóp đuôi vừa là mục tiêu Thầy Thuốc nhắm vồ, vừa là đầu roi năng lượng để quất choáng Boss khi Dash + bẻ cua gắt (*Drift Whip*, hồi chiêu `10s`).<br>- **1 tài nguyên – nhiều sự đánh đổi:** Khúc đuôi vừa là **HP** (`4/4` khúc), vừa quyết định **sát thương Rồng húc Boss** (`100 + 25 × số khúc`), vừa là **vật hiến tế** trong sự kiện *Xin Khúc*, và có thể phục hồi chiến thuật nhờ **Item Hồi Khúc mỗi 10 giây**.<br>- **Biến hình đảo vai (Lên Mây):** Khi đủ `100%` Thanh Mây, Cô Tấm cùng toàn bộ khúc đuôi **biến hình thành Rồng Ánh Sáng** có đầu rồng, sừng vàng, râu động, thân vảy ngọc và đuôi lửa, buộc Thầy Thuốc quay đầu chạy trốn theo mạng đường A\*. |
| **Trải nghiệm chơi** | **20** | - **Dễ học trong 10 giây:** Chỉ cần di chuột hoặc `WASD`/phím mũi tên để lái + `Click Trái / Space / Shift` để Dash & Quất Đuôi; màn hình mở đầu có hướng dẫn ngắn 3 mục.<br>- **Cảm giác điều khiển mượt & rõ ràng:** Hỗ trợ input buffer cho Dash (`0.14s`), di chuyển chia bước nhỏ không vướng kẹt tường, có vòng cảnh báo trực quan trước đòn Lao Vồ và Bùa Độc. |
| **Hiện thực hóa ý tưởng** | **20** | - Hoàn thiện trọn vẹn **3 Đợt chơi + Đấu Trùm 1.000 HP + Sự kiện Xin Khúc + Lưu kỷ lục & Top 5 Leaderboard**.<br>- Tách riêng toàn bộ luật chơi và vật lý/AI tìm đường trong `src/core/` và kiểm chứng bằng **20 unit test tự động** (`node:test`).<br>- Chạy 100% offline không phụ thuộc server ngoài, thuần phong mỹ tục Việt Nam. |
| **Hiệu quả sử dụng AI** | **10** | - Ứng dụng AI trong dựng khung React + Phaser 4 + TypeScript, chuẩn hóa collider bản đồ theo từng pixel ảnh nền, cài đặt thuật toán tìm đường Grid A\* 8 hướng cho Thầy Thuốc, thiết kế sprite procedural Rồng Ánh Sáng & Lồng Đèn Hồi Khúc, tổng hợp âm thanh Dân Gian Remix bằng Web Audio API và viết bộ unit test kiểm chứng. |
| **Trình bày & Yêu thích** | **10 + Giải phụ** | - Mỹ thuật **Đông Hồ Neon** đậm bản sắc Việt kết hợp sân đình sống động làm nền màn hình chính; pha biến hình **Rồng Ánh Sáng** rực rỡ rất nổi bật khi trình chiếu màn hình lớn. |

### 1.3. Định hướng Thẩm mỹ & Tài nguyên (Art & Audio)
* **Thị giác (Đông Hồ Neon):**
  * **Nền đấu trường:** Bản đồ sân đình làng quê (`/assets/aistudio/image_2e458c28.png`), được pre-bake đúng tỉ lệ `1440 × 810` (`bg_courtyard_1to1`) để dựng hình Canvas2D mượt 60 FPS, phủ lớp bầu không khí đêm lễ hội (`#120E1F`, chuyển sang tím huyền `#220845` khi Lên Mây).
  * **Bảng màu nhấn:** Đỏ son (`#E63946`), Vàng nghệ (`#FFB703`), Xanh ngọc (`#06D6A0`), Tím Neon (`#9B5DE5`), Hồng san hô (`#FF4D6D`).
  * **Sprite nhân vật & Boss:** Cô Tấm (`/assets/aistudio/skin_co_tam_285e2153.png`) và Thầy Thuốc (`/assets/aistudio/boss_thay_thuoc_idle_fea08f45.png`).
  * **Sprite vẽ thủ tục (Procedural Canvas Textures trong `texture-utils.ts`):**
    * Chuỗi đuôi thường: Lồng đèn đỏ-vàng (`seg_lantern`) và chóp đuôi ngọc (`seg_tip`).
    * Bộ biến hình **Rồng Ánh Sáng** khi Lên Mây: Đầu Rồng (`dragon_head` với sừng vàng, bờm lửa đỏ-vàng, Ngọc Rồng giữa trán, mắt hổ phách + cặp râu rồng ánh kim uốn sóng động), Thân Rồng vảy ngọc có sống lưng vàng & vây mây (`dragon_body_seg`), Đuôi Rồng lửa ngọc xòe cánh (`dragon_tail_tip`).
    * Vật phẩm & Mối nguy: Hạt Mây Năng Lượng (`cloud_orb`), **Lồng Đèn Hồi Khúc** (`heal_lantern` mang dấu `+` và vòng phát nhịp hồng-vàng), Bùa Độc (`talisman_paper`), Ma Trơi (`spirit_wisp`), và 5 loại hạt sáng pre-baked (`glow_gold`, `glow_jade`, `glow_red`, `glow_purple`, `glow_white`).
* **Âm thanh (100% Web Audio API tổng hợp offline trong `audio-manager.ts`):**
  * *Nhạc Dân Gian Remix (Trạng thái thường):* Thang âm Ngũ Cung Việt Nam (D minor / điệu Lý), kết hợp tiếng **Đàn Tranh** có luyến láy, **Trống Chầu / phách gỗ** và sub-bass hiện đại; nhịp độ tăng dần theo Đợt (`114 BPM` → `121 BPM` → `128 BPM`).
  * *Nhạc Lên Mây (Fever Mode):* Tự động chuyển tức thì sang beat **EDM/Trap 142 BPM** với supersaw arpeggio ngũ cung và kick/clap dồn dập.
  * *Hiệu ứng âm thanh (SFX):* Nhặt Hạt Mây (tăng cao độ theo combo), nhặt Lồng Đèn Hồi Khúc (chuông ngũ cung đi lên), Dash gió vút, kích hoạt Quất Đuôi, Quất Trúng (trống chầu trầm + chuông choáng), cảnh báo đòn Boss/Bùa, đứt khúc, chuông Xin Khúc, kích hoạt Lên Mây, Rồng Húc, Chiến Thắng và Thất Bại.

---

## 2. ĐIỀU KHIỂN (CONTROLS & PHẢN HỒI HÀNH ĐỘNG)

### 2.1. Bảng thao tác thực tế

| Hành động | Chuột | Bàn phím | Chức năng trong game |
| --- | --- | --- | --- |
| **Bắt đầu từ Menu** | Click nút **"Chơi Ngay"** | `Enter` hoặc `Space` | Vào ngay Đợt 1 từ màn hình tiêu đề. |
| **Di chuyển / Lái đầu** | Di chuyển trỏ chuột trên sân | `W` `A` `S` `D` hoặc `↑` `↓` `←` `→` | Điều khiển Cô Tấm (hoặc Đầu Rồng khi Lên Mây) lượn quanh các lối đi; các khúc đuôi chạy bám theo quán tính dây xích. |
| **Bứt tốc (Dash) & Quất Đuôi** | **Click Chuột Trái** | `Space` hoặc `Shift` | Kích hoạt Dash (`0.24s`, tốc độ `×1.95`, hồi chiêu Dash `1.2s` / `0.9s`). Nếu đang trong cửa sổ Dash và bẻ cua gắt khi kỹ năng **Quất Đuôi** sẵn sàng (hồi chiêu `10s`) sẽ kích hoạt **Quất Đuôi Vật Lý**. |
| **Chọn sự kiện "Xin Khúc"** | Click trực tiếp vào 1 trong các thẻ Bùa Buff hoặc nút **Không Cho** | Phím `1` (chọn Bùa đầu tiên) / Phím `2` (Không Cho) | Chọn hy sinh 1 khúc lấy Bùa Buff vĩnh viễn hoặc Khịa Thầy Thuốc lấy `x2` điểm. |
| **Tạm dừng / Tiếp tục** | Nút Pause góc trên-phải | `P` hoặc `Esc` | Tạm dừng/tiếp tục ván chơi (mở `PauseModal`). |
| **Bật / Tắt âm thanh** | Nút Loa góc trên-phải | `M` | Tắt hoặc bật toàn bộ nhạc nền và SFX. |
| **Chơi lại nhanh** | Nút **"Chơi Lại"** | `R` (ở màn hình Kết thúc) | Reset sạch toàn bộ trận đấu và vào lại Đợt 1 tức thì. |

### 2.2. Phản hồi hành động (Game Feel / Juice)
* **Trạng thái Quất Đuôi:** Khi bẻ cua đủ gắt trong lúc Dash (và hồi chiêu `10s` đã xong), chóp đuôi mở rộng vòng sáng vàng rực, kéo vệt năng lượng và bắn tia lửa. Khi đang hồi chiêu `10s`, vòng chóp đuôi dịu sang màu tím xám và HUD hiển thị đếm ngược `10s → 1s`.
* **Quất trúng Thầy Thuốc:** Dừng khung hình ngắn (*hitstop* `45ms`), rung màn hình giảm chấn (*camera trauma*), Thầy Thuốc lóe trắng và bị đẩy lùi, xoay 3 ngôi sao choáng trên đầu trong `2 giây` (`3 giây` nếu có *Đuôi Sấm Sét*), nổ 22 hạt pháo hoa, rơi **4 Hạt Mây** và hiện chữ nổi `"QUẤT TRÚNG! +100"`.
* **Nhặt Lồng Đèn Hồi Khúc:** Nổ hạt ngọc-vàng, vang chuông ngũ cung đi lên, hiện chữ nổi `"+1 KHÚC ĐUÔI!"` (hoặc `"ĐẦY KHÚC! +50"` nếu đã đủ `4/4` khúc).
* **Bị đứt khúc đuôi:** Viền màn hình chớp đỏ, hitstop `50ms`, camera shake mạnh, tiếng trống trầm, hiện `"ĐỨT 1 KHÚC!"` và nhấp nháy bất tử `1.5 giây`.
* **Kích hoạt "Lên Mây":** Nổ 28 hạt ngọc-vàng, hiện chữ `"HÓA RỒNG LÊN MÂY!"`, đổi màu không gian sang lễ hội Neon, viền màn hình phát ánh ngọc-tím, và **biến hình trực tiếp Cô Tấm + đuôi thành Rồng Ánh Sáng** uốn lượn.

---

## 3. LUẬT CHƠI (GAMEPLAY RULES & CƠ CHẾ HIỆN TẠI)

### 3.1. Bản đồ Sân Đình & Vật cản cứng (Solid Obstacles)
Đấu trường (`1440 × 810`, vùng di chuyển `x: 112..1328`, `y: 162..788`) có hệ thống vật cản khớp sát ảnh nền (`COURTYARD_ARENA_BOUNDS` trong `src/core/chain-math.ts`), đảm bảo mọi lối đường đất và cầu đá rộng thoáng (`≥ 76px`) nhưng chặn tuyệt đối không đi xuyên:
1. **Cây Đa trung tâm:** Collider elip (`cx=720, cy=398, rx=100, ry=84`) kèm vòng sáng dịu dưới gốc.
2. **4 Đảo bụi tre & tảng đá có hàng rào:** 2 đảo phía trái (`island_upper_left`, `island_lower_left`) và 2 đảo đối xứng phía phải (`island_upper_right`, `island_lower_right`).
3. **Hồ Sen (Ao Sen) phía dưới:** Collider chữ nhật (`x: 462..978, y: 604..726`).
4. **Hàng rào gỗ phía trên:** 2 đoạn trái/phải (`x: 488..660` & `780..952, y: 208..226`), mở rộng lối cầu đá trước Cổng Làng.
5. **4 Chòi góc & vườn cây rìa sân:** 4 vùng chặn ở 4 góc bản đồ.
* Cả người chơi (bán kính va chạm `20px`), từng khúc đuôi (`16px`), và Thầy Thuốc (`24px` ở Đợt 1–2, `28px` ở Đợt 3) đều dùng di chuyển chia bước nhỏ (`moveWithObstacleSubsteps`) để trượt mượt dọc tường/cây mà không bao giờ xuyên vật cản. Hạt Mây và Lồng Đèn Hồi Khúc chỉ sinh ra trên phần đường đi hợp lệ (`isPointClearOfObstacles`).

### 3.2. Nhân vật & Chuỗi Khúc Đuôi
* **Khởi đầu:** Cô Tấm xuất hiện trên đường đất phía dưới-trái (`x=330, y=565`) cùng **4 khúc đuôi lồng đèn** (khoảng cách giữa mỗi đốt `38px`, tối đa hiển thị & hồi phục là `4/4` khúc).
* **Tốc độ cơ bản:** `305 px/s`; khi Dash tăng `×1.95` trong `0.24s` (hồi chiêu Dash `1.2s`); khi Lên Mây tăng `×1.25`.
* **Quy tắc HP:**
  * Khi Thầy Thuốc, Bùa Độc (đang kích hoạt) hoặc Ma Trơi chạm vào bất kỳ khúc đuôi nào (lúc không bất tử, không Lên Mây, và không trong trạng thái Quất Đuôi) → **đứt 1 khúc đuôi** + nhận **`1.5 giây` bất tử**.
  * Khi còn **0 khúc đuôi** và Cô Tấm bị trúng đòn thêm 1 lần nữa → **Thất bại (Game Over)**.

### 3.3. Các cơ chế Gameplay cốt lõi

#### A. Quất Đuôi Vật Lý (Drift Whip — Hồi chiêu 10 giây)
* **Điều kiện kích hoạt (`canActivateWhip` + `shouldTriggerDriftWhip`):**
  * Kỹ năng Quất Đuôi không trong thời gian hồi chiêu (`whipCooldown <= 0`), không đang Lên Mây và còn ít nhất 1 khúc đuôi.
  * Người chơi đang trong lúc **Dash** (`0.24s`) hoặc cửa sổ quán tính sau Dash (`dashGraceTimer = 0.42s`) và bẻ cua tổng góc **`≥ 75°`** HOẶC vận tốc vung của chóp đuôi đạt **`≥ 520 px/s`**.
* **Hiệu ứng:**
  * Trong **`0.52 giây`**, chóp đuôi (và đốt kế cuối) trở thành vùng **Roi Năng Lượng** bán kính cơ bản `52px` (`+16px` ở Đợt 3; `×1.3` nếu có *Đuôi Sấm Sét*), đồng thời miễn nhiễm đứt đuôi khi va chạm Boss/Ma Trơi.
  * Kích hoạt ngay **hồi chiêu `10 giây`** cho kỹ năng Quất Đuôi (`BASE_WHIP_COOLDOWN_SEC: 10.0`), trong khi **Dash** vẫn giữ hồi chiêu ngắn (`1.2s` / `0.9s`) để người chơi né đòn linh hoạt.
  * Khi quất trúng Thầy Thuốc: đẩy lùi mạnh, gây **Choáng `2.0s`** (`3.0s` với *Đuôi Sấm Sét*), làm rơi **4 Hạt Mây Năng Lượng** quanh Boss và cộng **`+100 điểm`** (nhân hệ số nếu có).

#### B. Vật phẩm Hồi Khúc mỗi 10 giây (Lồng Đèn Hồi Khúc)
* **Chu kỳ xuất hiện:** Mỗi **`10 giây`** (`HEAL_ITEM_SPAWN_INTERVAL_SEC: 10.0`), 1 **Lồng Đèn Hồi Khúc** (`heal_lantern`) tự xuất hiện trên lối đi hợp lệ cách người chơi `> 130px` (tối đa **`2`** item tồn tại cùng lúc trên sân), có chữ nổi `"HỒI KHÚC!"` và vòng sáng hồng-vàng phát nhịp dễ nhận diện.
* **Cơ chế nhặt (`applyHealSegmentPickup`):** Tự động hút nhẹ khi Cô Tấm đến gần (`< 84px`), nhặt ở khoảng cách `≤ 40px`:
  * Nếu đang thiếu khúc (`< 4/4`): **Hồi lại +1 khúc đuôi** nối vào cuối chuỗi + cộng **`+30 điểm`** (nhân hệ số).
  * Nếu đã đủ **`4/4` khúc**: Cộng **`+50 điểm`** (nhân hệ số) và nạp **`+10% Thanh Mây`**.

#### C. Thu thập Hạt Mây & Fever Mode "LÊN MÂY" (Hóa Rồng Ánh Sáng)
* **Hạt Mây Năng Lượng:** Khởi đầu có 7 hạt trên đường sân đình, sau đó sinh định kỳ theo Đợt (tối đa `10` hạt thường trên sân) và rơi thêm `4` hạt mỗi lần Quất Đuôi trúng Boss. Tự động hút về phía Cô Tấm trong bán kính `112px` (`×2` với *Tụ Mây Thần Tốc*).
* **Tích lũy & Kích hoạt:** Mỗi Hạt Mây nạp **`+6.25%`** Thanh Mây (~16 hạt đạt `100%`; tăng `×1.35` với *Tụ Mây Thần Tốc*). Khi chạm `100%`, kích hoạt **Lên Mây** trong **`8.0 giây`**:
  * **Biến hình thành Rồng Ánh Sáng:** Nhân vật chính đổi sang sprite **Đầu Rồng** xoay theo hướng bay kèm cặp râu rồng ánh kim động; toàn bộ khúc đuôi biến thành **Thân Rồng vảy ngọc** và **Đuôi Rồng lửa ngọc** xoay mềm mại theo góc từng đốt.
  * **Đảo ngược vai trò:** Người chơi **bất tử hoàn toàn**, chạy nhanh hơn `+25%`, lao húc trực tiếp vào Thầy Thuốc (cooldown húc `0.4s`) để đẩy lùi, cộng **`+150 điểm`** và gây sát thương ở Đợt 3 theo công thức:
    `Sát thương = 100 + 25 × số khúc đuôi` (ví dụ 4 khúc = `200 HP`/cú húc; 0 khúc = `100 HP`/cú húc).
  * Ở Đợt 1–2, mỗi cú Rồng húc cũng làm choáng Thầy Thuốc thêm `1.0s` và cộng `+150 điểm`.
  * Trong suốt 8 giây Lên Mây, Thầy Thuốc chuyển sang **chạy trốn dọc mạng lưới đường A\*** tránh xa Rồng Ánh Sáng.
  * Khi hết 8 giây, biến trở lại thành Cô Tấm + lồng đèn, Thanh Mây về `0%`, nhận `1.2s` i-frame và đẩy Thầy Thuốc ra xa tối thiểu `280px` nếu đang đứng quá sát.

#### D. AI Thầy Thuốc (Grid A\* Pathfinding & Bộ kỹ năng)
* **Tìm đường thông minh (Grid A\* 8 hướng):** Dùng lưới `60 × 34` (ô `24px`) có kiểm tra không cắt góc vật cản, làm mượt đường đi (*string-pulling*), cập nhật lại đường mỗi `0.14s` và có cơ chế tự tính lại tức thì nếu bị vướng góc (*anti-stall safeguard*). Thầy Thuốc luôn biết đi vòng qua Cây Đa, Hồ Sen và 4 đảo đá/tre để truy đuổi chóp đuôi (hoặc bỏ chạy khi Lên Mây), không bị đứng yên kẹt vật cản.
* **Đòn Lao Vồ (Telegraphed Lunge):** Khi khoảng cách tới chóp đuôi nằm trong `115–420px` và đường thẳng tới mục tiêu không bị chắn vật cản (`isSegmentClearOfObstacles`), Thầy Thuốc hiện tia đỏ cảnh báo `0.55s` rồi lao tốc độ `×2.35` trong `0.36s`.
* **Bùa Độc (Đợt 2 & 3):** Ném 2–3 lá bùa lên sân (1 lá đón đầu hướng chạy Cô Tấm). Có vòng vàng-đỏ báo trước `1.0s` rồi kích hoạt vùng độc tím bán kính `52px` tồn tại `2.2s`.
* **Ma Trơi (Spirit Wisps — Đợt 2 & 3):** Bay quỹ đạo elip quanh quảng trường Cây Đa (Đợt 2: `1` Ma Trơi; Đợt 3: `2` Ma Trơi), gây đứt đuôi nếu chạm phải ngoài lúc Lên Mây / Quất Đuôi.

#### E. Sự kiện "Xin Khúc" (Tactical Sacrifice)
Diễn ra khi hoàn thành **Đợt 1** và **Đợt 2** (tạm dừng game, mở `XinKhucModal`):
1. **CHO 1 KHÚC (Chỉ mở khi còn `≥ 2` khúc đuôi):**
   * Đánh đổi giảm vĩnh viễn `1` khúc đuôi hiện tại để tự chọn **1 trong các Bùa Buff vĩnh viễn** chưa sở hữu:
     * **Hài Thần Gió (`wind_boots`):** Tốc chạy `+20%` · Giảm hồi chiêu Dash xuống `0.9s`.
     * **Đuôi Sấm Sét (`thunder_tail`):** Choáng Quất Đuôi tăng lên `3.0s` · Bán kính quất `+30%`.
     * **Tụ Mây Thần Tốc (`cloud_magnet`):** Nạp Thanh Mây `+35%` · Bán kính hút Hạt Mây `×2`.
2. **KHÔNG CHO (Khịa Thầy Thuốc):**
   * Giữ nguyên số khúc đuôi hiện tại.
   * Thầy Thuốc nổi điên: tăng `+15%` tốc độ rượt mỗi cấp nổi điên (`bossEnrageLevel`), giảm hồi chiêu Lao Vồ và ném Bùa Độc nhanh hơn (`×0.88`).
   * Thưởng hệ số **`×2` điểm thưởng** cho toàn bộ hành động trong Đợt tiếp theo.

### 3.4. Cấu trúc 3 Đợt Chơi (Wave Configs)

| Đợt | Tên hiển thị | Thời lượng / Điều kiện qua | Tốc độ Boss gốc | Lao Vồ (CD) | Bùa Độc | Ma Trơi | Chu kỳ Hạt Mây |
| :---: | --- | --- | :---: | :---: | --- | :---: | :---: |
| **Đợt 1** | *Hội Làng Khởi Động* | Sinh tồn `35 giây` → Xin Khúc #1 | `218 px/s` | `6.2s` | Tắt | `0` | `1.45s` |
| **Đợt 2** | *Bùa Độc Tăng Nhiệt* | Sinh tồn `45 giây` → Xin Khúc #2 | `248 px/s` | `5.0s` | `2` lá / `4.4s` | `1` | `1.35s` |
| **Đợt 3** | *Trảm Trùm Thầy Thuốc* | Rút cạn **`1.000 HP`** Boss (phóng to) | `266 px/s` | `4.2s` | `3` lá / `3.6s` | `2` | `1.15s` |

### 3.5. Hệ thống Tính Điểm

| Hành động | Điểm cơ bản | Ghi chú |
| --- | :---: | --- |
| Nhặt 1 Hạt Mây Năng Lượng | `+10` | Nhân `×2` nếu đang bật Khịa Thầy Thuốc |
| Nhặt Lồng Đèn Hồi Khúc (khi thiếu khúc) | `+30` | Kèm hồi `+1` khúc đuôi (nhân hệ số) |
| Nhặt Lồng Đèn Hồi Khúc (khi đã đủ `4/4` khúc) | `+50` | Kèm nạp `+10%` Thanh Mây (nhân hệ số) |
| Quất Đuôi làm choáng Thầy Thuốc | `+100` | Kèm rơi 4 Hạt Mây (nhân hệ số) |
| Rồng Ánh Sáng húc trúng Boss khi Lên Mây | `+150` | Cooldown húc `0.4s` (nhân hệ số) |
| Hoàn thành Đợt 1 / Đợt 2 | `+300` | Cộng khi hết giờ mỗi Đợt |
| Thưởng bảo toàn khúc đuôi khi Chiến Thắng | `+250 × Số khúc còn lại` | Cộng vào tổng điểm cuối trận |

---

## 4. KẾT THÚC (WIN / LOSE CONDITIONS & TỔNG KẾT)

### 4.1. Điều kiện Kết thúc
1. **CHIẾN THẮNG (VICTORY):**
   * Rút thanh máu Trùm Thầy Thuốc ở Đợt 3 về **`0 / 1.000 HP`**.
   * Nhịp kết thúc (`0.6s`): Thầy Thuốc xoay tròn tan biến thành 42 hạt pháo hoa Đông Hồ Neon trên nền nhạc chiến thắng, kèm câu thoại: *"Ái chà! Rồng Ánh Sáng lợi hại quá, Thầy Thuốc xin chịu thua!"*.
2. **THẤT BẠI (GAME OVER):**
   * Khi đã mất hết toàn bộ khúc đuôi (`0/4`) và Cô Tấm tiếp tục dính đòn.
   * Nhịp kết thúc (`0.45s`) chuyển sang màn tổng kết kèm câu thoại: *"Xin khúc không cho, giờ mất cả đoàn rồi nhé!"*.

### 4.2. Màn hình Tổng kết (`EndScreen.tsx`)
* Hiển thị trạng thái **CHIẾN THẮNG / THẤT BẠI**, Tổng điểm và **Điểm Cao Nhất** lưu bền vững qua `localStorage`.
* **Xếp hạng Danh hiệu (`computeRank`):**
  * `S` (`≥ 3.500đ`): **CHÂN LONG LÊN MÂY** (`#FFB703`)
  * `A` (`2.200 – 3.499đ`): **CAO THỦ QUẤT ĐUÔI** (`#06D6A0`)
  * `B` (`1.200 – 2.199đ`): **TAY LÁI HỘI LÀNG** (`#9B5DE5`)
  * `C` (`< 1.200đ`): **MỒI NGON THẦY THUỐC** (`#E63946`)
* **Bảng Thống kê Ván Chơi:** Đợt đạt được, số lần Quất Đuôi trúng, số lần Lên Mây, số Hạt Mây đã nhặt, số khúc đuôi còn lại, thời gian chơi và danh sách Bùa Buff đã nhận.
* **Bảng Xếp Hạng Cục Bộ (Top 5 Leaderboard – `localStorage`):** Nhập tên ngắn tối đa 16 ký tự để lưu kỷ lục ngay trên máy trình diễn.

---

## 5. CHƠI LẠI (REPLAYABILITY & ZERO-FRICTION RESTART)

* **Chơi lại tức thì:** Bấm nút **"Chơi Lại"** (hoặc phím `R` ở màn hình Kết thúc, hoặc trong `PauseModal`) gửi sự kiện `game:restart` qua `eventBus`, reset sạch toàn bộ thực thể (`segments`, `clouds`, `healItems`, `talismans`, `wisps`, `bossPath`, `whipCooldown`, `healSpawnTimer`, `particlePool`, `score`, `modifiers`) về Đợt 1 trong `< 0.5s` không cần tải lại trang.
* **Chiều sâu chiến thuật chơi lại:** Người chơi có thể xây dựng nhiều lối đánh: *tốc biến an toàn* (hiến khúc lấy *Hài Thần Gió* rồi nhặt *Lồng Đèn Hồi Khúc* mỗi 10s để bù lại khúc đuôi!), *khống chế gom mây* (*Đuôi Sấm Sét* + *Tụ Mây Thần Tốc*), hoặc *liều ăn điểm S* (từ chối Xin Khúc cả 2 lần để nhận `x2` điểm liên tiếp và húc Boss bằng Rồng 4 khúc).

---

## 6. KIẾN TRÚC KỸ THUẬT THỰC TẾ (CODEBASE ARCHITECTURE)

### 6.1. Phân tách lớp công nghệ

| Lớp công nghệ | File thực tế | Vai trò cụ thể |
| --- | --- | --- |
| **Core Pure Logic (`src/core/`)** | `game-rules.ts`, `chain-math.ts` + bộ test `*.test.ts` | Hằng số cân bằng, luật Xin Khúc, hồi chiêu Quất Đuôi 10s, logic nhặt Hồi Khúc, tính điểm/xếp hạng/leaderboard, vật lý dây xích, collider sân đình và thuật toán **Grid A\* 8 hướng** + tìm điểm chạy trốn Fever. |
| **Phaser 4 Engine (`src/game/`)** | `phaser-config.ts`, `PlayScene.ts`, `texture-utils.ts`, `audio-manager.ts`, `event-bus.ts` | Vòng lặp 60 FPS Canvas2D (`Phaser.CANVAS`, `Scale.FIT`), pre-bake nền 1:1, vẽ texture procedural (Rồng Ánh Sáng, Lồng Đèn Hồi Khúc, Hạt Mây, Bùa, Ma Trơi, hạt phát sáng), Zero-GC particle ring buffer (`96` hạt), Web Audio synthesizer offline. |
| **React 19 + Tailwind v4 UI (`src/components/`)** | `TitleScreen.tsx`, `GameHud.tsx`, `XinKhucModal.tsx`, `PauseModal.tsx`, `EndScreen.tsx` | Toàn bộ giao diện Overlay tách biệt khỏi vòng lặp Canvas: Màn mở đầu (nền sân đình chạy demo trực tiếp), HUD viền trên giữ `≥ 88%` không gian chơi (Khúc Đuôi, Dash, Thanh Mây, thanh hồi chiêu **Quất Đuôi 10s**, đếm ngược **Hồi Khúc 10s**, Đợt/HP Boss có thanh ghost damage, Điểm), các hộp thoại Pause / Xin Khúc / Tổng kết. |

### 6.2. Giao tiếp Phaser ↔ React (`src/game/event-bus.ts`)
* **Phaser → React:**
  * `hud:update` → `{ score, multiplier, segmentsCount, maxSegments, cloudPercent, wave, waveTitle, waveTimeLeft, bossHp, bossMaxHp, bossStunned, isFever, feverTimeLeft, dashCooldownRatio, whipActive, whipCooldownLeft, whipCooldownMax, healItemNextSec, healItemActiveCount, appliedBuffs, bannerText }` (lọc trùng trạng thái rời rạc để tránh re-render dư thừa).
  * `xinkhuc:open` → `{ waveCompleted, segmentsCount, canSacrifice, buffChoices }`
  * `game:ended` → `{ victory, score, bestScore, rank, stats, bossQuote }`
  * `game:state` → `{ state: 'title' | 'playing' | 'paused' | 'gameover' }`
  * `audio:muteChanged` → `{ muted }`
* **React → Phaser:**
  * `game:start`, `game:restart`, `game:returnTitle`
  * `game:setPaused` → `{ paused }`
  * `xinkhuc:select` → `{ choice: 'sacrifice' | 'refuse', buffId? }`
  * `audio:toggleMute`

### 6.3. Cấu trúc Thư mục Code Hiện tại
```text
public/
└── assets/aistudio/
    ├── image_2e458c28.png                # Bản đồ sân đình Đông Hồ (1672×941 -> pre-bake 1440×810)
    ├── skin_co_tam_285e2153.png          # Sprite nhân vật Cô Tấm
    ├── boss_thay_thuoc_idle_fea08f45.png # Sprite Boss Thầy Thuốc
    └── GDD_9ad178bd.md                   # Tài liệu GDD đồng bộ với mã nguồn

src/
├── main.tsx                              # Điểm vào React 19
├── App.tsx                               # Mount Phaser Canvas + quản lý trạng thái UI Overlay & phím tắt
├── index.css                             # Tailwind CSS v4, font, bảng màu Đông Hồ Neon & lacquer HUD
├── core/                                 # Logic thuần TypeScript + Unit Tests (20/20 pass)
│   ├── game-rules.ts                     # Hằng số, 3 Đợt, Buff Xin Khúc, Quất Đuôi 10s, Hồi Khúc 10s, Điểm/Rank
│   ├── game-rules.test.ts                # Unit test luật chơi, buff, hồi khúc, hồi chiêu quất đuôi, xếp hạng
│   ├── chain-math.ts                     # Vật lý dây xích, Drift Whip, collider bản đồ, tìm đường Grid A* 8 hướng
│   └── chain-math.test.ts                # Unit test dây xích, chặn xuyên cây đa/vật cản, A* qua đảo đá & chạy trốn
├── game/                                 # Phaser 4 Engine & Audio
│   ├── event-bus.ts                      # Typed Pub/Sub EventBus kết nối Phaser <-> React
│   ├── phaser-config.ts                  # Cấu hình Phaser 4 (CANVAS, Scale.FIT 1440×810, 60 FPS)
│   ├── texture-utils.ts                  # Procedural sprites (Rồng Ánh Sáng, Lồng Đèn Hồi Khúc, Mây, Bùa, Ma Trơi)
│   ├── audio-manager.ts                  # Web Audio API (Nhạc Dân Gian Remix Ngũ Cung / EDM Lên Mây + SFX)
│   └── scenes/
│       └── PlayScene.ts                  # Scene chính: Title showcase, gameplay 3 Đợt, A* Boss, Hóa Rồng Lên Mây
└── components/                           # React UI Overlay
    ├── TitleScreen.tsx                   # Màn hình chính + hướng dẫn 3 bước + nút Chơi Ngay
    ├── GameHud.tsx                       # HUD Khúc Đuôi, Thanh Mây, Quất Đuôi 10s, Hồi Khúc 10s, Đợt/Boss HP, Điểm
    ├── XinKhucModal.tsx                  # Hộp thoại tạm dừng sự kiện Xin Khúc (Phím 1 / 2)
    ├── PauseModal.tsx                    # Hộp thoại tạm dừng (Tiếp tục / Chơi lại / Về Menu)
    └── EndScreen.tsx                     # Màn hình Thắng/Thua, Thống kê, Xếp hạng S/A/B/C, Top 5 Leaderboard
```

### 6.4. Kiểm thử & Chất lượng (Verification)
* **Unit Tests (`npx tsx --test src/core/game-rules.test.ts src/core/chain-math.test.ts`):** 20/20 kiểm thử vượt qua, bao phủ:
  * Sinh chuỗi & giữ khoảng cách dây xích, uốn quanh Cây Đa và kích hoạt Drift Whip.
  * Chặn xuyên Cây Đa, Hồ Sen, 4 đảo bụi tre/đá, hàng rào cổng trên và 4 chòi góc (kể cả khi Dash tốc độ cao).
  * Thuật toán A\* dẫn Thầy Thuốc đi vòng mượt qua đảo đá dưới-trái, vòng quanh Cây Đa và tìm điểm chạy trốn khi Lên Mây.
  * Luật hồi chiêu Quất Đuôi `10s`, nhặt Lồng Đèn Hồi Khúc khi thiếu/đủ khúc, sự kiện Xin Khúc, sát thương Rồng húc, điểm và xếp hạng `S/A/B/C`.
* **Build & Type Check:** `npm run build` (Vite 8) và `npm run lint` (`tsc --noEmit`) sạch lỗi.
