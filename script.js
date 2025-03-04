const gameFiles = [
    'eagler.html'
];

// Get the container where the buttons will go
const gameButtonsContainer = document.getElementById('game-buttons');

// Loop through the game files and create buttons
gameFiles.forEach(file => {
    const button = document.createElement('button');
    button.textContent = file.replace('.html', '').replace(/_/g, ' '); // Clean up file name (removes .html and replaces _ with spaces)
    button.onclick = () => {
        window.location.href = file; // Link to the game file
    };
    gameButtonsContainer.appendChild(button);
});
