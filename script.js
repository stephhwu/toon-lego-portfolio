// Function to load images into grid cells
function loadImages() {
    const gridCells = document.querySelectorAll('.grid-cell');
    
    gridCells.forEach((cell, index) => {
        const imageNumber = index + 1;
        const span = cell.querySelector('span');
        
        // Create image element
        const img = document.createElement('img');
        img.src = `images/${imageNumber}.png`;
        img.alt = `Spaceship ${imageNumber}`;
        
        // Handle image load success
        img.onload = function() {
            // Remove the number span and add the image
            if (span) {
                span.remove();
            }
            cell.appendChild(img);
        };
        
        // Handle image load error (keep the number if image doesn't exist)
        img.onerror = function() {
            console.log(`Image ${imageNumber}.png not found, keeping number`);
        };
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadImages);