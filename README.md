# 📚 System Design & DSA Notes

A comprehensive, interactive learning platform for **System Design** and **Data Structures & Algorithms** with progress tracking, Hinglish explanations, and a modern UI.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)

---

## ✨ Features

### 🎯 System Design Notes
- **7 Comprehensive Topics** covering fundamentals to advanced concepts
- **61 Individual Concepts** with detailed explanations
- Topics include:
  - System Design Introduction
  - REST API Design
  - Scalability & Load Balancing
  - Caching Strategies
  - Database Design
  - Microservices Architecture
  - And more...

### 💻 DSA Notes
- **17 Curated Problems** from top interview patterns
- **5 Categories**:
  - Arrays & Hashing
  - Two Pointers
  - Sliding Window
  - Stack
  - Binary Search
- Each problem includes:
  - Problem statement
  - Multiple approaches (Brute Force → Optimal)
  - Time & Space complexity analysis
  - Dry run examples
  - Code implementations

### 🔥 Interactive Features
- **📝 Hinglish Explanations** - Easy-to-understand explanations in Hindi-English mix
- **✅ Progress Tracking** - Checkbox for each concept/problem with persistent storage
- **📊 Progress Bar** - Visual representation of your learning progress
- **🔄 Collapsible Sections** - Clean UI with expandable content
- **⌨️ Keyboard Shortcuts**:
  - `E` - Expand all sections
  - `W` - Collapse all sections
- **💾 Export/Import Progress** - Backup and restore your progress
- **🔄 Real-time Sync** - Progress syncs to backend automatically

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kundanha/My-article.git
   cd My-article
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   node server.js
   ```
   Server will start on `http://localhost:3000`

4. **Open the notes**
   - Open `system-design.html` in your browser for System Design notes
   - Open `dsa-notes.html` in your browser for DSA notes

---

## 📁 Project Structure

```
My-article/
├── 📄 system-design.html    # System Design notes (main page)
├── 📄 dsa-notes.html        # DSA problems and solutions
├── 📄 server.js             # Express backend for progress tracking
├── 📄 progress-data.json    # JSON database for progress storage
├── 📄 package.json          # npm dependencies
├── 📄 .gitignore            # Git ignore file
└── 📄 README.md             # This file
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | JSON file-based storage |
| API | RESTful API with CORS support |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get all progress data |
| POST | `/api/progress/concept` | Update a concept's completion status |
| POST | `/api/progress/dsa` | Update a DSA problem's completion status |
| POST | `/api/progress/bulk` | Bulk import progress data |
| POST | `/api/progress/reset` | Reset all progress |

---

## 🎨 Screenshots

### System Design Notes
- Modern collapsible sidebar
- Topic-wise organization
- Individual concept checkboxes
- Progress tracking bar

### DSA Notes
- Problem-wise collapsible sections
- Multiple approach explanations
- Dry run examples
- Complexity analysis

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Usage Tips

1. **Start with System Design Introduction** (Topic #0) to build fundamentals
2. **Check off concepts** as you learn them to track progress
3. **Use keyboard shortcuts** (`E`/`W`) to quickly expand/collapse all sections
4. **Export your progress** regularly as backup
5. **Run the server** for persistent progress tracking across sessions

---

## 🐛 Known Issues

- Progress tracking requires the backend server to be running
- For offline use, progress is saved to localStorage as fallback

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Kundan**
- GitHub: [@Kundanha](https://github.com/Kundanha)

---

## ⭐ Show Your Support

Give a ⭐ if this project helped you in your learning journey!

---

<p align="center">Made with ❤️ for learners preparing for tech interviews</p>
