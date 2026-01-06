document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.email-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function() {
            alert("Thank you! Your message has been sent successfully.");
            setTimeout(() => {
                contactForm.reset();
            }, 500);
        });
    }

    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.backgroundColor = '#1a252f';
        } else {
            nav.style.backgroundColor = '#2c3e50';
        }
    });
});