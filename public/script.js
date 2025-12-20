document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const pdfInput = document.getElementById('pdf-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadError = document.getElementById('upload-error');
    const uploadSuccess = document.getElementById('upload-success');
    const pdfDetails = document.getElementById('pdf-details');
    
    const automationInfo = document.getElementById('automation-info');
    const mcqBtn = document.getElementById('mcq-btn');
    const summaryBtn = document.getElementById('summary-btn');
    const rubricBtn = document.getElementById('rubric-btn');
    const actionError = document.getElementById('action-error');
    const resultContainer = document.getElementById('result-container');
    const resultTitle = document.getElementById('result-title');
    const resultContent = document.getElementById('result-content');
    const copyBtn = document.getElementById('copy-btn');

    // State
    let selectedFile = null;
    let isPdfUploaded = false;

    // File Selection
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                showError(uploadError, 'Please select a PDF file');
                selectedFile = null;
                fileInfo.classList.add('hidden');
                uploadBtn.disabled = true;
                return;
            }

            selectedFile = file;
            fileName.textContent = file.name;
            fileSize.textContent = `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            fileInfo.classList.remove('hidden');
            uploadError.classList.add('hidden');
            uploadBtn.disabled = false;
        }
    });

    // Upload Handler
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        setLoading(uploadBtn, true, 'Processing...');
        uploadError.classList.add('hidden');
        uploadSuccess.classList.add('hidden');

        const formData = new FormData();
        formData.append('pdf', selectedFile);

        try {
            const response = await fetch('/upload-pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            // Success
            isPdfUploaded = true;
            showPdfDetails(data.info);
            
            // Wait a few seconds before enabling tools to avoid immediate rate limit
            setTimeout(() => {
                enableAutomationTools();
            }, 5000);
            
            // Reset file input
            selectedFile = null;
            pdfInput.value = '';
            fileInfo.classList.add('hidden');
            uploadBtn.disabled = true;

        } catch (err) {
            showError(uploadError, err.message);
        } finally {
            setLoading(uploadBtn, false, 'Upload & Process', '<i class="fas fa-cloud-upload-alt icon"></i>');
        }
    });

    // Automation Handlers
    mcqBtn.addEventListener('click', () => handleAutomation('mcq', 'Generate MCQs', 'Generating MCQs...'));
    summaryBtn.addEventListener('click', () => handleAutomation('summary', 'Summarize Lecture', 'Summarizing...'));
    rubricBtn.addEventListener('click', () => handleAutomation('rubric', 'Create Rubric', 'Creating Rubric...'));

    async function handleAutomation(type, title, loadingText) {
        if (!isPdfUploaded) return;

        const btn = type === 'mcq' ? mcqBtn : type === 'summary' ? summaryBtn : rubricBtn;
        const originalHtml = btn.innerHTML;
        
        setLoading(btn, true, loadingText);
        actionError.classList.add('hidden');
        resultContainer.classList.add('hidden');

        try {
            const endpoint = `/${type}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.details && data.details.includes('rate_limit_exceeded')) {
                    throw new Error('OpenAI Free Tier Rate Limit (3 requests/min) reached. The server tried to retry, but it is still busy. Please wait 1-2 minutes and try again.');
                }
                throw new Error(data.error || `Failed to ${type}`);
            }

            if (!data.answer || data.answer.trim().length < 10) {
                throw new Error('The AI generated an empty or too short response. Please try again or check if the PDF has readable text.');
            }

            displayResult(title, data.answer);

        } catch (err) {
            showError(actionError, err.message);
        } finally {
            setLoading(btn, false, title, originalHtml.split('</i>')[0] + '</i>');
        }
    }

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const text = resultContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    });

    // Helper Functions
    function setLoading(btn, isLoading, text, iconHtml = '') {
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin icon"></i> ${text}`;
        } else {
            btn.innerHTML = `${iconHtml} ${text}`;
        }
    }

    function showError(element, message) {
        element.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        element.classList.remove('hidden');
    }

    function showPdfDetails(info) {
        uploadSuccess.classList.remove('hidden');
        pdfDetails.innerHTML = `
            <div class="detail-item"><strong>Filename:</strong> ${info.filename}</div>
            <div class="detail-item"><strong>Status:</strong> Ready for Automation</div>
        `;
    }

    function enableAutomationTools() {
        mcqBtn.disabled = false;
        summaryBtn.disabled = false;
        rubricBtn.disabled = false;
        automationInfo.classList.add('hidden');
    }

    function displayResult(title, content) {
        resultContainer.classList.remove('hidden');
        resultTitle.textContent = title;
        resultContent.textContent = content;
        
        // Scroll to result
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
