# 🎓 Vietnamese Formal Converter v1.3  
## *The Face AI*

![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC?logo=tailwind-css)
![Model](https://img.shields.io/badge/Model-Qwen2.5_CoT-blue)
![Framework](https://img.shields.io/badge/Framework-Unsloth-green)

## 📌 Overview

**Dự án Full-stack AI giúp chuẩn hóa văn phong giao tiếp tiếng Việt**  
*(từ Teencode / Văn nói → Văn bản hành chính trang trọng).*

Hệ thống kết hợp sức mạnh của **Large Language Model (Qwen2.5)** được tinh chỉnh bằng **Unsloth**, với giao diện web hiện đại hỗ trợ **Real-time Streaming** và **Chain-of-Thought Reasoning**.

## 🌟 Interface Preview (Giao diện)

Ứng dụng **“The Face AI”** được thiết kế chia làm **2 khu vực xử lý chính**:

### 🔹 1. The Input Hub *(Left Panel)*

Nơi người dùng nhập liệu các thông tin ngữ cảnh:

- **System Context:** Định nghĩa vai trò *(Persona)* cho AI  
- **User Intent:** Xác định mục đích  
  *(Ví dụ: Xin nghỉ học, hỏi điểm, gửi mail cho sếp)*  
- **Input Content:** Văn bản thô cần xử lý  

### 🔹 2. The Output Console *(Right Panel)*

- **🕵️ Reasoning Terminal (Dark Mode)**  
  - Giao diện Terminal mô phỏng quá trình *“suy nghĩ”* của AI  
  - Hiển thị luồng tư duy *(Reasoning)* từng bước theo **Real-time Streaming**

- **✨ Final Result Card (Light Mode)**  
  - Hiển thị kết quả cuối cùng đã được chuẩn hóa  
  - Tích hợp công cụ **Copy** và **Download JSON**

## 🚀 Key Features (Điểm nhấn kỹ thuật)

### 🧠 AI Engineering *(Backend)*

- **Core Model:** `Qwen2.5-7B-Instruct`  
  *(Mạnh về tiếng Việt & Logic)*

- **Optimization:**  
  Fine-tuned bằng thư viện **Unsloth**, chạy ở chế độ **4-bit quantization**  
  để tối ưu hóa bộ nhớ trên **Google Colab T4 GPU**

- **Chain-of-Thought (CoT):**  
  Model được huấn luyện để **phân tích lỗi sai** và **lên kế hoạch sửa đổi**  
  trước khi viết câu trả lời


### 🧩 Frontend Engineering *(ReactJS)*

- **Real-time Streaming:**  
  Sử dụng `ReadableStream` và `TextDecoder` để hứng dữ liệu từ API liên tục,  
  **không có độ trễ**

- **Smart Parsing Logic:**  
  Thuật toán tự động phát hiện token phân tách  
  `### Result:` trong dòng chảy dữ liệu  
  để chia tách phần **Suy luận (Reasoning)** và **Kết quả (Result)**  
  vào đúng ô hiển thị

- **Modern UI:**  
  Tailwind CSS với hiệu ứng **Glassmorphism**, **Responsive**,  
  kết hợp **Dark / Light mode**


## 🛠️ Tech Stack

| Component | Technology |
|---------|------------|
| **Frontend** | React (Vite), Tailwind CSS, Lucide Icons |
| **Backend API** | FastAPI, Uvicorn, PyNgrok (Tunneling) |
| **AI Model** | PyTorch, Unsloth, HuggingFace Transformers |
| **Dataset** | Custom JSONL (Vietnamese Formal Language) |


## 📝 Model Prompt Template

Để AI hoạt động chính xác, dữ liệu đầu vào được cấu trúc như sau:

Dưới đây là ngữ cảnh, mục đích và câu nói gốc. Hãy phân tích (Reasoning)
cách chỉnh sửa, sau đó đưa ra câu viết lại (Target) trang trọng.

### Ngữ cảnh:
{Mô tả ngữ cảnh}

### Mục đích:
{Mục đích câu nói}

### Câu gốc (Input):
{Câu cần sửa}

### Phân tích (Reasoning):

## ⚙️ Installation & Usage

### 🔹 Bước 1: Khởi chạy Backend *(AI Brain)*

* Mở file Notebook trong thư mục `backend/` trên **Google Colab**
* Chạy toàn bộ **Cells** để load model và khởi tạo Server
* Copy URL **Ngrok** được tạo ra
  *(Ví dụ: [https://xyz.ngrok-free.app](https://xyz.ngrok-free.app))*


### 🔹 Bước 2: Khởi chạy Frontend *(Local)*

**Yêu cầu:** Đã cài đặt **Node.js**


# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt thư viện (Chỉ chạy lần đầu)
npm install

# 3. Chạy ứng dụng
npm run dev

### 🔹 Bước 3: Sử dụng

* Truy cập: `http://localhost:5173`
* Dán URL **Ngrok** vào ô cài đặt trên góc phải ứng dụng
* Khi trạng thái báo **READY** *(xanh lá)*,
  nhập thông tin và nhấn **ANALYZE & EXECUTE**


## 📂 Project Structure

project1-ai-formal-converter/
├── backend/
│   └── formal_converter_backend.ipynb  # Colab Notebook (Run first)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Main Logic (Streaming & UI)
│   │   └── main.jsx
│   └── package.json
├── datasets/                           # Training data (JSONL/TXT)
└── README.md                           # Documentation

## 👨‍💻 Author

Le Dinh Minh An 

Project: AI for Formal Language
Role: Full-stack AI Engineer


