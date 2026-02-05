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

// POST - Update pattern practice problem completion status
app.post('/api/progress/pattern-practice', (req, res) => {
    const { problemId, completed } = req.body;
    
    if (!problemId) {
        return res.status(400).json({ error: 'problemId is required' });
    }

    const progressData = readProgressData();
    
    // Initialize patternPractice if it doesn't exist
    if (!progressData.patternPractice) {
        progressData.patternPractice = {
            problems: {},
            totalProblems: 40,
            completedProblems: 0
        };
    }
    
    // Update problem status
    if (completed) {
        progressData.patternPractice.problems[problemId] = {
            id: problemId,
            completed: true,
            completedAt: new Date().toISOString()
        };
    } else {
        delete progressData.patternPractice.problems[problemId];
    }
    
    // Update summary
    const completedCount = Object.keys(progressData.patternPractice.problems).length;
    progressData.patternPractice.completedProblems = completedCount;
    
    // Add to main summary if not exists
    if (!progressData.summary.patternPractice) {
        progressData.summary.patternPractice = {
            totalProblems: 40,
            completedProblems: 0,
            percentage: 0
        };
    }
    progressData.summary.patternPractice.completedProblems = completedCount;
    progressData.summary.patternPractice.percentage = Math.round((completedCount / 40) * 100);
    
    // Update metadata
    progressData.metadata.lastUpdated = new Date().toISOString();
    
    if (writeProgressData(progressData)) {
        res.json({ 
            success: true, 
            problemId, 
            completed, 
            totalCompleted: completedCount,
            percentage: progressData.summary.patternPractice.percentage
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

// POST - Update a script's completion status
app.post('/api/progress/scripts', (req, res) => {
    const { scriptId, completed } = req.body;
    
    if (!scriptId) {
        return res.status(400).json({ error: 'scriptId is required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Initialize scripts section if not exists
    if (!data.scripts) {
        data.scripts = {
            items: {}
        };
    }
    if (!data.summary.scripts) {
        data.summary.scripts = {
            totalScripts: 7,
            completedScripts: 0,
            percentage: 0
        };
    }

    // Update or create the script entry
    if (!data.scripts.items[scriptId]) {
        data.scripts.items[scriptId] = {
            id: scriptId,
            name: scriptId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            completed: false,
            completedAt: null
        };
    }
    
    data.scripts.items[scriptId].completed = completed;
    data.scripts.items[scriptId].completedAt = completed ? new Date().toISOString() : null;

    // Update scripts summary counts
    let completedCount = 0;
    let totalCount = Object.keys(data.scripts.items).length;
    for (const key in data.scripts.items) {
        if (data.scripts.items[key].completed) {
            completedCount++;
        }
    }
    data.summary.scripts.completedScripts = completedCount;
    data.summary.scripts.totalScripts = Math.max(totalCount, 7);
    data.summary.scripts.percentage = data.summary.scripts.totalScripts > 0 
        ? Math.round((completedCount / data.summary.scripts.totalScripts) * 100) 
        : 0;

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            scriptId, 
            completed,
            summary: data.summary.scripts
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST - Update a Three Months Plan problem's completion status
app.post('/api/progress/three-months', (req, res) => {
    const { problemId, completed } = req.body;
    
    if (!problemId) {
        return res.status(400).json({ error: 'problemId is required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Initialize threeMonthsPlan section if not exists
    if (!data.threeMonthsPlan) {
        data.threeMonthsPlan = {
            problems: {}
        };
    }
    if (!data.summary.threeMonthsPlan) {
        data.summary.threeMonthsPlan = {
            totalProblems: 100,
            completedProblems: 0,
            percentage: 0
        };
    }

    // Update or create the problem entry
    if (!data.threeMonthsPlan.problems[problemId]) {
        data.threeMonthsPlan.problems[problemId] = {
            id: problemId,
            completed: false,
            completedAt: null
        };
    }
    
    data.threeMonthsPlan.problems[problemId].completed = completed;
    data.threeMonthsPlan.problems[problemId].completedAt = completed ? new Date().toISOString() : null;

    // Update summary counts
    let completedCount = 0;
    for (const key in data.threeMonthsPlan.problems) {
        if (data.threeMonthsPlan.problems[key].completed) {
            completedCount++;
        }
    }
    data.summary.threeMonthsPlan.completedProblems = completedCount;
    data.summary.threeMonthsPlan.percentage = Math.round((completedCount / 100) * 100);

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            problemId, 
            completed,
            summary: data.summary.threeMonthsPlan
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// GET - Fetch Three Months Plan progress
app.get('/api/progress/three-months', (req, res) => {
    const data = readProgressData();
    if (data) {
        res.json({
            problems: data.threeMonthsPlan?.problems || {},
            summary: data.summary?.threeMonthsPlan || { totalProblems: 100, completedProblems: 0, percentage: 0 }
        });
    } else {
        res.status(500).json({ error: 'Failed to read progress data' });
    }
});

// ==================== ULTIMATE GOOGLE 541 ====================
// POST - Save Ultimate Google problem progress
app.post('/api/progress/ultimate-google', (req, res) => {
    const { problemId, completed } = req.body;
    
    if (!problemId) {
        return res.status(400).json({ error: 'problemId is required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Initialize ultimateGoogle section if not exists
    if (!data.ultimateGoogle) {
        data.ultimateGoogle = {
            problems: {}
        };
    }
    if (!data.summary.ultimateGoogle) {
        data.summary.ultimateGoogle = {
            totalProblems: 541,
            completedProblems: 0,
            percentage: 0
        };
    }

    // Update or create the problem entry
    if (!data.ultimateGoogle.problems[problemId]) {
        data.ultimateGoogle.problems[problemId] = {
            id: problemId,
            completed: false,
            completedAt: null
        };
    }
    
    data.ultimateGoogle.problems[problemId].completed = completed;
    data.ultimateGoogle.problems[problemId].completedAt = completed ? new Date().toISOString() : null;

    // Update summary counts
    let completedCount = 0;
    for (const key in data.ultimateGoogle.problems) {
        if (data.ultimateGoogle.problems[key].completed) {
            completedCount++;
        }
    }
    data.summary.ultimateGoogle.completedProblems = completedCount;
    data.summary.ultimateGoogle.percentage = Math.round((completedCount / 541) * 100);

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            problemId, 
            completed,
            summary: data.summary.ultimateGoogle
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// GET - Fetch Ultimate Google progress
app.get('/api/progress/ultimate-google', (req, res) => {
    const data = readProgressData();
    if (data) {
        res.json({
            problems: data.ultimateGoogle?.problems || {},
            summary: data.summary?.ultimateGoogle || { totalProblems: 541, completedProblems: 0, percentage: 0 }
        });
    } else {
        res.status(500).json({ error: 'Failed to read progress data' });
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

    // Reset all scripts
    if (data.scripts && data.scripts.items) {
        for (const key in data.scripts.items) {
            data.scripts.items[key].completed = false;
            data.scripts.items[key].completedAt = null;
        }
    }

    // Reset all Three Months Plan problems
    if (data.threeMonthsPlan && data.threeMonthsPlan.problems) {
        for (const key in data.threeMonthsPlan.problems) {
            data.threeMonthsPlan.problems[key].completed = false;
            data.threeMonthsPlan.problems[key].completedAt = null;
        }
    }

    // Reset all Ultimate Google problems
    if (data.ultimateGoogle && data.ultimateGoogle.problems) {
        for (const key in data.ultimateGoogle.problems) {
            data.ultimateGoogle.problems[key].completed = false;
            data.ultimateGoogle.problems[key].completedAt = null;
        }
    }

    // Reset summary
    data.summary.systemDesign.completedConcepts = 0;
    data.summary.systemDesign.percentage = 0;
    data.summary.dsa.completedProblems = 0;
    data.summary.dsa.percentage = 0;
    if (data.summary.scripts) {
        data.summary.scripts.completedScripts = 0;
        data.summary.scripts.percentage = 0;
    }
    if (data.summary.threeMonthsPlan) {
        data.summary.threeMonthsPlan.completedProblems = 0;
        data.summary.threeMonthsPlan.percentage = 0;
    }
    if (data.summary.ultimateGoogle) {
        data.summary.ultimateGoogle.completedProblems = 0;
        data.summary.ultimateGoogle.percentage = 0;
    }

    if (writeProgressData(data)) {
        res.json({ success: true, message: 'All progress reset successfully' });
    } else {
        res.status(500).json({ error: 'Failed to reset progress' });
    }
});

// POST - Update ByteByteGo progress
app.post('/api/bytebytego-progress', (req, res) => {
    const { bytebytego } = req.body;
    
    if (!bytebytego) {
        return res.status(400).json({ error: 'bytebytego data is required' });
    }

    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }

    // Initialize bytebytego section if not exists
    if (!data.bytebytego) {
        data.bytebytego = {
            topics: {}
        };
    }
    if (!data.summary.bytebytego) {
        data.summary.bytebytego = {
            totalTopics: 40,
            completedTopics: 0,
            percentage: 0
        };
    }

    // Update topics
    data.bytebytego.topics = bytebytego.topics;
    
    // Update summary
    data.summary.bytebytego = bytebytego.summary;

    if (writeProgressData(data)) {
        res.json({ 
            success: true, 
            summary: data.summary.bytebytego
        });
    } else {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// GET - Get ByteByteGo progress
app.get('/api/bytebytego-progress', (req, res) => {
    const data = readProgressData();
    if (!data) {
        return res.status(500).json({ error: 'Failed to read progress data' });
    }
    
    res.json({
        bytebytego: data.bytebytego || { topics: {} },
        summary: data.summary.bytebytego || { totalTopics: 40, completedTopics: 0, percentage: 0 }
    });
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
║  🎬 Reel Scripts:   http://localhost:${PORT}/reel-scripts.html      
║                                                            ║
║  ✅ JSON file will auto-update when you check boxes!       ║
║                                                            ║
║  Press Ctrl+C to stop the server                           ║
╚════════════════════════════════════════════════════════════╝
    `);
});
