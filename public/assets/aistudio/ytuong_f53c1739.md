# GAME CONCEPT: RỒNG RẮN LÊN MÂY REMIX (WEB GAME)

> **Khẩu hiệu (Tagline):** *"Né Thầy Thuốc – Bẻ Cua Quất Đuôi – Bay Lên Cõi Mây Neon!"*  
> **Thể loại:** Action-Physics Arcade / Roguelite tốc độ cao  
> **Chế độ chơi:** 1 người chơi (Single-player)  
> **Nền tảng:** HTML5 Web Browser (PC – Chuột & Bàn phím)  
> **Thời lượng một ván:** 2 – 3 phút (Quick session)  
> **Phạm vi sản xuất:** Bản chơi hoàn chỉnh trong 150 phút (IT Game Jam with AI 2026)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Cốt Lõi Ý Tưởng (Elevator Pitch)
Dự án tái hiện trò chơi dân gian **Rồng Rắn Lên Mây** theo phong cách hiện đại: một tựa web game 1 người chơi kết hợp vật lý dây xích có quán tính (*Snake-Chain Physics*), chiến thuật đánh đổi *Xin Khúc* và thẩm mỹ dân gian phối khí Neon/EDM.

Người chơi điều khiển **1 nhân vật chính dẫn đầu**, kéo theo **chuỗi khúc đuôi phát sáng** phía sau để né sự truy đuổi của **Thầy Thuốc**, bẻ cua gắt để quất đuôi phản công và tích năng lượng hóa thành **Rồng Ánh Sáng** rượt đánh ngược lại Boss.

### 1.2. Trải Nghiệm Mục Tiêu (Player Experience)
* **Dễ hiểu trong 10 giây, giàu kỹ năng:** Chỉ 2 thao tác điều khiển cơ bản nhưng đòi hỏi làm chủ quán tính dây xích và thời điểm bẻ cua.
* **Căng thẳng → Bùng nổ:** Hồi hộp khi Thầy Thuốc áp sát chóp đuôi → Phấn khích khi bẻ cua quất choáng → Bùng nổ cảm xúc khi kích hoạt **Lên Mây** đảo vai đi săn.
* **Đậm chất Dân Gian Remix:** Nét vẽ Tranh Đông Hồ kết hợp viền Neon nổi bật; âm thanh chuyển đổi giữa nhịp dân gian và beat EDM dồn dập khi vào Fever Mode.

---

## 2. NHÂN VẬT & HỆ THỐNG KHÚC ĐUÔI

Thay vì quản lý nhiều nhân vật rời rạc, toàn bộ lối chơi tập trung vào **1 nhân vật người chơi + chuỗi khúc đuôi nối theo**:

* **Đầu (Người chơi điều khiển):** 1 nhân vật chính duy nhất (ví dụ: *Chú Tễu* hoặc *Cậu Bé Cầm Đèn Lồng* phong cách Đông Hồ viền Neon).
* **Phần còn lại (Chuỗi Khúc Đuôi):** Bắt đầu với **4 khúc đuôi** nối sau lưng theo vật lý dây xích (thể hiện dưới dạng các đốt thân rồng giấy / lồng đèn phát sáng đồng bộ).
* **Chóp đuôi (Khúc cuối cùng):** Luôn phát sáng viền nổi bật để người chơi nhận diện ngay 2 vai trò song song:
  * Là **điểm yếu** mà Thầy Thuốc luôn ưu tiên lao tới vồ.
  * Là **đầu roi** phát sáng rực rỡ khi bẻ cua gắt để phản công.

---

## 3. CÁC CƠ CHẾ GAMEPLAY CỐT LÕI

Toàn bộ chiều sâu chiến thuật xoay quanh giá trị của **Khúc Đuôi**:

### 3.1. Khúc Đuôi = Máu (HP) & Cân Bằng Rủi Ro – Phần Thưởng
* **Khúc Đuôi là sinh mạng:** Bắt đầu có **4 khúc đuôi** (= 4 HP bảo vệ). Khi Thầy Thuốc chạm vào phần đuôi, người chơi bị **đứt 1 khúc** và có **1.5 giây bất tử** (nhấp nháy) để chạy thoát.
* **Đánh đổi độ dài tự nhiên:**
  * Đuôi **càng dài**: tầm quất đuôi càng rộng, nhiều HP hơn, hóa Rồng càng mạnh — nhưng khó giấu đuôi hơn.
  * Đuôi **càng ngắn**: lạng lách dễ hơn — nhưng ít HP và tầm quất hẹp hơn.

