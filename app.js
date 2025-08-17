// AI Sentiment Analysis Dashboard - Advanced Implementation
class SentimentAnalyzer {
    constructor() {
        this.analysisHistory = [];
        this.charts = {};
        this.settings = {
            realtime: true,
            delay: 500,
            showConfidence: true,
            showEmotion: true
        };
        
        // Sample data and keywords from the provided JSON
        this.sampleTexts = [
            "I absolutely love this product! It exceeded all my expectations and the customer service was fantastic.",
            "This is the worst experience I've ever had. Complete waste of money and time.",
            "The product is okay, nothing special but does what it's supposed to do.",
            "Amazing quality and fast shipping! Will definitely buy again. Highly recommend!",
            "Terrible customer support. Been waiting for weeks with no response to my complaint."
        ];

        this.emotionKeywords = {
            joy: ["love", "amazing", "fantastic", "excellent", "wonderful", "great", "awesome", "happy", "delighted", "pleased"],
            anger: ["hate", "terrible", "awful", "worst", "angry", "frustrated", "annoyed", "furious", "outraged", "disgusted"],
            fear: ["worried", "scared", "afraid", "anxious", "nervous", "concerned", "fearful", "frightened", "terrified", "panicked"],
            sadness: ["sad", "disappointed", "depressed", "upset", "miserable", "unhappy", "devastated", "heartbroken", "sorrowful", "gloomy"],
            surprise: ["wow", "amazing", "incredible", "unbelievable", "shocking", "unexpected", "astonishing", "remarkable", "stunning", "extraordinary"]
        };

        this.positiveKeywords = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "awesome", "love", "perfect", "outstanding", "brilliant", "superb", "magnificent", "exceptional", "marvelous"];
        this.negativeKeywords = ["bad", "terrible", "awful", "horrible", "disgusting", "hate", "worst", "pathetic", "useless", "disappointing", "frustrating", "annoying", "ridiculous", "stupid", "worthless"];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.loadSettings();
        this.setupThemeToggle();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Text input handlers
        const textInput = document.getElementById('textInput');
        let debounceTimer;
        
