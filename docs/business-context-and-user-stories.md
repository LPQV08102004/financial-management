# Bối Cảnh Nghiệp Vụ & User Story
## Hệ thống Quản lý Tài chính Cá nhân (Personal Finance Management)

> **Cảm hứng thiết kế**: YNAB (You Need A Budget) — phương pháp lập ngân sách zero-based  
> **Phiên bản tài liệu**: 1.2 — 2026-04-02 (bổ sung US-A → US-F, Epic 10 Chatbot, Epic 11 NLP)

---

## 1. Bối Cảnh Nghiệp Vụ

### 1.1. Vấn đề thực tế

Phần lớn người trẻ Việt Nam hiện nay gặp khó khăn trong việc kiểm soát chi tiêu cá nhân. Họ biết tiền "biến mất" nhưng không biết đi đâu, không có kế hoạch rõ ràng cho từng khoản chi, và chỉ nhận ra mình đã tiêu quá tay khi tài khoản gần cạn. Các ứng dụng ghi chép chi tiêu truyền thống chỉ phản ánh lại quá khứ mà không giúp người dùng **lên kế hoạch chủ động** cho tương lai.

Bên cạnh đó, việc quản lý thủ công còn tồn tại nhiều điểm đau khác:

- **Nhập liệu sai** không có cách sửa nhanh → người dùng phải xoá và nhập lại, mất lịch sử
- **Chi tiêu định kỳ** (lương, tiền thuê nhà, đăng ký dịch vụ) phải nhập tay mỗi tháng → tốn thời gian, dễ quên
- **Không có mục tiêu tiết kiệm rõ ràng** → tiền dư cuối tháng bị tiêu tuỳ hứng thay vì tích luỹ có mục đích
- **Không thể tìm lại giao dịch cụ thể** khi danh sách quá dài → mất khả năng kiểm soát chi tiết
- **Danh mục không linh hoạt** → người dùng bị kẹt với danh mục cũ không còn phù hợp
- **Bảo mật tài khoản yếu** khi không có luồng đổi mật khẩu → rủi ro nếu mật khẩu bị lộ
- **Thiếu hỗ trợ tức thời** khi người dùng không hiểu khái niệm tài chính (lãi kép, quỹ khẩn cấp, …) → phải tra cứu ngoài ứng dụng, mất tập trung
- **Nhập liệu giao dịch tốn thời gian** — phải mở form, điền từng trường, chọn danh mục → rào cản khiến nhiều người bỏ ghi chép sau vài ngày

### 1.2. Giải pháp đề xuất

Hệ thống áp dụng **phương pháp lập ngân sách zero-based** (zero-based budgeting): mỗi đồng tiền thu vào phải được **phân bổ có chủ đích** vào một danh mục cụ thể (ăn uống, đi lại, tiết kiệm, …). Số tiền chưa phân bổ nằm trong nhóm **"Cần phân bổ"** và coi như chưa được dùng — tạo áp lực tích cực để người dùng luôn có kế hoạch trước khi chi.

Ngoài lõi zero-based budgeting, hệ thống tích hợp thêm hai lớp **trí tuệ nhân tạo** nhằm giảm rào cản nhập liệu và nâng cao trải nghiệm:

- **Chatbot trợ lý tài chính (AI Chatbot)**: hỗ trợ người dùng tra cứu kiến thức tài chính tổng quát (lãi kép, quỹ khẩn cấp, …) và truy vấn dữ liệu giao dịch cá nhân bằng ngôn ngữ tự nhiên tiếng Việt — không cần biết cách lọc hay navigate màn hình.
- **Phân loại giao dịch tự động bằng NLP** *(Natural Language Processing — Xử lý ngôn ngữ tự nhiên)*: người dùng chỉ cần nhắn một câu như *"Tối qua ăn ở Haidilao hết 220k"*, hệ thống tự trích xuất số tiền, ngày, danh mục đề xuất và tạo giao dịch chờ xác nhận — loại bỏ hoàn toàn việc điền form thủ công.

**Nguyên tắc cốt lõi:**

| Nguyên tắc | Diễn giải |
|---|---|
| Phân bổ từng đồng | Thu nhập → phân bổ toàn bộ vào các danh mục; không để tiền "nổi" |
| Chấp nhận bất ngờ | Khi phát sinh chi tiêu ngoài kế hoạch, di chuyển ngân sách từ danh mục khác |
| Nhìn xa hơn tháng này | Để dành trước cho các khoản chi lớn theo chu kỳ (bảo hiểm, học phí, …) |
| Nhìn lại để cải thiện | Dùng báo cáo/biểu đồ để hiểu thói quen và điều chỉnh kế hoạch |

### 1.3. Chu kỳ nghiệp vụ

Ngân sách được tổ chức **theo tháng** (`YYYY-MM`). Mỗi tháng người dùng:

1. Nhận thu nhập → tổng tiền vào nhóm **"Cần phân bổ"**
2. Phân bổ số tiền này vào từng danh mục chi tiêu
3. Ghi nhận giao dịch thực tế trong tháng → hệ thống tự trừ vào danh mục tương ứng
4. Theo dõi số dư còn lại của từng danh mục; nhận cảnh báo khi sắp vượt ngưỡng
5. Cuối tháng xem báo cáo, rút kinh nghiệm, lập kế hoạch tháng sau

### 1.4. Phạm vi hệ thống

```
Trong phạm vi (In-scope)                         Ngoài phạm vi (Out-of-scope)
──────────────────────────────────────────────   ─────────────────────────────────────
✔ Đăng ký / đăng nhập / đổi mật khẩu (JWT)      ✘ Kết nối ngân hàng tự động (Open Banking)
✔ Quản lý tài khoản (tiền mặt, ngân hàng)        ✘ Đầu tư / chứng khoán
✔ Ghi, sửa, xoá giao dịch (thu/chi/chuyển)       ✘ Hoá đơn điện tử
✔ Giao dịch định kỳ (recurring)                  ✘ Chia sẻ ngân sách nhóm / gia đình
✔ Tìm kiếm & lọc giao dịch nâng cao              ✘ Báo cáo thuế
✔ Quản lý danh mục (tạo, sửa, xoá)               ✘ Đa tiền tệ
✔ Lập ngân sách theo danh mục & tháng            
✔ Mục tiêu tiết kiệm (Savings Goals)             
✔ Ảnh chứng từ đính kèm giao dịch               
✔ Biểu đồ phân tích xu hướng                    
✔ Cảnh báo vượt ngân sách                       
✔ Đối soát (reconcile) tài khoản                
✔ Chatbot trợ lý tài chính (kiến thức + truy vấn dữ liệu cá nhân)
✔ NLP tự động phân loại & tạo giao dịch từ câu tự nhiên
```

