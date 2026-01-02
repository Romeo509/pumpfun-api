// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');
    
    // Set the first section as active by default
    document.getElementById('create-coin-section').classList.add('active-section');
    document.querySelector('.nav-item[data-section="create-coin"]').classList.add('active');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            sections.forEach(section => {
                section.classList.remove('active-section');
                section.classList.add('inactive-section');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(`${sectionId}-section`);
            targetSection.classList.remove('inactive-section');
            targetSection.classList.add('active-section');
        });
    });
    
    // Form functionality
    const createForm = document.getElementById('createCoinForm');
    const buyForm = document.getElementById('buyCoinForm');
    
    // Create Coin Form
    createForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(createForm);
        
        // Extract values
        const name = formData.get('name');
        const symbol = formData.get('symbol');
        const description = formData.get('description');
        const twitter = formData.get('twitter');
        const telegram = formData.get('telegram');
        const website = formData.get('website');
        const imageFile = document.getElementById('image').files[0];
        const privateKey = formData.get('privateKey');
        const amount = parseFloat(formData.get('amount'));
        
        // Validate required fields
        if (!name || !symbol || !imageFile || !privateKey || isNaN(amount)) {
            showResponse({ success: false, message: 'Please fill in all required fields.' }, 'error', 'create');
            return;
        }
        
        try {
            // Show loading state
            const submitButton = createForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.querySelector('.btn-text').textContent = 'Creating Coin...';
            document.getElementById('responseBox').classList.add('loading');
            
            // Convert image file to base64
            const imageBase64 = await fileToBase64(imageFile);
            
            // Prepare request payload
            const payload = {
                name,
                symbol,
                description: description || undefined,
                twitter: twitter || undefined,
                telegram: telegram || undefined,
                website: website || undefined,
                image: imageBase64,
                privateKey,
                amount
            };
            
            // Call the API
            const response = await fetch('http://localhost:3000/api/create-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            // Show response
            showResponse(result, result.success ? 'success' : 'error', 'create');
        } catch (error) {
            console.error('Error:', error);
            showResponse({ 
                success: false, 
                message: `Error: ${error.message || 'An unexpected error occurred'}` 
            }, 'error', 'create');
        } finally {
            // Reset loading state
            const submitButton = createForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.querySelector('.btn-text').textContent = 'Create Coin';
            document.getElementById('responseBox').classList.remove('loading');
        }
    });
    
    // Buy Coin Form
    buyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Extract values
        const mintAddress = document.getElementById('mintAddress').value;
        const privateKey = document.getElementById('buyPrivateKey').value;
        const amount = parseFloat(document.getElementById('buyAmount').value);
        
        // Validate required fields
        if (!mintAddress || !privateKey || isNaN(amount)) {
            showResponse({ success: false, message: 'Please fill in all required fields.' }, 'error', 'buy');
            return;
        }
        
        try {
            // Show loading state
            const submitButton = buyForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.querySelector('.btn-text').textContent = 'Buying Coin...';
            document.getElementById('buyResponseBox').classList.add('loading');
            
            // Prepare request payload
            const payload = {
                mintAddress,
                privateKey,
                amount
            };
            
            // Call the API
            const response = await fetch('http://localhost:3000/api/buy-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            // Show response
            showResponse(result, result.success ? 'success' : 'error', 'buy');
        } catch (error) {
            console.error('Error:', error);
            showResponse({ 
                success: false, 
                message: `Error: ${error.message || 'An unexpected error occurred'}` 
            }, 'error', 'buy');
        } finally {
            // Reset loading state
            const submitButton = buyForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.querySelector('.btn-text').textContent = 'Buy Coin';
            document.getElementById('buyResponseBox').classList.remove('loading');
        }
    });
    
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/jpeg;base64,") to get just the base64 string
                const base64String = reader.result.split(',')[1];
                const mimeType = file.type;
                resolve(`data:${mimeType};base64,${base64String}`);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    function showResponse(data, type, formType = 'create') {
        let responseBox, responseContent;
        
        if (formType === 'create') {
            responseBox = document.getElementById('responseBox');
            responseContent = document.getElementById('responseContent');
        } else if (formType === 'buy') {
            responseBox = document.getElementById('buyResponseBox');
            responseContent = document.getElementById('buyResponseContent');
        }
        
        // Clear previous classes
        responseBox.classList.remove('error', 'success');
        
        // Add appropriate class based on type
        if (type) {
            responseBox.classList.add(type);
        }
        
        // Format and display the response
        responseContent.textContent = JSON.stringify(data, null, 2);
    }
    
    // File upload preview
    const fileInput = document.getElementById('image');
    const fileLabel = document.querySelector('.file-upload-label');
    
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            fileLabel.querySelector('.file-upload-text').textContent = fileName;
        } else {
            fileLabel.querySelector('.file-upload-text').textContent = 'Choose Image';
        }
    });
});