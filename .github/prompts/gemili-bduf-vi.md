
<System_Persona>
Bạn sẽ đóng vai một kiến trúc sư phần mềm chuyên gia và một lập trình viên senior. Nhiệm vụ của bạn là phân tích yêu cầu của tôi và tạo ra một bộ tài liệu nền tảng toàn diện cho một dự án phần mềm mới. Bạn phải suy nghĩ một cách có hệ thống, ưu tiên cấu trúc, khả năng bảo trì và sự rõ ràng.
</System_Persona>

<Project_Brief>

</Project_Brief>

<Core_Instruction>
Dựa trên <Project_Brief>, hãy thực hiện các nhiệm vụ sau:
1.  Tạo một tài liệu Thiết kế Tổng thể Ban đầu (Big Design Up Front - BDUF) chi tiết. Tài liệu này sẽ đóng vai trò là nguồn chân lý duy nhất cho toàn bộ quá trình phát triển. Tất cả các mã nguồn được tạo ra trong tương lai PHẢI tuân thủ nghiêm ngặt tài liệu này.
2.  Tạo một tệp `README.md` ban đầu.
3.  Tạo một tệp `CONTRIBUTION.md` ban đầu, bao gồm các quy tắc cho sự tham gia của AI.
4.  Tạo một tệp `CHANGELOG.md` trống.
</Core_Instruction>

<BDUF_Structure_Rubric>
Tài liệu BDUF PHẢI bao gồm các phần sau, mỗi phần có giải thích chi tiết:
1.  **Tổng quan Kiến trúc (Architecture Overview):** Mô tả cấp cao về kiến trúc hệ thống (ví dụ: Monolithic, Microservices), các thành phần chính và cách chúng tương tác.
2.  **Mô hình Dữ liệu (Data Models):** Định nghĩa chi tiết cho mỗi mô hình dữ liệu hoặc đối tượng cơ sở dữ liệu, bao gồm các trường, kiểu dữ liệu và mối quan hệ (ví dụ: User, Habit, CompletionLog).
3.  **Điểm cuối API (API Endpoints) (nếu có):** Danh sách các điểm cuối API RESTful, bao gồm phương thức HTTP (GET, POST, etc.), URL, tham số yêu cầu và cấu trúc phản hồi dự kiến.
4.  **Cấu trúc Tệp và Thư mục (File and Directory Structure):** Một biểu diễn dạng cây của cấu trúc thư mục dự án được đề xuất, giải thích mục đích của mỗi tệp và thư mục chính.
5.  **Các Lớp/Hàm Chính (Key Functions/Classes):** Mô tả về các lớp và hàm quan trọng nhất sẽ tạo nên logic cốt lõi của ứng dụng, bao gồm trách nhiệm và chữ ký phương thức của chúng.
6.  **Kế hoạch Triển khai (Implementation Plan):** Một danh sách các bước được đề xuất theo thứ tự để xây dựng ứng dụng, chia nhỏ dự án thành các phần có thể quản lý được.
</BDUF_Structure_Rubric>

<Ancillary_Document_Generation>
-   **README.md:** Phải bao gồm Tên dự án, Mô tả ngắn gọn, Hướng dẫn Cài đặt (bao gồm các phụ thuộc như `requirements.txt`), và Hướng dẫn Sử dụng Cơ bản.
-   **CONTRIBUTION.md:** Phải bao gồm một phần có tiêu đề "Nguyên tắc dành cho AI Hỗ trợ" (Guidelines for AI Assistance) nêu rõ rằng AI phải luôn tham chiếu đến BDUF, tuân thủ phong cách mã hóa (ví dụ: PEP 8 cho Python), và đề xuất các thay đổi đối với BDUF thay vì tự ý đi chệch khỏi nó.
-   **CHANGELOG.md:** Phải được khởi tạo với một tiêu đề và một mục nhập cho "Khởi tạo Dự án".
</Ancillary_Document_Generation>

<Output_Format>
Trình bày mỗi tài liệu (BDUF, README.md, CONTRIBUTION.md, CHANGELOG.md) trong một khối mã riêng biệt, được đánh dấu rõ ràng bằng Markdown. Ví dụ:
### BDUF
### 4.2 Giải phẫu Lời nhắc: Phân tích Từng phần

Mỗi thành phần của lời nhắc "Project Genesis" được thiết kế một cách có chủ ý để hướng dẫn AI hướng tới kết quả tối ưu.

*   **`<System_Persona>`**: Phần này thiết lập bối cảnh cho AI. Bằng cách chỉ định vai trò là một "kiến trúc sư phần mềm chuyên gia", nó sẽ ưu tiên các quyết định thiết kế cấp cao và các thực hành tốt nhất thay vì chỉ tạo ra mã một cách máy móc.
*   **`<Project_Brief>`**: Đây là đầu vào duy nhất do người dùng cung cấp. Sự rõ ràng và chi tiết ở đây sẽ trực tiếp ảnh hưởng đến chất lượng của các tài liệu được tạo ra.
*   **`<Core_Instruction>`**: Đây là lệnh chính, nêu rõ các sản phẩm cần giao (BDUF và các tài liệu phụ trợ). Nó nhấn mạnh tầm quan trọng của BDUF như là "nguồn chânQ lý duy nhất", một chỉ thị quan trọng cho hành vi trong tương lai của AI.
*   **`<BDUF_Structure_Rubric>`**: Đây có lẽ là phần quan trọng nhất. Thay vì chỉ yêu cầu một "tài liệu thiết kế", nó cung cấp một bản thiết kế chính xác cho chính tài liệu đó. Điều này buộc AI phải suy nghĩ một cách có cấu trúc về các khía cạnh khác nhau của dự án, từ dữ liệu đến API và cấu trúc tệp, đảm bảo một kế hoạch toàn diện.
*   **`<Ancillary_Document_Generation>`**: Phần này tự động hóa việc tạo ra các tài liệu hỗ trợ quan trọng, thiết lập ngay từ đầu một môi trường phát triển chuyên nghiệp. Việc bao gồm các quy tắc cho AI trong `CONTRIBUTION.md` là một kỹ thuật nâng cao để lập trình hành vi của chính AI.
*   **`<Output_Format>`**: Một chỉ thị đơn giản nhưng cần thiết này đảm bảo rằng kết quả được tổ chức tốt và dễ dàng để nhà phát triển sao chép vào các tệp riêng biệt trong dự án của họ.

## Phần V: Thực thi và Lặp lại: Hướng dẫn Thực hành để Triển khai Khung làm việc

### 5.1 Bước 0: Thiết lập Môi trường

Trước khi sử dụng lời nhắc "Project Genesis", hãy đảm bảo các điều kiện tiên quyết sau được đáp ứng:
1.  **Bật tính năng "Artifacts"** trong cài đặt Claude của bạn. Điều này rất quan trọng để lưu trữ BDUF một cách bền vững.[1]
2.  **Thiết lập môi trường phát triển cục bộ của bạn**. Điều này bao gồm việc cài đặt ngôn ngữ lập trình cần thiết (ví dụ: Python), trình quản lý gói, và khởi tạo một kho lưu trữ Git.[1]
3.  **Chuẩn bị ý tưởng dự án cấp cao của bạn**. Hãy suy nghĩ kỹ về những gì bạn muốn xây dựng để có thể điền vào phần `<Project_Brief>` một cách hiệu quả.

### 5.2 Bước 1: Tương tác Khởi tạo

1.  Bắt đầu một dự án mới trong Claude.
2.  Sao chép toàn bộ mẫu lời nhắc "Project Genesis", điền chi tiết dự án của bạn vào phần `<Project_Brief>`.
3.  Gửi lời nhắc. Claude sẽ tạo ra BDUF và các tài liệu khác.
4.  **Xem xét và Tinh chỉnh**: Đọc kỹ các tài liệu được tạo ra. Nếu có bất kỳ điều gì không rõ ràng hoặc không chính xác, hãy tham gia vào một cuộc đối thoại với Claude trong cùng một cuộc trò chuyện để tinh chỉnh chúng. Ví dụ: "Trong phần Mô hình Dữ liệu, hãy thêm một trường 'last_login' vào mô hình User."
5.  **Hành động Quan trọng**: Khi bạn hài lòng với BDUF cuối cùng, hãy sao chép nội dung của nó và lưu nó dưới dạng một tài liệu đính kèm (artifact) trong dự án Claude của bạn. Đặt tên cho nó một cách có ý nghĩa, ví dụ: `project_bduf.md`.

### 5.3 Bước 2: Vòng lặp Phát triển

1.  **Bắt đầu một cuộc trò chuyện MỚI** trong cùng một dự án cho mỗi nhiệm vụ triển khai. Điều này giữ cho ngữ cảnh tập trung và ngăn ngừa sự trôi dạt.
2.  **Soạn thảo Lời nhắc Tham chiếu**: Mỗi lời nhắc để tạo mã nên bắt đầu bằng cách tham chiếu rõ ràng đến tài liệu đính kèm BDUF.
    *   *Ví dụ tốt:* "Tham chiếu đến phần `Mô hình Dữ liệu` của `project_bduf.md`, hãy tạo lớp Python SQLAlchemy cho mô hình 'User'."
    *   *Ví dụ xấu:* "Hãy tạo cho tôi lớp user."
3.  **Quản lý Mã cục bộ**: Khi Claude tạo mã, hãy sao chép nó vào môi trường phát triển cục bộ của bạn. Sử dụng Git để cam kết các thay đổi thường xuyên. Việc này giúp theo dõi tiến trình và cho phép bạn quay lại các phiên bản trước nếu AI mắc lỗi. Hãy coi mỗi phiên làm việc với AI như một yêu cầu kéo (pull request) về mặt tinh thần; bạn đang xem xét và tích hợp mã do một thành viên trong nhóm tạo ra.[1]

### 5.4 Bước 3: Duy trì sự Lành mạnh của Dự án

1.  **Cập nhật BDUF**: Nếu trong quá trình phát triển, bạn nhận ra rằng kiến trúc ban đầu cần thay đổi, đừng chỉ yêu cầu AI thay đổi mã. Hãy bắt đầu một cuộc trò chuyện "thiết kế" mới, yêu cầu nó cập nhật phần liên quan của BDUF. Sau đó, thay thế tài liệu đính kèm cũ bằng phiên bản mới, đã được sửa đổi. Điều này đảm bảo nguồn chân lý luôn được cập nhật.
2.  **Duy trì `CHANGELOG.md`**: Sau mỗi phiên phát triển quan trọng, hãy dành một chút thời gian để cập nhật `CHANGELOG.md`. Ghi lại các tính năng đã được thêm hoặc các thay đổi đã được thực hiện. Tài liệu này hoạt động như "trạng thái phiên" cho tương tác tiếp theo của bạn và là một công cụ vô giá để theo dõi sự tiến hóa của dự án.[1]
3.  **Hiểu Mã nguồn**: Cuối cùng, điều quan trọng là phải nhắc lại lời cảnh báo từ người dùng `Think_Different_1729`. Phương pháp này không phải là một con đường tắt để bỏ qua việc học hỏi. Ngược lại, nó hoạt động bởi vì nó buộc nhà phát triển phải suy nghĩ như một kiến trúc sư và xem xét mã một cách cẩn thận. "Sử dụng Claude để viết mã mà bạn không hiểu giống như sao chép một bài luận ở trường — bạn sẽ không học được gì, và thiệt hại tiềm tàng đối với danh tiếng của bạn có thể sẽ ám ảnh bạn sau này".[1] Hãy sử dụng AI như một công cụ để tăng tốc việc thực thi, không phải để thay thế cho sự hiểu biết.