---

## 2. Các Nhóm Người Dùng (Actor)

| Actor | Mô tả |
|---|---|
| **Người dùng đã xác thực** | Cá nhân đã đăng ký tài khoản; có toàn quyền quản lý dữ liệu tài chính của bản thân |
| **Hệ thống** | Tự động tính toán số dư, phát sinh cảnh báo, tổng hợp báo cáo |

---

## 3. User Story

### Epic 1 — Xác thực & Tài khoản người dùng

---

**US-01** · Đăng ký tài khoản

> *Với tư cách là người dùng mới, tôi muốn tạo tài khoản bằng email và mật khẩu để bắt đầu quản lý tài chính cá nhân.*

**Tiêu chí chấp nhận (Acceptance Criteria):**
- Hệ thống yêu cầu: họ tên, email hợp lệ, mật khẩu (≥ 8 ký tự), số điện thoại (tuỳ chọn)
- Email không được trùng với tài khoản đã tồn tại
- Sau khi đăng ký thành công, hệ thống tự tạo tài khoản tiền mặt mặc định **"Tiền mặt"** cho người dùng
- Người dùng được cấp JWT access token và refresh token; không cần đăng nhập lại
- Mật khẩu được lưu dưới dạng hash (bcrypt); không bao giờ lưu plaintext

---

**US-02** · Đăng nhập

> *Với tư cách là người dùng đã có tài khoản, tôi muốn đăng nhập bằng email và mật khẩu để truy cập dữ liệu tài chính của mình.*

**Tiêu chí chấp nhận:**
- Đăng nhập thành công → nhận access token (ngắn hạn) + refresh token (dài hạn)
- Sai email hoặc mật khẩu → hiển thị thông báo lỗi rõ ràng, không tiết lộ trường nào sai
- Phiên đăng nhập được phục hồi tự động khi mở lại ứng dụng (token lưu trong AsyncStorage)

---

**US-03** · Làm mới phiên đăng nhập

> *Với tư cách là người dùng, tôi muốn không phải đăng nhập lại thường xuyên trong khi vẫn đảm bảo an toàn.*

**Tiêu chí chấp nhận:**
- Khi access token hết hạn, hệ thống tự dùng refresh token để cấp access token mới
- Nếu refresh token hết hạn hoặc bị thu hồi → chuyển về màn hình đăng nhập

---

**US-04** · Đăng xuất

> *Với tư cách là người dùng, tôi muốn đăng xuất để bảo vệ dữ liệu khi không dùng thiết bị.*

**Tiêu chí chấp nhận:**
- Đăng xuất → refresh token bị thu hồi trong CSDL, token xoá khỏi thiết bị
- Sau khi đăng xuất, các API call đều bị từ chối (401)

---

**US-05** · Xem & chỉnh sửa hồ sơ cá nhân

> *Với tư cách là người dùng, tôi muốn xem và cập nhật họ tên, số điện thoại của mình.*

**Tiêu chí chấp nhận:**
- Màn hình hồ sơ hiển thị: họ tên, email (chỉ đọc), số điện thoại
- Có thể chỉnh sửa họ tên và số điện thoại; lưu thay đổi qua API
- Email không được phép thay đổi (dùng làm định danh)

---

**US-E** · Đổi mật khẩu

> *Với tư cách là người dùng, tôi muốn đổi mật khẩu tài khoản để bảo vệ dữ liệu tài chính khi nghi ngờ mật khẩu bị lộ.*

**Bối cảnh nghiệp vụ:**  
Dữ liệu tài chính cá nhân là thông tin nhạy cảm. Nếu mật khẩu bị lộ (do dùng chung với dịch vụ khác, hoặc thiết bị bị đánh cắp), người dùng phải có khả năng thay thế ngay mà không cần liên hệ hỗ trợ. Không có luồng đổi mật khẩu là lỗ hổng bảo mật cơ bản.

**Tiêu chí chấp nhận:**
- Người dùng nhập: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới
- Mật khẩu hiện tại phải đúng trước khi cho phép thay đổi (chống tấn công khi bỏ quên mở khoá thiết bị)
- Mật khẩu mới phải ≥ 8 ký tự và khác mật khẩu cũ
- Sau khi đổi thành công: tất cả refresh token hiện có bị thu hồi → các phiên đăng nhập khác bị đăng xuất
- Không lưu mật khẩu dạng plaintext ở bất kỳ log nào

---

### Epic 2 — Quản lý Tài khoản (Accounts)

---

**US-06** · Xem danh sách tài khoản

> *Với tư cách là người dùng, tôi muốn xem tất cả tài khoản của mình (tiền mặt, ngân hàng, …) cùng số dư hiện tại để nắm tổng quan tài sản.*

**Tiêu chí chấp nhận:**
- Hiển thị danh sách tài khoản đang hoạt động (`is_active = true`)
- Mỗi tài khoản hiển thị: tên, loại (tiền mặt / ngân hàng / thẻ tín dụng), số dư hiện tại
- Tổng số dư tất cả tài khoản hiển thị trên màn hình chính

---

**US-07** · Tạo tài khoản mới

> *Với tư cách là người dùng, tôi muốn thêm tài khoản mới (ví dụ: tài khoản ngân hàng Techcombank) để theo dõi số dư riêng biệt.*

**Tiêu chí chấp nhận:**
- Nhập: tên tài khoản, loại tài khoản, số dư ban đầu, đơn vị tiền tệ (mặc định VND)
- Số dư ban đầu ≥ 0
- Tài khoản mới xuất hiện ngay trong danh sách

---

**US-08** · Chỉnh sửa tài khoản

> *Với tư cách là người dùng, tôi muốn cập nhật tên hoặc số dư tài khoản khi có sai sót.*

**Tiêu chí chấp nhận:**
- Có thể cập nhật tên và số dư hiện tại
- Không thể xoá tài khoản đang có giao dịch (soft-delete: đánh dấu `is_active = false`)