        textInput.addEventListener('input', (e) => {
            this.updateInputStats(e.target.value);
            
            if (this.settings.realtime && e.target.value.trim().length > 3) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.analyzeText(e.target.value);
                }, this.settings.delay);
            }
        });

        // Button handlers
        document.getElementById('clearBtn').addEventListener('click', () => this.clearInput());
        document.getElementById('sampleBtn').addEventListener('click', () => this.loadSampleText());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCurrentAnalysis());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToHistory());
        document.getElementById('batchAnalyzeBtn').addEventListener('click', () => this.analyzeBatch());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        document.getElementById('exportHistoryBtn').addEventListener('click', () => this.exportHistory());

        // Settings handlers
        document.getElementById('realtimeToggle').addEventListener('change', (e) => {
            this.settings.realtime = e.target.checked;
        });

        document.getElementById('delaySlider').addEventListener('input', (e) => {
            this.settings.delay = parseInt(e.target.value);
            document.getElementById('delayValue').textContent = `${e.target.value}ms`;
        });

        document.getElementById('confidenceToggle').addEventListener('change', (e) => {
            this.settings.showConfidence = e.target.checked;
        });

        document.getElementById('emotionToggle').addEventListener('change', (e) => {
            this.settings.showEmotion = e.target.checked;
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-color-scheme', currentTheme);
        
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-color-scheme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-color-scheme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Re-initialize charts with new theme colors
            setTimeout(() => this.initializeCharts(), 100);
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Load history when switching to history tab
        if (tabName === 'history') {
            this.renderHistory();
        }
    }

    updateInputStats(text) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200 * 60)); // 200 words per minute

        document.getElementById('wordCount').textContent = `${words} words`;
        document.getElementById('charCount').textContent = `${chars} characters`;
        document.getElementById('readingTime').textContent = `${readingTime}s reading time`;
    }

    clearInput() {
        document.getElementById('textInput').value = '';
        this.updateInputStats('');
        document.getElementById('resultsDashboard').style.display = 'none';
    }

    loadSampleText() {
        const randomText = this.sampleTexts[Math.floor(Math.random() * this.sampleTexts.length)];
        document.getElementById('textInput').value = randomText;
        this.updateInputStats(randomText);
        this.analyzeText(randomText);
    }

    async analyzeText(text) {
        if (!text.trim()) return;

        const startTime = performance.now();
        
        // Show processing indicator
        document.getElementById('processingIndicator').style.display = 'block';
        document.getElementById('resultsDashboard').style.display = 'none';

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Perform analysis
        const analysis = this.performSentimentAnalysis(text);
        const processingTime = performance.now() - startTime;
        analysis.processingTime = processingTime;
        analysis.timestamp = new Date().toISOString();

        // Hide processing indicator and show results
        document.getElementById('processingIndicator').style.display = 'none';
        document.getElementById('resultsDashboard').style.display = 'block';

        // Update UI with results
        this.displayResults(analysis);
        
        // Store current analysis for export
        this.currentAnalysis = analysis;
    }

    performSentimentAnalysis(text) {
        const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 0);
        
        // Calculate sentiment score
        let positiveScore = 0;
        let negativeScore = 0;
        let totalWords = words.length;

        // Keyword-based sentiment analysis
        words.forEach(word => {
            if (this.positiveKeywords.includes(word)) {
                positiveScore += 1;
            }
            if (this.negativeKeywords.includes(word)) {
                negativeScore += 1;
            }
        });

        // Calculate emotions
        const emotions = {};
        Object.keys(this.emotionKeywords).forEach(emotion => {
            emotions[emotion] = 0;
            words.forEach(word => {
                if (this.emotionKeywords[emotion].includes(word)) {
                    emotions[emotion] += 0.2;
                }
            });
        });

        // Normalize emotions
        const maxEmotion = Math.max(...Object.values(emotions));
        if (maxEmotion > 0) {
            Object.keys(emotions).forEach(emotion => {
                emotions[emotion] = Math.min(emotions[emotion] / maxEmotion * 0.8 + Math.random() * 0.2, 1);
            });
        } else {
            // Add some randomness if no emotion keywords found
            Object.keys(emotions).forEach(emotion => {
                emotions[emotion] = Math.random() * 0.3;
            });
        }

        // Calculate final sentiment
        let sentimentScore = (positiveScore - negativeScore) / Math.max(totalWords * 0.1, 1);
        sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
        
        // Add some sophistication based on text patterns
        const exclamationCount = (text.match(/!/g) || []).length;
        const questionCount = (text.match(/\?/g) || []).length;
        const capsCount = (text.match(/[A-Z]/g) || []).length;
        
        if (exclamationCount > 0) {
            sentimentScore += sentimentScore > 0 ? 0.2 : -0.1;
        }
        if (capsCount > totalWords * 2) {
            sentimentScore += sentimentScore > 0 ? 0.1 : -0.2;
        }

        sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
        
        // Determine sentiment label
        let sentimentLabel = 'NEUTRAL';
        if (sentimentScore > 0.1) sentimentLabel = 'POSITIVE';
        if (sentimentScore < -0.1) sentimentLabel = 'NEGATIVE';

        // Calculate confidence based on keyword density and text length
        const keywordDensity = (positiveScore + negativeScore) / totalWords;
        let confidence = Math.min(0.9, keywordDensity * 2 + (totalWords > 10 ? 0.3 : 0.1));
        confidence = Math.max(0.4, confidence + Math.random() * 0.2);

        // Calculate additional metrics
        const polarity = Math.abs(sentimentScore);
        const subjectivity = Math.min(0.9, keywordDensity + emotions.joy + emotions.anger + Math.random() * 0.3);
        
        const complexityFactors = [
            totalWords > 50 ? 'High' : totalWords > 20 ? 'Medium' : 'Low',
            text.includes(',') || text.includes(';') ? 1 : 0,
            questionCount > 0 ? 1 : 0
        ];
        const complexity = totalWords > 50 ? 'High' : totalWords > 20 ? 'Medium' : 'Low';

        return {
            text: text,
            sentiment: {
                score: Math.round(sentimentScore * 100) / 100,
                label: sentimentLabel,
                confidence: Math.round(confidence * 100) / 100
            },
            emotions: emotions,
            statistics: {
                wordCount: totalWords,
                charCount: text.length,
                readingTime: `${Math.max(1, Math.ceil(totalWords / 200 * 60))}s`,
                complexity: complexity,
                polarity: Math.round(polarity * 100) / 100,
                subjectivity: Math.round(subjectivity * 100) / 100
            },
            insights: this.generateInsights(sentimentScore, emotions, text, totalWords)
        };
    }

    generateInsights(sentimentScore, emotions, text, wordCount) {
        const insights = [];
        
        if (Math.abs(sentimentScore) > 0.7) {
            insights.push(`Strong ${sentimentScore > 0 ? 'positive' : 'negative'} sentiment detected`);
        }
        
        const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
            emotions[a] > emotions[b] ? a : b
        );
        
        if (emotions[dominantEmotion] > 0.5) {
            insights.push(`Primary emotion: ${dominantEmotion}`);
        }
        
        if (wordCount > 100) {
            insights.push('Comprehensive text analysis - high confidence');
        } else if (wordCount < 10) {
            insights.push('Short text - limited context for analysis');
        }
        
        if (text.includes('!')) {
            insights.push('Exclamatory tone detected');
        }
        
        if (text.includes('?')) {
            insights.push('Questioning or uncertainty present');
        }

        return insights.length > 0 ? insights : ['Standard sentiment analysis completed'];
    }

    displayResults(analysis) {
        // Update main sentiment display
        const sentimentEmojis = {
            'POSITIVE': '😊',
            'NEGATIVE': '😞',
            'NEUTRAL': '😐'
        };

        document.getElementById('sentimentEmoji').textContent = sentimentEmojis[analysis.sentiment.label];
        document.getElementById('sentimentLabel').textContent = analysis.sentiment.label;
        document.getElementById('sentimentLabel').className = `sentiment-label ${analysis.sentiment.label}`;
        document.getElementById('sentimentScore').textContent = analysis.sentiment.score.toFixed(2);
        document.getElementById('confidenceScore').textContent = `${Math.round(analysis.sentiment.confidence * 100)}%`;

        // Update metrics
        document.getElementById('processingTime').textContent = `${Math.round(analysis.processingTime)}ms`;
        document.getElementById('complexityScore').textContent = analysis.statistics.complexity;
        document.getElementById('polarityValue').textContent = analysis.statistics.polarity;
        document.getElementById('subjectivityValue').textContent = analysis.statistics.subjectivity;

        // Update insights
        const insightsList = document.getElementById('keyInsights');
        insightsList.innerHTML = '';
        analysis.insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            insightsList.appendChild(li);
        });

        // Update charts
        this.updateCharts(analysis);
    }

    initializeCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        const textColor = isDark ? '#f5f5f5' : '#134252';
        const gridColor = isDark ? 'rgba(119, 124, 124, 0.3)' : 'rgba(94, 82, 64, 0.2)';

        // Sentiment Meter (Doughnut Chart)
        const sentimentCtx = document.getElementById('sentimentMeter').getContext('2d');
        this.charts.sentiment = new Chart(sentimentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [33, 34, 33],
                    backgroundColor: ['#1FB8CD', '#ECEBD5', '#B4413C'],
                    borderWidth: 2,
                    borderColor: isDark ? '#262828' : '#fcfcf9'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });

        // Emotion Analysis (Bar Chart)
        const emotionCtx = document.getElementById('emotionChart').getContext('2d');
        this.charts.emotion = new Chart(emotionCtx, {
            type: 'bar',
            data: {
                labels: ['Joy', 'Anger', 'Fear', 'Sadness', 'Surprise'],
                datasets: [{
                    label: 'Emotion Intensity',
                    data: [0.2, 0.1, 0.05, 0.15, 0.3],
                    backgroundColor: ['#FFC185', '#B4413C', '#5D878F', '#DB4545', '#D2BA4C'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });

        // Distribution Chart (Pie Chart)
        const distCtx = document.getElementById('distributionChart').getContext('2d');
        this.charts.distribution = new Chart(distCtx, {
            type: 'pie',
            data: {
                labels: ['Positive', 'Negative', 'Neutral'],
                datasets: [{
                    data: [40, 30, 30],
                    backgroundColor: ['#1FB8CD', '#B4413C', '#ECEBD5'],
                    borderWidth: 2,
                    borderColor: isDark ? '#262828' : '#fcfcf9'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });
    }

    updateCharts(analysis) {
        const score = analysis.sentiment.score;
        const absScore = Math.abs(score);
        
        // Update sentiment meter
        let positive = 0, negative = 0, neutral = 100;
        if (score > 0) {
            positive = absScore * 100;
            neutral = 100 - positive;
        } else if (score < 0) {
            negative = absScore * 100;
            neutral = 100 - negative;
        }

        this.charts.sentiment.data.datasets[0].data = [positive, neutral, negative];
        this.charts.sentiment.update();

        // Update emotion chart
        const emotionValues = Object.values(analysis.emotions);
        this.charts.emotion.data.datasets[0].data = emotionValues;
        this.charts.emotion.update();

        // Update distribution chart
        const confidence = analysis.sentiment.confidence;
        const distributionData = [
            score > 0 ? confidence * 100 : 0,
            score < 0 ? confidence * 100 : 0,
            100 - (Math.abs(score) * confidence * 100)
        ];
        this.charts.distribution.data.datasets[0].data = distributionData;
        this.charts.distribution.update();
    }

    saveToHistory() {
        if (this.currentAnalysis) {
            this.analysisHistory.unshift({
                ...this.currentAnalysis,
                id: Date.now()
            });
            
            // Limit history to 50 items
            if (this.analysisHistory.length > 50) {
                this.analysisHistory = this.analysisHistory.slice(0, 50);
            }
            
            alert('Analysis saved to history!');
        }
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.analysisHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>No analysis history yet. Start analyzing some text!</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.analysisHistory.map(item => `
            <div class="history-item card">
                <div class="card__body">
                    <div class="history-header-row">
                        <div class="history-timestamp">
                            ${new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div class="history-sentiment ${item.sentiment.label}">
                            <span>${item.sentiment.label}</span>
                            <span>${item.sentiment.score.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="history-text">${item.text}</div>
                    <div class="history-stats">
                        <small>
                            ${item.statistics.wordCount} words • 
                            Confidence: ${Math.round(item.sentiment.confidence * 100)}% • 
                            Processing: ${Math.round(item.processingTime)}ms
                        </small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    analyzeBatch() {
        const batchInput = document.getElementById('batchInput').value;
        const texts = batchInput.split('\n').filter(text => text.trim().length > 0);
        
        if (texts.length === 0) {
            alert('Please enter some text to analyze');
            return;
        }

        const resultsContainer = document.getElementById('batchResults');
        resultsContainer.innerHTML = '<div class="processing-indicator"><div class="processing-content"><div class="spinner"></div><span>Processing batch analysis...</span></div></div>';

        setTimeout(() => {
            const results = texts.map(text => this.performSentimentAnalysis(text.trim()));
            
            resultsContainer.innerHTML = results.map((result, index) => `
                <div class="batch-result-item card">
                    <div class="card__body">
                        <div class="batch-result-header">
                            <strong>Text ${index + 1}</strong>
                            <div class="batch-sentiment ${result.sentiment.label}">
                                <span>${result.sentiment.label}</span>
                                <span>${result.sentiment.score.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="batch-text-preview">${result.text}</div>
                        <div class="batch-stats">
                            <small>
                                ${result.statistics.wordCount} words • 
                                Confidence: ${Math.round(result.sentiment.confidence * 100)}%
                            </small>
                        </div>
                    </div>
                </div>
            `).join('');

            // Save batch results to history
            results.forEach(result => {
                result.timestamp = new Date().toISOString();
                result.processingTime = Math.random() * 800 + 200;
                this.analysisHistory.unshift({
                    ...result,
                    id: Date.now() + Math.random()
                });
            });
        }, 1500);
    }

    exportCurrentAnalysis() {
        if (!this.currentAnalysis) {
            alert('No analysis to export. Please analyze some text first.');
            return;
        }

        const dataStr = JSON.stringify(this.currentAnalysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `sentiment-analysis-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    exportHistory() {
        if (this.analysisHistory.length === 0) {
            alert('No history to export.');
            return;
        }

        const dataStr = JSON.stringify(this.analysisHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `sentiment-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all analysis history?')) {
            this.analysisHistory = [];
            this.renderHistory();
        }
    }

    loadSettings() {
        // Load settings from localStorage if available
        const savedSettings = localStorage.getItem('sentimentAnalyzerSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        // Apply settings to UI
        document.getElementById('realtimeToggle').checked = this.settings.realtime;
        document.getElementById('delaySlider').value = this.settings.delay;
        document.getElementById('delayValue').textContent = `${this.settings.delay}ms`;
        document.getElementById('confidenceToggle').checked = this.settings.showConfidence;
        document.getElementById('emotionToggle').checked = this.settings.showEmotion;

        // Save settings when changed
        const saveSettings = () => {
            localStorage.setItem('sentimentAnalyzerSettings', JSON.stringify(this.settings));
        };

        document.getElementById('realtimeToggle').addEventListener('change', saveSettings);
        document.getElementById('delaySlider').addEventListener('change', saveSettings);
        document.getElementById('confidenceToggle').addEventListener('change', saveSettings);
        document.getElementById('emotionToggle').addEventListener('change', saveSettings);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sentimentAnalyzer = new SentimentAnalyzer();
    
    // Add some initial guidance
    setTimeout(() => {
        console.log('🤖 AI Sentiment Analysis Dashboard Loaded!');
        console.log('💡 Try typing some text or click "Try Sample" to see the analysis in action.');
        console.log('🎨 Toggle between light and dark themes using the button in the header.');
        console.log('📊 Explore different tabs: Real-time Analysis, Batch Analysis, History, and Settings.');
    }, 1000);
});