const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

const PROGRESS_FILE = path.join(__dirname, 'progress-data.json');

// Helper function to read progress data
function readProgressData() {
    try {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading progress file:', error);
        return null;
    }
}

// Helper function to write progress data
function writeProgressData(data) {
    try {
        data.metadata.lastUpdated = new Date().toISOString();
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing progress file:', error);
        return false;
    }
}

// GET - Fetch all progress data
app.get('/api/progress', (req, res) => {
    const data = readProgressData();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read progress data' });
    }
});

// POST - Update a single concept's completion status
app.post('/api/progress/concept', (req, res) => {
    const { conceptId, completed } = req.body;
    
    if (!conceptId) {
        return res.status(400).json({ error: 'conceptId is required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Find and update the concept in the appropriate topic
    let found = false;
    for (const topicKey in data.systemDesign.topics) {
        const topic = data.systemDesign.topics[topicKey];
        if (topic.concepts && topic.concepts[conceptId]) {
            topic.concepts[conceptId].completed = completed;
            topic.concepts[conceptId].completedAt = completed ? new Date().toISOString() : null;
            found = true;
            break;
        }
    }

    if (!found) {
        return res.status(404).json({ error: `Concept ${conceptId} not found` });
    }

    // Update summary counts
    let completedCount = 0;
    let totalCount = 0;
    for (const topicKey in data.systemDesign.topics) {
        const topic = data.systemDesign.topics[topicKey];
        if (topic.concepts) {
            for (const conceptKey in topic.concepts) {
                totalCount++;
                if (topic.concepts[conceptKey].completed) {
                    completedCount++;
                }
            }
        }
    }
    data.summary.systemDesign.completedConcepts = completedCount;
    data.summary.systemDesign.totalConcepts = totalCount;
    data.summary.systemDesign.percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            conceptId, 
            completed,
            summary: data.summary.systemDesign
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST - Update a DSA problem's completion status
app.post('/api/progress/dsa', (req, res) => {
    const { problemId, category, completed } = req.body;
    
    if (!problemId || !category) {
        return res.status(400).json({ error: 'problemId and category are required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Find and update the DSA problem
    if (data.dsa.categories[category] && data.dsa.categories[category].problems[problemId]) {
        data.dsa.categories[category].problems[problemId].completed = completed;
        data.dsa.categories[category].problems[problemId].completedAt = completed ? new Date().toISOString() : null;
    } else {
        return res.status(404).json({ error: `DSA problem ${problemId} not found in ${category}` });
    }

    // Update DSA summary counts
    let completedCount = 0;
    let totalCount = 0;
    for (const catKey in data.dsa.categories) {
        const cat = data.dsa.categories[catKey];
        if (cat.problems) {
            for (const probKey in cat.problems) {
                totalCount++;
                if (cat.problems[probKey].completed) {
                    completedCount++;
                }
            }
        }
    }
    data.summary.dsa.completedProblems = completedCount;
    data.summary.dsa.totalProblems = totalCount;
    data.summary.dsa.percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            problemId, 
            completed,
            summary: data.summary.dsa
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST - Bulk update (for import)
app.post('/api/progress/bulk', (req, res) => {
    const { progressData } = req.body;
    
    if (!progressData) {
        return res.status(400).json({ error: 'progressData is required' });
    }

    if (writeProgressData(progressData)) {
        res.json({ success: true, message: 'Progress data imported successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save progress data' });
    }
});

// POST - Reset all progress
app.post('/api/progress/reset', (req, res) => {
    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Reset all System Design concepts
    for (const topicKey in data.systemDesign.topics) {
        const topic = data.systemDesign.topics[topicKey];
        if (topic.concepts) {
            for (const conceptKey in topic.concepts) {
                topic.concepts[conceptKey].completed = false;
                topic.concepts[conceptKey].completedAt = null;
            }
        }
    }

    // Reset all DSA problems
    for (const catKey in data.dsa.categories) {
        const cat = data.dsa.categories[catKey];
        if (cat.problems) {
            for (const probKey in cat.problems) {
                cat.problems[probKey].completed = false;
                cat.problems[probKey].completedAt = null;
            }
        }
    }

    // Reset summary
    data.summary.systemDesign.completedConcepts = 0;
    data.summary.systemDesign.percentage = 0;
    data.summary.dsa.completedProblems = 0;
    data.summary.dsa.percentage = 0;

    if (writeProgressData(data)) {
        res.json({ success: true, message: 'All progress reset successfully' });
    } else {
        res.status(500).json({ error: 'Failed to reset progress' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     📚 Progress Tracker Server Running!                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🌐 Open in browser: http://localhost:${PORT}               ║
║                                                            ║
║  📄 System Design:  http://localhost:${PORT}/system-design.html  
║  📄 DSA Notes:      http://localhost:${PORT}/dsa-notes.html      
║                                                            ║
║  ✅ JSON file will auto-update when you check boxes!       ║
║                                                            ║
║  Press Ctrl+C to stop the server                           ║
╚════════════════════════════════════════════════════════════╝
    `);
});