---

### Epic 3 — Quản lý Danh mục (Categories)

---

**US-09** · Xem danh mục chi tiêu & thu nhập

> *Với tư cách là người dùng, tôi muốn xem các danh mục đã có để chọn khi ghi giao dịch.*

**Tiêu chí chấp nhận:**
- Danh mục được phân loại rõ ràng: `expense` (chi tiêu) và `income` (thu nhập)
- Hiển thị tên danh mục, biểu tượng (nếu có), loại

---

**US-10** · Tạo danh mục tuỳ chỉnh

> *Với tư cách là người dùng, tôi muốn tạo danh mục riêng phù hợp với nhu cầu của mình (ví dụ: "Nuôi thú cưng").*

**Tiêu chí chấp nhận:**
- Nhập: tên danh mục, loại (chi tiêu / thu nhập), biểu tượng (tuỳ chọn)
- Danh mục mới được dùng ngay khi ghi giao dịch

---

**US-D** · Sửa & xoá danh mục

> *Với tư cách là người dùng, tôi muốn đổi tên hoặc xoá các danh mục không còn phù hợp để danh sách luôn gọn gàng và chính xác.*

**Bối cảnh nghiệp vụ:**  
Nhu cầu chi tiêu của người dùng thay đổi theo thời gian — danh mục "Học phí" có thể không còn cần thiết sau khi tốt nghiệp, hoặc "Ăn uống" muốn tách thành "Ăn ngoài" và "Nấu ăn tại nhà". Nếu không cho phép sửa/xoá, danh mục ngày càng nhiều rác, làm giảm chất lượng phân loại giao dịch.

**Tiêu chí chấp nhận:**

*Sửa danh mục:*
- Có thể cập nhật tên và biểu tượng của danh mục
- Không thể thay đổi loại (`expense` ↔ `income`) nếu danh mục đã có giao dịch — để tránh làm sai lệch lịch sử
- Tên mới áp dụng ngay cho toàn bộ lịch sử giao dịch (do lưu theo `category_id`, không lưu theo tên)

*Xoá danh mục:*
- Danh mục **chưa có giao dịch nào** → xoá cứng (hard delete)
- Danh mục **đã có giao dịch** → soft-delete (`is_active = false`); không hiện khi chọn danh mục mới nhưng vẫn hiển thị trong lịch sử cũ
- Trước khi xoá: hiển thị cảnh báo nếu danh mục đang được dùng trong kế hoạch ngân sách tháng hiện tại

---

### Epic 4 — Ghi Giao dịch (Transactions)

---

**US-11** · Ghi giao dịch chi tiêu

> *Với tư cách là người dùng, tôi muốn ghi lại một khoản chi tiêu để hệ thống trừ vào ngân sách và số dư tài khoản tương ứng.*

**Tiêu chí chấp nhận:**
- Nhập bắt buộc: số tiền (> 0), danh mục chi tiêu, tài khoản thanh toán
- Nhập tuỳ chọn: ghi chú, ngày giao dịch (mặc định hôm nay), ảnh chứng từ
- Hệ thống tự động: trừ số dư tài khoản, tăng `activity` của danh mục trong tháng tương ứng
- Tất cả cập nhật số dư là atomic (trong một transaction DB duy nhất)
- Sử dụng `Decimal` cho mọi phép tính tiền — không dùng `float`

---

**US-12** · Ghi giao dịch thu nhập

> *Với tư cách là người dùng, tôi muốn ghi nhận một khoản thu nhập để tăng số dư tài khoản và nhóm "Cần phân bổ".*

**Tiêu chí chấp nhận:**
- Nhập bắt buộc: số tiền (> 0), tài khoản nhận tiền
- Danh mục không bắt buộc đối với thu nhập
- Hệ thống tăng `current_balance` của tài khoản
- Số tiền thu nhập làm tăng pool **"Cần phân bổ"** trong tháng

---

**US-13** · Ghi giao dịch chuyển khoản

> *Với tư cách là người dùng, tôi muốn ghi nhận việc chuyển tiền giữa hai tài khoản của mình mà không ảnh hưởng đến ngân sách.*

**Tiêu chí chấp nhận:**
- Chọn tài khoản nguồn và tài khoản đích (phải khác nhau)
- Trừ tài khoản nguồn, cộng tài khoản đích; không tạo `BudgetEntry`
- Tổng tài sản không thay đổi

---

**US-14** · Giao dịch chi tiêu nhiều danh mục (Split)

> *Với tư cách là người dùng, tôi muốn chia một hoá đơn thành nhiều danh mục (ví dụ: mua hàng siêu thị gồm thực phẩm + đồ dùng gia đình).*

**Tiêu chí chấp nhận:**
- Tổng các phần chia bằng đúng số tiền giao dịch
- Mỗi phần chia ghi vào một danh mục khác nhau
- Số dư tài khoản trừ một lần; ngân sách cập nhật theo từng danh mục

---

**US-15** · Xem lịch sử giao dịch

> *Với tư cách là người dùng, tôi muốn xem danh sách giao dịch đã ghi, có thể lọc theo loại và khoảng thời gian.*

**Tiêu chí chấp nhận:**
- Lọc theo: loại giao dịch (thu / chi / chuyển khoản), khoảng ngày
- Mỗi dòng hiển thị: ngày, danh mục, ghi chú, số tiền, trạng thái đối soát
- Pull-to-refresh để tải lại dữ liệu mới nhất

---

**US-A** · Sửa giao dịch

> *Với tư cách là người dùng, tôi muốn chỉnh sửa một giao dịch đã ghi (số tiền, danh mục, ghi chú, ngày) khi phát hiện sai sót.*

**Bối cảnh nghiệp vụ:**  
Nhập sai là tình huống không thể tránh khỏi — đặc biệt khi nhập nhanh trên điện thoại. Nếu chỉ có xoá-và-nhập-lại, người dùng mất ngữ cảnh (ảnh chứng từ đã đính kèm, thứ tự lịch sử). Sửa tại chỗ giúp giữ toàn vẹn lịch sử trong khi vẫn cho phép hiệu chỉnh.

**Tiêu chí chấp nhận:**
- Có thể sửa: số tiền, danh mục, ghi chú, ngày giao dịch, tài khoản
- Giao dịch `reconciled` **không được phép sửa** (bất biến sau đối soát)
- Khi sửa số tiền hoặc danh mục: hệ thống hoàn trả tác động cũ rồi áp dụng tác động mới (atomic)  
  - Ví dụ: sửa chi tiêu từ 100k → 150k ở danh mục "Ăn uống": `activity` tháng tăng thêm 50k, số dư tài khoản trừ thêm 50k
- Khi sửa ngày sang **tháng khác**: `activity` của tháng cũ được hoàn trả, tháng mới được tăng tương ứng
- Hiển thị lịch sử chỉnh sửa (ngày sửa, ai sửa) nếu hệ thống có audit log

---

**US-16** · Xoá giao dịch

> *Với tư cách là người dùng, tôi muốn xoá một giao dịch đã ghi sai để hệ thống hoàn trả số dư về trạng thái trước.*

**Tiêu chí chấp nhận:**
- Xoá giao dịch → hoàn trả số dư tài khoản và `activity` ngân sách
- Giao dịch đã ở trạng thái `reconciled` **không được phép xoá**
- Hiển thị hộp thoại xác nhận trước khi xoá

---

**US-F** · Tìm kiếm & lọc giao dịch nâng cao

> *Với tư cách là người dùng, tôi muốn tìm lại một giao dịch cụ thể bằng từ khoá hoặc lọc theo danh mục, tài khoản để không phải cuộn qua hàng trăm dòng.*

**Bối cảnh nghiệp vụ:**  
Sau 3–6 tháng sử dụng, danh sách giao dịch có thể lên đến vài trăm đến vài nghìn bản ghi. Lọc chỉ theo loại giao dịch và khoảng ngày (US-15) không đủ — người dùng cần tìm "tất cả lần tôi chi cho Netflix" hoặc "các giao dịch từ tài khoản Techcombank trong tháng 3".

**Tiêu chí chấp nhận:**
- **Tìm theo từ khoá**: tìm trong trường `note` (ghi chú) — không phân biệt hoa thường, có dấu/không dấu
- **Lọc theo danh mục**: chọn một hoặc nhiều danh mục cụ thể
- **Lọc theo tài khoản**: chọn một tài khoản để xem giao dịch tương ứng
- **Lọc theo loại**: thu / chi / chuyển khoản (giữ nguyên từ US-15)
- **Lọc theo khoảng ngày**: từ ngày — đến ngày (giữ nguyên từ US-15)
- Các bộ lọc có thể kết hợp đồng thời (AND logic)
- Kết quả hiển thị số lượng giao dịch tìm được và tổng số tiền tương ứng
- Bộ lọc được giữ nguyên khi quay lại màn hình (không reset sau mỗi lần navigate)


---

### Epic 5 — Lập Ngân Sách (Budgets)

---

**US-18** · Xem ngân sách tháng hiện tại

> *Với tư cách là người dùng, tôi muốn xem tháng này mình đã lên kế hoạch bao nhiêu cho từng danh mục và đã thực chi bao nhiêu.*

**Tiêu chí chấp nhận:**
- Hiển thị theo tháng (`YYYY-MM`); có thể chuyển tháng trước / sau
- Mỗi danh mục hiển thị: **Đã lên kế hoạch** (`budgeted`) / **Đã chi** (`activity`) / **Còn lại** (`available`)
- `available = budgeted - activity`
- Danh mục bội chi hiển thị `available` âm, tô màu đỏ cảnh báo
- Nhóm **"Cần phân bổ"** hiển thị rõ tổng tiền chưa được gán vào danh mục nào

---

**US-19** · Phân bổ ngân sách cho danh mục

> *Với tư cách là người dùng, tôi muốn nhập số tiền kế hoạch cho từng danh mục trong tháng để kiểm soát chi tiêu.*

**Tiêu chí chấp nhận:**
- Nhập số tiền `budgeted` cho một danh mục trong tháng cụ thể
- Số tiền phân bổ trừ vào nhóm **"Cần phân bổ"**
- Không có rollover tự động giữa các tháng — mỗi tháng là độc lập

---

**US-20** · Điều chỉnh ngân sách giữa các danh mục

> *Với tư cách là người dùng, khi tôi chi vượt một danh mục, tôi muốn di chuyển ngân sách từ danh mục khác sang để cân bằng.*

**Tiêu chí chấp nhận:**
- Tăng `budgeted` của danh mục này → giảm tương ứng ở danh mục kia (hoặc lấy từ "Cần phân bổ")
- Nhóm **"Cần phân bổ"** không được âm sau khi điều chỉnh

---

**US-21** · Nhận cảnh báo khi gần vượt ngân sách

> *Với tư cách là người dùng, tôi muốn được thông báo khi chi tiêu của một danh mục vượt ngưỡng tôi đã cài đặt (ví dụ: 80% ngân sách).*

**Tiêu chí chấp nhận:**
- `BudgetAlert` tự động tạo khi `activity / budgeted ≥ threshold%`
- Cảnh báo hiển thị trong màn hình Thông báo của ứng dụng
- Mỗi cặp (danh mục, tháng) chỉ tạo một cảnh báo (tránh spam)
- Người dùng có thể tuỳ chỉnh ngưỡng phần trăm

---

**US-22** · Xem & quản lý thông báo cảnh báo

> *Với tư cách là người dùng, tôi muốn xem danh sách các cảnh báo ngân sách và có thể chỉnh sửa hoặc xoá chúng.*

**Tiêu chí chấp nhận:**
- Danh sách hiển thị: danh mục, tháng, ngưỡng cảnh báo, trạng thái
- Có thể thêm, sửa ngưỡng, xoá cảnh báo
- Cảnh báo đã kích hoạt đánh dấu khác biệt với cảnh báo chưa kích hoạt

---

### Epic 6 — Phân Tích & Báo Cáo (Analytics)

---

**US-23** · Xem biểu đồ chi tiêu theo danh mục

> *Với tư cách là người dùng, tôi muốn thấy tỷ lệ chi tiêu của từng danh mục qua biểu đồ tròn (pie chart) để hiểu mình đang chi tiền vào đâu nhiều nhất.*

