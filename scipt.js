// Function to show different pages
function showPage(pageId) {
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(pageId).classList.add('active');

    // Add active class to clicked nav link
    event.target.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Optional: Add smooth page load animations
document.addEventListener('DOMContentLoaded', function() {
    console.log('Digital Twins website loaded successfully!');
    
    // You can add more initialization code here as needed
    // For example: lazy loading images, form validation, etc.
});