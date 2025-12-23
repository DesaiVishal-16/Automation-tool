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
    const langSelect = document.getElementById('language-select');

    // Translations
    const translations = {
        english: {
            automationTitle: '<i class="fas fa-cogs icon"></i> Automation Tools',
            automationInfo: '<i class="fas fa-info-circle icon"></i> Please upload a PDF document first to enable automation tools',
            mcqBtn: '<i class="fas fa-tasks icon"></i> Generate MCQs from lesson',
            summaryBtn: '<i class="fas fa-align-left icon"></i> Summarize lecture',
            rubricBtn: '<i class="fas fa-table icon"></i> Create assignment rubric',
            resultTitle: 'Result',
            copyBtn: '<i class="fas fa-copy"></i> Copy',
            copiedBtn: '<i class="fas fa-check"></i> Copied!',
            processing: 'Processing...',
            generatingMcqs: 'Generating MCQs...',
            summarizing: 'Summarizing...',
            creatingRubric: 'Creating Rubric...'
        },
        hindi: {
            automationTitle: '<i class="fas fa-cogs icon"></i> स्वचालन उपकरण',
            automationInfo: '<i class="fas fa-info-circle icon"></i> स्वचालन उपकरण सक्षम करने के लिए कृपया पहले एक पीडीएफ अपलोड करें',
            mcqBtn: '<i class="fas fa-tasks icon"></i> पाठ से एमसीक्यू उत्पन्न करें',
            summaryBtn: '<i class="fas fa-align-left icon"></i> व्याख्यान का सारांश दें',
            rubricBtn: '<i class="fas fa-table icon"></i> असाइनमेंट रूब्रिक बनाएं',
            resultTitle: 'परिणाम',
            copyBtn: '<i class="fas fa-copy"></i> कॉपी करें',
            copiedBtn: '<i class="fas fa-check"></i> कॉपी हो गया!',
            processing: 'प्रसंस्करण...',
            generatingMcqs: 'एमसीक्यू उत्पन्न कर रहा है...',
            summarizing: 'सारांशित कर रहा है...',
            creatingRubric: 'रूब्रिक बना रहा है...'
        },
        marathi: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ऑटोमेशन टूल्स',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ऑटोमेशन टूल्स सक्षम करण्यासाठी कृपया प्रथम पीडीएफ अपलोड करा',
            mcqBtn: '<i class="fas fa-tasks icon"></i> पाठातून एमसीक्यू तयार करा',
            summaryBtn: '<i class="fas fa-align-left icon"></i> व्याख्यानाचा सारांश द्या',
            rubricBtn: '<i class="fas fa-table icon"></i> असाइनमेंट रुब्रिक तयार करा',
            resultTitle: 'निकाल',
            copyBtn: '<i class="fas fa-copy"></i> कॉपी करा',
            copiedBtn: '<i class="fas fa-check"></i> कॉपी केले!',
            processing: 'प्रक्रिया करत आहे...',
            generatingMcqs: 'एमसीक्यू तयार करत आहे...',
            summarizing: 'सारांश देत आहे...',
            creatingRubric: 'रुब्रिक तयार करत आहे...'
        },
        bengali: {
            automationTitle: '<i class="fas fa-cogs icon"></i> অটোমেশন টুলস',
            automationInfo: '<i class="fas fa-info-circle icon"></i> অটোমেশন টুলস সক্ষম করতে প্রথমে একটি পিডিএফ আপলোড করুন',
            mcqBtn: '<i class="fas fa-tasks icon"></i> পাঠ থেকে এমসিকিউ তৈরি করুন',
            summaryBtn: '<i class="fas fa-align-left icon"></i> লেকচার সারসংক্ষেপ করুন',
            rubricBtn: '<i class="fas fa-table icon"></i> অ্যাসাইনমেন্ট রুব্রিক তৈরি করুন',
            resultTitle: 'ফলাফল',
            copyBtn: '<i class="fas fa-copy"></i> কপি করুন',
            copiedBtn: '<i class="fas fa-check"></i> কপি করা হয়েছে!',
            processing: 'প্রসেসিং হচ্ছে...',
            generatingMcqs: 'এমসিকিউ তৈরি হচ্ছে...',
            summarizing: 'সারসংক্ষেপ করা হচ্ছে...',
            creatingRubric: 'রুব্রিক তৈরি হচ্ছে...'
        },
        tamil: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ஆட்டோமேஷன் கருவிகள்',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ஆட்டோமேஷன் கருவிகளை இயக்க முதலில் PDF ஐப் பதிவேற்றவும்',
            mcqBtn: '<i class="fas fa-tasks icon"></i> பாடத்திலிருந்து MCQ களை உருவாக்கவும்',
            summaryBtn: '<i class="fas fa-align-left icon"></i> விரிவுரையைச் சுരുக்கவும்',
            rubricBtn: '<i class="fas fa-table icon"></i> ஒதுக்கீடு ரூப்ரிக் உருவாக்கவும்',
            resultTitle: 'முடிவு',
            copyBtn: '<i class="fas fa-copy"></i> நகலெடு',
            copiedBtn: '<i class="fas fa-check"></i> நகலெடுக்கப்பட்டது!',
            processing: 'செயலாக்கப்படுகிறது...',
            generatingMcqs: 'MCQ கள் உருவாக்கப்படுகின்றன...',
            summarizing: 'சுருக்கப்படுகிறது...',
            creatingRubric: 'ரூப்ரிக் உருவாக்கப்படுகிறது...'
        },
        telugu: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ఆటోమేషన్ టూల్స్',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ఆటోమేషన్ టూల్స్ ఎనేబుల్ చేయడానికి దయచేసి ముందుగా PDFని అప్‌లోడ్ చేయండి',
            mcqBtn: '<i class="fas fa-tasks icon"></i> పాఠం నుండి MCQలను రూపొందించండి',
            summaryBtn: '<i class="fas fa-align-left icon"></i> ఉపన్యాసాన్ని సంగ్రహించండి',
            rubricBtn: '<i class="fas fa-table icon"></i> అసైన్‌మెంట్ రూబ్రిక్‌ను సృష్టించండి',
            resultTitle: 'ఫలితం',
            copyBtn: '<i class="fas fa-copy"></i> కాపీ చేయండి',
            copiedBtn: '<i class="fas fa-check"></i> కాపీ చేయబడింది!',
            processing: 'ప్రాసెస్ అవుతోంది...',
            generatingMcqs: 'MCQలు రూపొందించబడుతున్నాయి...',
            summarizing: 'సంగ్రహిస్తోంది...',
            creatingRubric: 'రూబ్రిక్ సృష్టించబడుతోంది...'
        },
        kannada: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ಆಟೊಮೇಷನ್ ಪರಿಕರಗಳು',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ಆಟೊಮೇಷನ್ ಪರಿಕರಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ದಯವಿಟ್ಟು ಮೊದಲು PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
            mcqBtn: '<i class="fas fa-tasks icon"></i> ಪಾಠದಿಂದ MCQಗಳನ್ನು ರಚಿಸಿ',
            summaryBtn: '<i class="fas fa-align-left icon"></i> ಉಪನ್ಯಾಸವನ್ನು ಸಾರಾಂಶಗೊಳಿಸಿ',
            rubricBtn: '<i class="fas fa-table icon"></i> ಅಸೈನ್‌ಮೆಂಟ್ ರೂಬ್ರಿಕ್ ರಚಿಸಿ',
            resultTitle: 'ಫಲಿತಾಂಶ',
            copyBtn: '<i class="fas fa-copy"></i> ಕಾಪಿ ಮಾಡಿ',
            copiedBtn: '<i class="fas fa-check"></i> ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!',
            processing: 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
            generatingMcqs: 'MCQಗಳನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...',
            summarizing: 'ಸಾರಾಂಶಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
            creatingRubric: 'ರೂಬ್ರಿಕ್ ರಚಿಸಲಾಗುತ್ತಿದೆ...'
        },
        gujarati: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ઓટોમેશન ટૂલ્સ',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ઓટોમેશન ટૂલ્સ સક્ષમ કરવા માટે કૃપા કરીને પહેલા PDF અપલોਡ કરો',
            mcqBtn: '<i class="fas fa-tasks icon"></i> પાઠમાંથી MCQ બનાવો',
            summaryBtn: '<i class="fas fa-align-left icon"></i> વ્યાખ્યાનનો સારાંશ આપો',
            rubricBtn: '<i class="fas fa-table icon"></i> અસાઇનમેન્ટ રૂબ્રિક બનાવો',
            resultTitle: 'પરિણામ',
            copyBtn: '<i class="fas fa-copy"></i> કોપી કરો',
            copiedBtn: '<i class="fas fa-check"></i> કોપી થઈ ગયું!',
            processing: 'પ્રોસેસિંગ...',
            generatingMcqs: 'MCQ બનાવી રહ્યા છીએ...',
            summarizing: 'સારાંશ આપી રહ્યા છીએ...',
            creatingRubric: 'રૂબ્રિક બનાવી રહ્યા છીએ...'
        },
        malayalam: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ഓട്ടോമേഷൻ ടൂളുകൾ',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ഓട്ടോമേഷൻ ടൂളുകൾ പ്രവർത്തനക്ഷമമാക്കാൻ ദയവായി ആദ്യം ഒരു PDF അപ്‌ലോഡ് ചെയ്യുക',
            mcqBtn: '<i class="fas fa-tasks icon"></i> പാഠത്തിൽ നിന്ന് MCQ-കൾ സൃഷ്ടിക്കുക',
            summaryBtn: '<i class="fas fa-align-left icon"></i> പ്രഭാഷണം സംഗ്രഹിക്കുക',
            rubricBtn: '<i class="fas fa-table icon"></i> അസൈൻമെന്റ് റੂബ്രിക് സൃഷ്ടിക്കുക',
            resultTitle: 'ഫലം',
            copyBtn: '<i class="fas fa-copy"></i> കോപ്പി ചെയ്യുക',
            copiedBtn: '<i class="fas fa-check"></i> കോപ്പി ചെയ്തു!',
            processing: 'പ്രോസസ്സ് ചെയ്യുന്നു...',
            generatingMcqs: 'MCQ-കൾ സൃഷ്ടിക്കുന്നു...',
            summarizing: 'സംഗ്രഹിക്കുന്നു...',
            creatingRubric: 'റൂബ്രിക് സൃഷ്ടിക്കുന്നു...'
        },
        punjabi: {
            automationTitle: '<i class="fas fa-cogs icon"></i> ਆਟੋਮੇਸ਼ਨ ਟੂਲਸ',
            automationInfo: '<i class="fas fa-info-circle icon"></i> ਆਟੋਮੇਸ਼ਨ ਟੂਲਸ ਨੂੰ ਸਮਰੱਥ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਇੱਕ PDF ਅਪਲੋਡ ਕਰੋ',
            mcqBtn: '<i class="fas fa-tasks icon"></i> ਪਾਠ ਤੋਂ MCQ ਤਿਆਰ ਕਰੋ',
            summaryBtn: '<i class="fas fa-align-left icon"></i> ਲੈਕਚਰ ਦਾ ਸਾਰ ਦਿਓ',
            rubricBtn: '<i class="fas fa-table icon"></i> ਅਸਾਈਨਮੈਂਟ ਰੂਬਰਿਕ ਬਣਾਓ',
            resultTitle: 'ਨਤੀਜਾ',
            copyBtn: '<i class="fas fa-copy"></i> ਕਾਪੀ ਕਰੋ',
            copiedBtn: '<i class="fas fa-check"></i> ਕਾਪੀ ਹੋ ਗਿਆ!',
            processing: 'ਪ੍ਰੋਸੈਸਿੰਗ...',
            generatingMcqs: 'MCQ ਤਿਆਰ ਕੀਤੇ ਜਾ ਰਹੇ ਹਨ...',
            summarizing: 'ਸਾਰ ਦਿੱਤਾ ਜਾ ਰਿਹਾ ਹੈ...',
            creatingRubric: 'ਰੂਬਰਿਕ ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...'
        }
    };

    // State
    let selectedFile = null;
    let isPdfUploaded = false;
    let currentLanguage = 'english';

    // Language Selection
    langSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateUITranslations();
    });

    function updateUITranslations() {
        const t = translations[currentLanguage];
        
        // Update section titles
        document.querySelector('.automation-section h2').innerHTML = t.automationTitle;
        
        // Update buttons
        mcqBtn.innerHTML = t.mcqBtn;
        summaryBtn.innerHTML = t.summaryBtn;
        rubricBtn.innerHTML = t.rubricBtn;
        
        // Update messages
        automationInfo.innerHTML = t.automationInfo;
        
        // Update result section
        resultTitle.textContent = t.resultTitle;
        copyBtn.innerHTML = t.copyBtn;
    }

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
    mcqBtn.addEventListener('click', () => {
        const t = translations[currentLanguage];
        handleAutomation('mcq', t.resultTitle, t.generatingMcqs);
    });
    
    summaryBtn.addEventListener('click', () => {
        const t = translations[currentLanguage];
        handleAutomation('summary', t.resultTitle, t.summarizing);
    });
    
    rubricBtn.addEventListener('click', () => {
        const t = translations[currentLanguage];
        handleAutomation('rubric', t.resultTitle, t.creatingRubric);
    });

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: currentLanguage })
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