**Tiêu chí chấp nhận:**
- Biểu đồ tính từ dữ liệu giao dịch thực tế trong khoảng thời gian chọn
- Hiển thị tên danh mục và phần trăm tương ứng
- Có thể lọc theo: tháng, quý, năm, hoặc khoảng ngày tuỳ chọn

---

**US-24** · Xem xu hướng thu chi theo tháng

> *Với tư cách là người dùng, tôi muốn thấy biểu đồ thanh (bar chart) so sánh thu nhập và chi tiêu theo từng tháng trong năm để nhận diện xu hướng.*

**Tiêu chí chấp nhận:**
- Hiển thị 12 tháng của năm hiện tại (hoặc năm chọn)
- Mỗi tháng có hai cột: tổng thu nhập và tổng chi tiêu
- Tính từ dữ liệu giao dịch thực; không dùng dữ liệu hardcode

---

**US-25** · Xem dashboard tổng quan

> *Với tư cách là người dùng, tôi muốn thấy ngay tổng số dư, chi tiêu hôm nay / tháng này khi mở ứng dụng.*

**Tiêu chí chấp nhận:**
- Hiển thị: tổng số dư tất cả tài khoản, tổng chi tiêu ngày/tháng, tổng thu nhập tháng
- Danh sách giao dịch gần nhất (5–10 giao dịch)
- Dữ liệu cập nhật mỗi khi màn hình được focus

---

### Epic 7 — Ảnh Chứng Từ (Receipts)

---

**US-26** · Đính kèm ảnh chứng từ khi ghi giao dịch

> *Với tư cách là người dùng, tôi muốn chụp ảnh hoá đơn và đính kèm vào giao dịch để lưu bằng chứng chi tiêu.*

**Tiêu chí chấp nhận:**
- Có thể chụp ảnh trực tiếp hoặc chọn từ thư viện ảnh
- Ảnh lưu cùng giao dịch; có thể xem lại bất cứ lúc nào
- Một giao dịch hỗ trợ đính kèm tối thiểu 1 ảnh

---

### Epic 8 — Giao Dịch Định Kỳ (Recurring Transactions)

---

**US-B** · Tạo giao dịch định kỳ

> *Với tư cách là người dùng, tôi muốn thiết lập các giao dịch lặp lại hàng tháng (lương, tiền thuê, đăng ký dịch vụ) để không phải nhập tay mỗi kỳ.*

**Bối cảnh nghiệp vụ:**  
Phần lớn giao dịch tài chính thực tế là có chu kỳ cố định: lương vào ngày 1, tiền nhà ngày 5, Spotify ngày 15, … Nếu người dùng phải nhập thủ công mỗi tháng, họ dễ quên — dẫn đến số dư và ngân sách sai lệch. Giao dịch định kỳ giải quyết vấn đề này bằng cách tự động hoặc nhắc nhở đúng lúc.

Đây cũng là tính năng mang tính **"nhìn xa hơn tháng này"** — một trong bốn nguyên tắc cốt lõi của zero-based budgeting.

**Tiêu chí chấp nhận:**

*Tạo template định kỳ:*
- Nhập: tên, loại giao dịch (thu/chi), số tiền, danh mục, tài khoản, chu kỳ, ngày bắt đầu
- Chu kỳ hỗ trợ: **hàng ngày**, **hàng tuần**, **hàng tháng** (ngày X mỗi tháng), **hàng năm**
- Ngày kết thúc tuỳ chọn (để thiết lập trả góp có thời hạn)

*Tự động tạo giao dịch:*
- Hệ thống tự tạo giao dịch thực tế vào đúng ngày chu kỳ
- Giao dịch được tạo ở trạng thái `uncleared` — người dùng vẫn cần xác nhận (cleared) sau khi kiểm tra thực tế
- Nếu ngày rơi vào cuối tháng ngắn (ví dụ: ngày 31 trong tháng 2): tự động dùng ngày cuối tháng

*Quản lý template:*
- Xem danh sách tất cả giao dịch định kỳ đang hoạt động
- Sửa template (áp dụng từ kỳ tiếp theo, không sửa ngược lịch sử)
- Dừng / huỷ template định kỳ
- Xem các giao dịch đã được tạo bởi một template cụ thể

---

**US-B2** · Xem lịch giao dịch sắp tới

> *Với tư cách là người dùng, tôi muốn xem các giao dịch định kỳ sẽ xảy ra trong 30 ngày tới để chuẩn bị tiền trước.*

**Tiêu chí chấp nhận:**
- Danh sách "Sắp tới" hiển thị các giao dịch định kỳ dự kiến trong 30 ngày tới
- Mỗi dòng hiển thị: ngày dự kiến, tên, số tiền, danh mục, tài khoản
- Tổng số tiền chi ra dự kiến trong 30 ngày

---

### Epic 9 — Mục Tiêu Tiết Kiệm (Savings Goals)

---

**US-C** · Tạo mục tiêu tiết kiệm

> *Với tư cách là người dùng, tôi muốn đặt ra một mục tiêu tiết kiệm (ví dụ: "Mua MacBook — 30 triệu") và để dành một phần ngân sách mỗi tháng cho mục tiêu đó.*

**Bối cảnh nghiệp vụ:**  
Một trong những điểm yếu lớn nhất của quản lý tài chính truyền thống là không có "chỗ" cụ thể cho tiền tiết kiệm — tiền dư cuối tháng bị coi là "tiền tự do" và thường bị tiêu hết. YNAB giải quyết bằng khái niệm **sinking fund**: tạo một "phong bì" (envelope/danh mục đặc biệt) cho mục tiêu, phân bổ đều mỗi tháng cho đến khi đủ. Điều này biến mục tiêu từ "ước mơ" thành "kế hoạch có ngày cụ thể".

**Tiêu chí chấp nhận:**

*Tạo mục tiêu:*
- Nhập: tên mục tiêu, số tiền cần đạt, ngày mục tiêu (deadline), ghi chú
- Hệ thống tự tính: **số tiền cần để dành mỗi tháng** = `(target - saved) / số tháng còn lại`
- Mỗi mục tiêu tương ứng với một danh mục đặc biệt loại `goal` trong hệ thống

*Theo dõi tiến độ:*
- Hiển thị thanh tiến độ: số tiền đã tích luỹ / tổng mục tiêu (%)
- Hiển thị: số tiền còn thiếu, số tháng còn lại, số tiền cần để dành mỗi tháng
- Cảnh báo nếu tháng này chưa phân bổ đủ số tiền cần thiết cho mục tiêu

