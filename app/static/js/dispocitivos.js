document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const deviceList = document.getElementById('device-list');
    const addButton = document.getElementById('add-button');
    const formContainer = document.getElementById('form-container');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const notification = document.getElementById('notification');
    
    // Show form when clicking add button
    addButton.addEventListener('click', function() {
        formContainer.style.display = 'block';
        addButton.style.display = 'none';
    });
    
    // Hide form when clicking cancel
    cancelButton.addEventListener('click', function() {
        formContainer.style.display = 'none';
        addButton.style.display = 'block';
        clearForm();
    });
    
    // Save new device
    saveButton.addEventListener('click', function() {
        const name = document.getElementById('device-name').value;
        const date = document.getElementById('registration-date').value;
        const type = document.getElementById('device-type').value;
        
        if (name && date && type) {
            addDeviceRow(name, formatDate(date), type);
            formContainer.style.display = 'none';
            addButton.style.display = 'block';
            clearForm();
            showNotification("Dispositivo agregado exitosamente");
        } else {
            alert('Por favor complete todos los campos');
        }
    });
    
    // Add a row with device data
    function addDeviceRow(name, date, type) {
        const row = document.createElement('tr');
        
        // Create and fill cells
        const nameCell = document.createElement('td');
        nameCell.textContent = name;
        
        const dateCell = document.createElement('td');
        dateCell.textContent = date;
        
        const typeCell = document.createElement('td');
        typeCell.textContent = type;
        
        const toggleCell = document.createElement('td');
        toggleCell.innerHTML = `
            <label class="toggle">
                <input type="checkbox">
                <span class="slider"></span>
            </label>
        `;
        
        // Append cells to row
        row.appendChild(nameCell);
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(toggleCell);
        
        // Add row to table
        deviceList.appendChild(row);
        
        // Add event listener to checkbox
        const checkbox = toggleCell.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            console.log('Toggle changed:', this.checked);
        });
    }
    
    // Show notification
    function showNotification(message) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // Format date to DD/MM/YYYY
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    // Clear form fields
    function clearForm() {
        document.getElementById('device-name').value = '';
        document.getElementById('registration-date').value = '';
        document.getElementById('device-type').value = '';
    }
});