### 3.2. Quất Đuôi Vật Lý (Drift Whip)
* Khi người chơi nhấn **Bứt tốc bẻ cua (Dash/Drift)** và đổi hướng gắt, lực ly tâm làm chuỗi khúc đuôi vung mạnh như một **cây roi năng lượng phát sáng**.
* Nếu chóp đuôi quật trúng Thầy Thuốc trong trạng thái này:
  * Thầy Thuốc bị đẩy lùi và **choáng 2 giây**.
  * Rơi ra nhiều **Hạt Mây Năng Lượng** và cộng điểm kỹ năng.

### 3.3. Trạng Thái Fever Mode: "LÊN MÂY"
* **Kích hoạt:** Tự động kích hoạt ngay khi thu thập đủ **100% thanh Mây Năng Lượng** (hút tự động khi chạy gần hạt Mây).
* **Thời gian duy trì:** **8 giây**.
* **Hiệu ứng:**
  * Bối cảnh đổi sang tông **Neon Cyber-Folk**, nhạc chuyển sang beat **EDM Remix**.
  * Nhân vật chính cùng toàn bộ khúc đuôi hợp thể thành **Rồng Ánh Sáng khổng lồ** (càng còn nhiều khúc đuôi, Rồng càng lớn và gây sát thương càng cao).
  * Người chơi **bất tử** và đảo ngược vai trò: **lao thẳng vào húc/cắn Thầy Thuốc** để rút thanh máu Boss.

### 3.4. Sự Kiện "Xin Khúc" (Tactical Sacrifice)
* Sau mỗi Wave, game **tạm dừng (Pause)** để Thầy Thuốc đối thoại: *"Thầy thuốc xin 1 khúc!"* và hiện 2 lựa chọn rõ ràng:
  * **Cho 1 khúc:** Cắt bỏ 1 khúc đuôi (giảm 1 HP, đuôi ngắn lại dễ né hơn) → Nhận ngay **1 Bùa Buff vĩnh viễn** (*Tốc độ chạy +20%*, *Tích thanh Mây nhanh +30%*, hoặc *Thời gian choáng Quất Đuôi +1 giây*). *(Chỉ mở lựa chọn này khi còn từ 2 khúc đuôi trở lên).*
  * **Không cho (Khịa Thầy Thuốc):** Giữ nguyên toàn bộ khúc đuôi → Thầy Thuốc nổi điên (tốc độ +15% và ra đòn dồn dập hơn), đổi lại người chơi nhận **x2 Điểm thưởng** trong Wave tiếp theo.

---

## 4. ĐIỀU KHIỂN, LUẬT CHƠI & VÒNG LẶP TRẬN ĐẤU

### 4.1. Sơ Đồ Điều Khiển (Tối Giản 2 Thao Tác)
* **Di chuột** *(hoặc `WASD` / Phím mũi tên)*: Lái nhân vật chính di chuyển và uốn lượn.
* **Click Chuột Trái / `Space`**: Bứt tốc bẻ cua (**Dash / Drift**) — dùng để né gấp và kích hoạt **Quất Đuôi Vật Lý**.

### 4.2. Vòng Lặp Trận Đấu (3 Wave Hoàn Chỉnh)
1. **Wave 1 – Khởi Động (35 giây):** Thầy Thuốc rượt đuổi tốc độ vừa phải. Người chơi làm quen điều khiển, ăn hạt Mây và tập Quất Đuôi → Hết Wave kích hoạt **Xin Khúc #1**.
2. **Wave 2 – Tăng Nhiệt (45 giây):** Thầy Thuốc nhanh hơn và ném bùa cản đường trên bản đồ → Hết Wave kích hoạt **Xin Khúc #2**.
3. **Wave 3 – Trảm Trùm (Đấu Boss):** Thầy Thuốc hóa khổng lồ với thanh HP rõ ràng. Người chơi né chiêu, Quất Đuôi để gom Mây và kích hoạt **Lên Mây** (1–2 lần) để húc cạn máu Boss.