*Hoàn thành & sử dụng:*
- Khi đủ tiền: đánh dấu mục tiêu **"Hoàn thành"**
- Người dùng ghi giao dịch chi tiêu từ danh mục mục tiêu → số dư mục tiêu giảm
- Mục tiêu hoàn thành lưu lại trong lịch sử (không xoá) để thống kê

*Điều chỉnh mục tiêu:*
- Có thể sửa: tên, số tiền mục tiêu, deadline
- Hệ thống tự tính lại số tiền cần để dành mỗi tháng sau khi điều chỉnh

---

**US-C2** · Xem tổng quan tất cả mục tiêu tiết kiệm

> *Với tư cách là người dùng, tôi muốn thấy tất cả mục tiêu của mình trên một màn hình để ưu tiên phân bổ ngân sách.*

**Tiêu chí chấp nhận:**
- Danh sách mục tiêu chia thành: **Đang thực hiện** / **Hoàn thành** / **Quá hạn**
- Mỗi mục tiêu hiển thị: tên, tiến độ (%), ngày deadline, số tiền thiếu
- Sắp xếp theo: ngày deadline gần nhất (mặc định), hoặc % tiến độ
- Tổng số tiền đang được "khoá" trong tất cả mục tiêu

---

### Epic 10 — Chatbot Trợ Lý Tài Chính (AI Financial Assistant)

---

**Bối cảnh nghiệp vụ chung cho Epic 10:**

Người dùng cá nhân — đặc biệt là người trẻ lần đầu quản lý tài chính — thường có hai nhu cầu song song: (1) **học** các khái niệm tài chính cơ bản (lãi suất kép, quỹ khẩn cấp, quy tắc 50/30/20, …) và (2) **tra cứu nhanh** dữ liệu tài chính của chính mình mà không cần mở nhiều màn hình. Chatbot nhúng trực tiếp trong ứng dụng giải quyết cả hai nhu cầu này trong một giao diện hội thoại quen thuộc — thay vì phải Google kiến thức bên ngoài hoặc tự filter báo cáo thủ công.

Chatbot **không thực hiện hành động ghi/sửa/xoá dữ liệu tài chính** — chỉ đọc và trả lời. Mọi thay đổi dữ liệu vẫn phải do người dùng xác nhận qua UI chính.

---

**US-27** · Hỏi kiến thức tài chính tổng quát

> *Với tư cách là người dùng, tôi muốn hỏi chatbot các câu hỏi về kiến thức tài chính cá nhân (lãi kép, lạm phát, quỹ khẩn cấp, …) và nhận câu trả lời bằng tiếng Việt dễ hiểu, ngay trong ứng dụng.*

**Tiêu chí chấp nhận:**
- Chatbot trả lời các câu hỏi kiến thức tài chính tổng quát bằng **tiếng Việt**, ngôn ngữ gần gũi, tránh thuật ngữ phức tạp không cần thiết
- Ví dụ câu hỏi được hỗ trợ:
  - *"Lãi kép là gì và tại sao nó quan trọng?"*
  - *"Quỹ khẩn cấp nên để bao nhiêu tháng chi tiêu?"*
  - *"Quy tắc 50/30/20 hoạt động như thế nào?"*
  - *"Tôi nên ưu tiên trả nợ hay tiết kiệm trước?"*
- Câu trả lời ngắn gọn (không quá 300 từ), có thể kèm ví dụ số liệu thực tế
- Khi câu hỏi vượt phạm vi tài chính cá nhân: chatbot từ chối lịch sự và gợi ý câu hỏi phù hợp hơn
- Lịch sử hội thoại được giữ trong phiên hiện tại (context-aware: câu sau hiểu ngữ cảnh câu trước)

---

**US-28** · Truy vấn dữ liệu giao dịch cá nhân qua hội thoại

> *Với tư cách là người dùng, tôi muốn hỏi chatbot về tình hình tài chính của chính mình bằng câu hỏi tự nhiên, thay vì phải tự filter báo cáo.*

**Tiêu chí chấp nhận:**

*Truy vấn chi tiêu:*
- *"Tháng này tôi chi bao nhiêu tiền ăn uống?"* → chatbot truy vấn `GET /transactions` theo `type=expense`, `category=Ăn uống`, `month=hiện tại` và trả lời con số cụ thể
- *"Tuần này tôi đã tiêu những gì?"* → liệt kê danh sách giao dịch 7 ngày gần nhất
- *"Tôi chi nhiều nhất vào danh mục nào trong 3 tháng qua?"* → tổng hợp và xếp hạng theo danh mục

*Truy vấn ngân sách:*
- *"Ngân sách ăn uống tháng này còn bao nhiêu?"* → trả về `available` của danh mục tương ứng
- *"Tôi đang bội chi danh mục nào?"* → liệt kê các danh mục có `available < 0`

*Truy vấn số dư:*
- *"Tổng số dư hiện tại của tôi là bao nhiêu?"* → tổng `current_balance` tất cả tài khoản
- *"Tài khoản Techcombank của tôi còn bao nhiêu?"* → số dư tài khoản cụ thể

*Yêu cầu kỹ thuật:*
- Chatbot chỉ truy cập dữ liệu của `user_id` đang đăng nhập — tuyệt đối không lẫn dữ liệu người dùng khác
- Khi câu hỏi mơ hồ (ví dụ: *"chi tiêu của tôi"* không rõ khoảng thời gian): chatbot hỏi lại để làm rõ
- Câu trả lời kèm số liệu cụ thể, đơn vị VND, định dạng dễ đọc (ví dụ: *"1.250.000 đ"* thay vì *"1250000"*)
- Không trả về raw JSON — luôn diễn giải thành câu văn tự nhiên

---

**US-29** · Chatbot gợi ý hành động tài chính

> *Với tư cách là người dùng, tôi muốn chatbot chủ động đưa ra gợi ý cụ thể dựa trên tình trạng tài chính thực tế của tôi.*

**Tiêu chí chấp nhận:**
- Sau khi trả lời truy vấn, chatbot có thể chủ động gợi ý liên quan:
  - Nếu danh mục bội chi → *"Ăn uống của bạn đã vượt 150k so với kế hoạch. Bạn có muốn điều chỉnh ngân sách không?"*
  - Nếu "Cần phân bổ" > 0 → *"Bạn còn 500k chưa phân bổ tháng này. Hãy gán vào danh mục để kiểm soát tốt hơn."*
  - Nếu mục tiêu tiết kiệm sắp hết hạn → *"Mục tiêu 'Mua MacBook' còn thiếu 2 triệu và sẽ đến hạn sau 30 ngày."*
- Gợi ý mang tính **quan sát và nhắc nhở**, không ép buộc — người dùng có thể bỏ qua
- Không spam gợi ý lặp lại trong cùng một phiên hội thoại

---

### Epic 11 — NLP Tự Động Phân Loại & Tạo Giao Dịch

---

**Bối cảnh nghiệp vụ chung cho Epic 11:**

Rào cản lớn nhất khiến người dùng bỏ ghi chép chi tiêu là **ma sát của form nhập liệu**: mở ứng dụng → bấm "Thêm giao dịch" → điền số tiền → chọn danh mục → chọn tài khoản → chọn ngày → lưu. Chuỗi thao tác này đủ để người dùng trì hoãn, rồi quên mất.

NLP *(Natural Language Processing — Xử lý ngôn ngữ tự nhiên)* cho phép người dùng mô tả giao dịch bằng một câu nói tự nhiên như khi nhắn tin. Hệ thống dùng mô hình ngôn ngữ lớn (LLM) để **trích xuất có cấu trúc** (structured extraction) các trường cần thiết, đề xuất danh mục phù hợp nhất từ danh mục người dùng đã có, rồi trình bày kết quả để người dùng xác nhận — thay vì điền form tay.

**Đây là tính năng khác biệt quan trọng** so với các ứng dụng quản lý chi tiêu thông thường và là điểm nhấn kỹ thuật của dự án.

---

**US-30** · Nhập giao dịch bằng câu ngôn ngữ tự nhiên

> *Với tư cách là người dùng, tôi muốn mô tả một giao dịch bằng một câu tự nhiên (ví dụ: "Tối qua ăn ở Haidilao hết 220k") và để hệ thống tự điền form thay cho tôi.*

**Tiêu chí chấp nhận:**

*Trích xuất thông tin (NLP Parsing):*
- Hệ thống nhận câu đầu vào và trích xuất các trường:

| Trường | Ví dụ đầu vào | Kết quả trích xuất |
|---|---|---|
| `amount` | *"hết 220k"*, *"tiêu 1 triệu rưỡi"* | `220000`, `1500000` |
| `date` | *"tối qua"*, *"sáng nay"*, *"3/4"* | ngày tuyệt đối tương ứng |
| `note` | *"ăn ở Haidilao"*, *"đổ xăng Shell"* | `"Haidilao"`, `"Shell"` |
| `category` | suy luận từ ngữ cảnh câu | gợi ý danh mục từ danh sách của người dùng |
| `type` | *"ăn"*, *"mua"*, *"nhận lương"* | `expense` hoặc `income` |

- Hỗ trợ các cách diễn đạt số tiền phổ biến trong tiếng Việt: *"220k"*, *"220 nghìn"*, *"2 trăm rưỡi"*, *"1 triệu 2"*, *"1.500.000đ"*
- Hỗ trợ ngày tương đối: *"hôm nay"*, *"hôm qua"*, *"tối qua"*, *"sáng nay"*, *"3 ngày trước"*, *"thứ 6 tuần rồi"*
- Khi không trích xuất được một trường (ví dụ: không xác định được số tiền): đánh dấu trường đó là trống và yêu cầu người dùng bổ sung

*Gợi ý danh mục thông minh:*
- Mô hình gợi ý danh mục dựa trên: từ khoá trong câu (tên nhà hàng, loại hoạt động) + lịch sử phân loại của chính người dùng (học theo thói quen)
- Hiển thị **top 3 danh mục** có độ phù hợp cao nhất kèm % tin cậy (confidence score)
- Ví dụ: *"Haidilao"* → gợi ý [Ăn uống 94%, Giải trí 4%, Khác 2%]
- Nếu confidence < 60%: hệ thống để trống trường danh mục và yêu cầu chọn thủ công

*Luồng xác nhận (Human-in-the-loop):*
- Sau khi phân tích xong, hiển thị **thẻ xác nhận** với tất cả trường đã trích xuất — người dùng có thể chỉnh sửa bất kỳ trường nào trước khi lưu
- Người dùng bấm **"Xác nhận"** → gọi `POST /transactions/expense` (hoặc `income`) với dữ liệu cuối cùng
- Không tự động lưu mà không có bước xác nhận của người dùng
- Người dùng có thể **"Huỷ"** → không tạo giao dịch, không lưu bất cứ gì

*Học và cải thiện:*
- Khi người dùng xác nhận giao dịch với danh mục được chọn (kể cả khi đã sửa gợi ý): hệ thống lưu cặp `(từ khoá → danh mục)` vào bảng `nlp_category_mappings` của người dùng đó
- Lần sau gặp cùng từ khoá → ưu tiên danh mục người dùng đã chọn trước

---

**US-31** · Xem lại và chỉnh sửa kết quả phân loại NLP

> *Với tư cách là người dùng, tôi muốn xem rõ những gì hệ thống đã hiểu từ câu của tôi và chỉnh sửa bất kỳ trường nào trước khi giao dịch được lưu.*

**Tiêu chí chấp nhận:**
- Màn hình xác nhận hiển thị từng trường theo dạng thẻ rõ ràng: số tiền / ngày / danh mục (+ top 3 gợi ý) / ghi chú / tài khoản
- Mỗi trường có thể chỉnh sửa inline — không cần quay lại nhập lại câu từ đầu
- Trường nào được NLP trích xuất tự động → hiển thị nhãn **"Tự động"** (màu xanh) để phân biệt với trường người dùng tự nhập
- Trường nào chưa xác định được → hiển thị nhãn **"Cần bổ sung"** (màu vàng), chặn nút Xác nhận cho đến khi được điền
- Sau khi xác nhận, giao dịch hiển thị ngay trong danh sách lịch sử (không cần refresh)

---

**US-32** · Phản hồi về kết quả phân loại sai