### 4.3. Điều Kiện Thắng / Thua & Tính Điểm
* **Chiến thắng (Victory):** Rút cạn thanh máu Thầy Thuốc ở Wave 3.
* **Thất bại (Game Over):** Đứt sạch toàn bộ khúc đuôi (0 khúc) và nhân vật chính bị Thầy Thuốc chạm trúng.
* **Hệ thống Tính điểm:**
  * Ăn Hạt Mây: `+10 điểm`
  * Quất Đuôi trúng Thầy Thuốc: `+100 điểm`
  * Húc trúng Boss khi Lên Mây: `+150 điểm`
  * Từ chối "Xin Khúc": Áp dụng hệ số **x2 điểm** cho Wave kế tiếp
  * Thưởng hoàn thành màn: `+200 điểm × số khúc đuôi còn lại`

### 4.4. Luồng Màn Hình (UI Flow)
1. **Màn hình Mở đầu (Title Screen):** Tên game, nút **Chơi Ngay**, và khung **Hướng dẫn thao tác nhanh (3 dòng trực quan)**.
2. **Màn chơi (HUD):** Hiển thị rõ *Số khúc đuôi (HP)*, *Thanh Mây (0–100%)*, *Wave hiện tại / Máu Boss*, và *Điểm số*.
3. **Popup "Xin Khúc":** Tạm dừng game, chọn 1 trong 2 thẻ *Cho khúc* hoặc *Không cho*.
4. **Màn hình Kết quả (Victory / Game Over):** Thông báo kết quả, bảng tổng kết điểm (và điểm cao nhất trong phiên) + nút **Chơi Lại** ngay lập tức.

---

## 5. ĐỊNH HƯỚNG THẨM MỸ (ART & AUDIO)

### 5.1. Hình Ảnh (Visuals)
* **Phong cách:** Tranh dân gian Đông Hồ kết hợp viền phát sáng **Neon Pop-Art** trên nền sân đình tối màu để làm nổi bật nhân vật và đường đạn.
* **Phản hồi hành động (Game Feel):** Vệt sáng (trail) chạy theo chóp đuôi khi Drift, hiệu ứng chớp sáng + rung màn hình nhẹ khi Quất Đuôi trúng đích, hiệu ứng biến đổi màu nền rực rỡ khi vào trạng thái **Lên Mây**.

### 5.2. Âm Thanh (Audio – Tối Ưu Cho 150 Phút)
* **2 trạng thái nhạc nền:**
  * *Nhạc thường:* Nhịp dân gian hiện đại (tiết tấu vui, dồn dập dần).
  * *Nhạc Lên Mây (Fever Mode):* Beat EDM Remix bùng nổ.
* **Hiệu ứng âm thanh (SFX):** Tiếng vút roi khi Quất Đuôi, tiếng choáng/trống chầu khi trúng Boss, tiếng nhặt hạt Mây, tiếng đứt khúc và âm báo kích hoạt Lên Mây.

---

## 6. PHẠM VI MVP & SỬ DỤNG AI (THEO THỂ LỆ 150 PHÚT)

### 6.1. Phạm Vi Bắt Buộc (MVP) & Mở Rộng
* **Bắt buộc hoàn thành (Core MVP):** Điều khiển dây xích mượt (1 đầu + 4 khúc đuôi) → Quất Đuôi Vật Lý → Thu thập Mây & Fever Mode Lên Mây → Sự kiện Xin Khúc → 3 Wave + Boss → Đủ màn hình Hướng dẫn / Điểm số / Chơi lại.
* **Tính năng mở rộng (chỉ làm khi MVP đã chạy ổn định):** Vật phẩm nhặt nối thêm khúc đuôi bị mất; chọn skin đầu nhân vật; vòng vây khép kín "Cây Lúc Lắc".

### 6.2. Kế Hoạch Sử Dụng AI & Lưu Minh Chứng
* **Thiết kế & Cân bằng luật chơi:** Dùng AI rà soát logic thắng/thua, thông số tốc độ, thời gian choáng và điểm số.
* **Lập trình (HTML5 Canvas / Phaser / JS):** Dùng AI sinh khung vật lý dây xích, AI rượt đuổi Thầy Thuốc, hệ thống Wave và UI; đội trực tiếp kiểm thử, tinh chỉnh thông số cảm giác tay (*game feel*) và sửa lỗi va chạm.
* **Tài nguyên (Art & Audio):** Dùng AI tạo sprite nhân vật/Boss phong cách Đông Hồ Neon hoặc vẽ procedural trên Canvas, kết hợp Web Audio API / công cụ AI tạo SFX & nhạc nền; lưu lại prompt và lịch sử chỉnh sửa để trình bày trước BGK.