> *Với tư cách là người dùng, khi hệ thống phân loại sai danh mục, tôi muốn sửa và đồng thời "dạy" hệ thống để lần sau không mắc lại.*

**Tiêu chí chấp nhận:**
- Khi người dùng sửa danh mục gợi ý → hiển thị tuỳ chọn: **"Nhớ lựa chọn này cho lần sau"** (mặc định bật)
- Nếu chọn ghi nhớ: cập nhật `nlp_category_mappings` với ánh xạ mới (từ khoá → danh mục người dùng đã chọn)
- Ánh xạ người dùng luôn được ưu tiên hơn gợi ý mặc định của mô hình
- Người dùng có thể xem và xoá các ánh xạ đã học trong phần Cài đặt

---

## 4. Quy Tắc Nghiệp Vụ Quan Trọng

| # | Quy tắc |
|---|---|
| BR-01 | Mọi phép tính tiền tệ dùng `Decimal`, không dùng `float` để tránh sai số làm tròn |
| BR-02 | Mọi thao tác cập nhật số dư + ngân sách phải là atomic (một DB transaction) |
| BR-03 | Không bao giờ hard-delete dữ liệu tài chính; dùng soft-delete (`is_active = false`) |
| BR-04 | Giao dịch `reconciled` là bất biến — không sửa, không xoá |
| BR-05 | Mọi truy vấn phải lọc theo `user_id` — người dùng chỉ thấy dữ liệu của mình |
| BR-06 | Các thao tác quan trọng (tạo/sửa/xoá giao dịch, thay đổi ngân sách) ghi vào `audit_logs` |
| BR-07 | Ngân sách tổ chức theo tháng (`YYYY-MM`); không có rollover tự động |
| BR-08 | "Cần phân bổ" = tổng thu nhập nhận được − tổng đã phân bổ vào danh mục; không được âm |
| BR-09 | Sửa giao dịch phải hoàn trả tác động cũ trước khi áp dụng tác động mới — toàn bộ trong một DB transaction |
| BR-10 | Giao dịch `reconciled` là bất biến tuyệt đối — không sửa, không xoá, không thay đổi trạng thái |
| BR-11 | Danh mục đã có giao dịch chỉ được soft-delete; không được hard-delete để bảo toàn lịch sử |
| BR-12 | Đổi mật khẩu thành công phải thu hồi toàn bộ refresh token cũ (invalidate all sessions) |
| BR-13 | Giao dịch định kỳ tạo ra các giao dịch thực ở trạng thái `uncleared`; người dùng phải xác nhận thủ công |
| BR-14 | Mục tiêu tiết kiệm (Savings Goal) được mô hình hoá như một danh mục đặc biệt — áp dụng mọi business rule của danh mục |
| BR-15 | Chatbot chỉ được đọc dữ liệu (`GET`) — tuyệt đối không thực hiện ghi/sửa/xoá dữ liệu tài chính thay người dùng |
| BR-16 | Mọi query của chatbot tới dữ liệu tài chính phải kèm `user_id` của người dùng đang đăng nhập — không được truy cập dữ liệu người dùng khác |
| BR-17 | NLP chỉ tạo giao dịch ở trạng thái **"chờ xác nhận"** — bắt buộc có bước người dùng xác nhận (human-in-the-loop) trước khi ghi vào CSDL |
| BR-18 | Ánh xạ danh mục do người dùng tự xác nhận (`nlp_category_mappings`) luôn được ưu tiên hơn gợi ý mặc định của mô hình AI |
| BR-19 | Lịch sử hội thoại chatbot không được lưu vĩnh viễn vào CSDL — chỉ giữ trong bộ nhớ phiên (session); xoá khi người dùng đóng hội thoại |

---

## 5. Phụ Lục — Thuật Ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Zero-based budgeting** | Phương pháp lập ngân sách mà mỗi đồng tiền phải được gán mục đích cụ thể |
| **Cần phân bổ (To Be Budgeted)** | Số tiền thu vào nhưng chưa được gán cho danh mục nào |
| **Danh mục (Category)** | Nhóm chi tiêu hoặc thu nhập (ví dụ: Ăn uống, Lương, Tiết kiệm) |
| **Giao dịch (Transaction)** | Một khoản thu, chi hoặc chuyển khoản thực tế |
| **Ngân sách (Budget Entry)** | Kế hoạch chi tiêu cho một danh mục trong một tháng cụ thể |
| **Đối soát (Reconcile)** | Xác nhận giao dịch khớp với sao kê ngân hàng thực tế |
| **Soft-delete** | Đánh dấu bản ghi là không còn hoạt động (`is_active = false`) thay vì xoá thật |
| **Audit log** | Nhật ký ghi lại snapshot trước/sau của mọi thao tác quan trọng |
| **Recurring transaction** | Giao dịch được thiết lập tự động lặp lại theo chu kỳ (ngày/tuần/tháng/năm) |
| **Savings Goal / Sinking Fund** | Danh mục đặc biệt dành riêng cho một mục tiêu tiết kiệm cụ thể; phân bổ đều mỗi tháng |
| **Template định kỳ** | Cấu hình gốc của một giao dịch định kỳ; các giao dịch thực được sinh ra từ template này |
| **NLP (Natural Language Processing)** | Xử lý ngôn ngữ tự nhiên — công nghệ cho phép máy tính hiểu và trích xuất thông tin từ văn bản người dùng viết/nói |
| **Structured extraction** | Quá trình NLP chuyển câu văn tự do thành dữ liệu có cấu trúc (số tiền, ngày, danh mục, …) |
| **Human-in-the-loop** | Thiết kế bắt buộc có bước xác nhận của con người trước khi AI thực hiện hành động có tác động thực tế |
| **Confidence score** | Độ tin cậy (%) của mô hình AI khi gợi ý danh mục; dưới 60% → yêu cầu người dùng chọn thủ công |
| **nlp_category_mappings** | Bảng lưu ánh xạ (từ khoá → danh mục) mà người dùng đã xác nhận; dùng để cá nhân hoá gợi ý NLP |
| **AI Chatbot / Trợ lý tài chính** | Giao diện hội thoại tích hợp trong ứng dụng; hỗ trợ hỏi kiến thức tài chính và truy vấn dữ liệu cá nhân bằng tiếng Việt |
