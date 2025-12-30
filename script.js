// FIREBASE CONFIGURATION MOVED TO firebase-config.js

document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const backToTopBtn = document.getElementById('backToTop');
    const header = document.querySelector('header');
    
    // Auth Elements
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const userProfile = document.getElementById('userProfile');
    const guestMessage = document.getElementById('guestMessage');
    const userBalanceSection = document.getElementById('userBalanceSection');
    const userPointsDisplay = document.getElementById('userPoints');
    const userNameDisplay = document.getElementById('userName');

    // --- NAVIGATION LOGIC ---
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        else header.style.boxShadow = 'none';

        if (backToTopBtn) {
            if (window.scrollY > 300) backToTopBtn.style.display = 'block';
            else backToTopBtn.style.display = 'none';
        }

        let current = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= (sectionTop - 150)) current = section.getAttribute('id');
        });

        document.querySelectorAll('.nav-links a').forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('href').includes(current)) li.classList.add('active');
        });
    });

    // --- DYNAMIC CONTENT LOADING ---
    if (db) {
        db.collection("site_content").doc("home_hero").get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const heroTitle = document.getElementById('heroTitle');
                const heroDesc = document.getElementById('heroDesc');
                
                if (heroTitle && data.title) heroTitle.textContent = data.title;
                if (heroDesc && data.description) heroDesc.textContent = data.description;
            }
        }).catch((error) => {
            console.log("Error loading content:", error);
        });
    }

    // --- AUTHENTICATION LOGIC ---
    
    // Auth Mode Toggle
    let isLoginMode = true;
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleAuthMode = document.getElementById('toggleAuthMode');

    if(toggleAuthMode) {
        toggleAuthMode.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            if(isLoginMode) {
                modalTitle.textContent = "Prijava u RoboShop";
                submitBtn.textContent = "Prijavi se";
                toggleAuthMode.textContent = "Nemate račun? Registrirajte se";
            } else {
                modalTitle.textContent = "Registracija";
                submitBtn.textContent = "Registriraj se";
                toggleAuthMode.textContent = "Već imate račun? Prijavite se";
            }
        });
    }
    
    // Open/Close Modal
    if(loginBtn) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    if(closeModal) closeModal.addEventListener('click', () => loginModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == loginModal) loginModal.style.display = 'none';
    });

    // Handle Login/Register
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!auth) {
                alert("Firebase nije konfiguriran! Molimo postavite API ključeve u script.js");
                return;
            }

            if (isLoginMode) {
                // LOGIN
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        loginModal.style.display = 'none';
                        loginForm.reset();
                    })
                    .catch((error) => {
                        alert("Greška pri prijavi: " + error.message);
                    });
            } else {
                // REGISTER
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // Create user doc in Firestore
                        db.collection("users").doc(userCredential.user.uid).set({
                            name: email.split('@')[0],
                            points: 0,
                            email: email,
                            role: 'user' // Default role
                        });
                        loginModal.style.display = 'none';
                        loginForm.reset();
                        alert("Uspješna registracija! Dobrodošli u RoboShop.");
                    })
                    .catch((error) => {
                        alert("Greška pri registraciji: " + error.message);
                    });
            }
        });
    }

    // Handle Logout
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(auth) auth.signOut();
        });
    }

    // Auth State Observer
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                if(loginBtn) loginBtn.style.display = 'none';
                if(userProfile) userProfile.style.display = 'flex';
                if(guestMessage) guestMessage.style.display = 'none';
                if(userBalanceSection) userBalanceSection.style.display = 'block';
                
                // Get User Data from Firestore
                db.collection("users").doc(user.uid).onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        if(userNameDisplay) {
                            let displayText = data.name || user.email.split('@')[0];
                            if(data.currentModule) {
                                displayText += ` <span style="font-size:0.8em; color:var(--text-light); font-weight:normal;">(${data.currentModule})</span>`;
                            }
                            userNameDisplay.innerHTML = displayText;
                        }
                        if(userPointsDisplay) userPointsDisplay.textContent = data.points || 0;

                        // Check for Admin Role
                        if (data.role === 'admin') {
                            // Check if admin link already exists
                            if (!document.getElementById('adminLink')) {
                                const navLinks = document.querySelector('.nav-links');
                                const adminLink = document.createElement('a');
                                adminLink.id = 'adminLink';
                                adminLink.href = 'admin.html';
                                adminLink.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
                                adminLink.style.color = 'var(--secondary-color)';
                                // Insert before the login/profile section
                                if(navLinks) navLinks.insertBefore(adminLink, document.getElementById('loginBtn'));
                            }
                        } else {
                            // Remove admin link if role changes or not admin
                            const adminLink = document.getElementById('adminLink');
                            if (adminLink) adminLink.remove();
                        }
                    } else {
                        // Create user doc if not exists
                        db.collection("users").doc(user.uid).set({
                            name: user.email.split('@')[0],
                            points: 0,
                            email: user.email,
                            role: 'user'
                        });
                    }
                });

            } else {
                // User is signed out
                if(loginBtn) loginBtn.style.display = 'block';
                if(userProfile) userProfile.style.display = 'none';
                if(guestMessage) guestMessage.style.display = 'block';
                if(userBalanceSection) userBalanceSection.style.display = 'none';
                
                // Remove admin link
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.remove();
            }
        });
    }

    // --- SHOP LOGIC ---
    const shopGrid = document.getElementById('shopGrid');
    
    if (shopGrid) {
        // Load items from Firestore
        db.collection("shop_items").onSnapshot((snapshot) => {
            shopGrid.innerHTML = '';
            
            if(snapshot.empty) {
                shopGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;"><h3>Shop je trenutno prazan.</h3></div>';
                return;
            }

            snapshot.forEach((doc) => {
                const item = doc.data();
                const card = document.createElement('div');
                card.className = 'card shop-card';
                card.innerHTML = `
                    <div class="shop-image">
                        <i class="${item.icon || 'fas fa-box'}"></i>
                    </div>
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="shop-footer">
                        <div class="price"><i class="fas fa-coins"></i> ${item.price} RC</div>
                        <button class="btn btn-sm btn-shop" onclick="buyItem('${item.name}', ${item.price})">Kupi</button>
                    </div>
                `;
                shopGrid.appendChild(card);
            });
        });
    }

    // Buy Function (Global scope to be accessible from onclick)
    window.buyItem = function(itemName, price) {
        if (!auth || !auth.currentUser) {
            const loginModal = document.getElementById('loginModal');
            if(loginModal) loginModal.style.display = 'block';
            return;
        }

        if(!confirm(`Želite li kupiti ${itemName} za ${price} RC?`)) return;

        const userRef = db.collection("users").doc(auth.currentUser.uid);

        // Transaction to deduct points
        db.runTransaction((transaction) => {
            return transaction.get(userRef).then((userDoc) => {
                if (!userDoc.exists) throw "User does not exist!";
                
                const currentPoints = userDoc.data().points || 0;
                if (currentPoints < price) {
                    throw "Nedovoljno RoboCoina!";
                }

                transaction.update(userRef, { points: currentPoints - price });
                return currentPoints - price;
            });
        }).then((newBalance) => {
            alert(`Uspješno ste kupili: ${itemName}! Preostalo bodova: ${newBalance}`);
        }).catch((err) => {
            alert("Greška: " + err);
        });
    };

    // --- ADMIN HELPER ---
    // Run this in console to make yourself admin: makeMeAdmin()
    window.makeMeAdmin = function() {
        if (!auth.currentUser) {
            console.log("Morate biti prijavljeni!");
            return;
        }
        db.collection("users").doc(auth.currentUser.uid).update({
            role: 'admin'
        }).then(() => {
            console.log("Čestitamo! Sada ste Admin.");
            alert("Sada ste Admin! Osvježite stranicu.");
        }).catch((err) => {
            console.error("Greška:", err);
        });
    };

    // --- BOOKING FORM LOGIC ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const parentName = document.getElementById('parentName').value;
            const program = document.getElementById('program-select').value;
            
            if (!program) {
                alert("Molimo odaberite program!");
                return;
            }

            // Here you would typically send data to a server
            // For now, we'll just show a success message
            alert(`Hvala Vam, ${parentName}! Vaša prijava za "${program}" je uspješno zaprimljena. Kontaktirat ćemo vas uskoro.`);
            bookingForm.reset();
        });
    }

    // --- SHOP LOGIC ---
    const shopButtons = document.querySelectorAll('.btn-shop');
    shopButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!auth || !auth.currentUser) {
                loginModal.style.display = 'block';
                return;
            }

            const card = this.closest('.shop-card');
            const itemName = card.querySelector('h3').textContent;
            const priceText = card.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/\D/g, '')); // Extract number

            const userRef = db.collection("users").doc(auth.currentUser.uid);

            // Transaction to deduct points
            db.runTransaction((transaction) => {
                return transaction.get(userRef).then((userDoc) => {
                    if (!userDoc.exists) throw "User does not exist!";
                    
                    const currentPoints = userDoc.data().points || 0;
                    if (currentPoints < price) {
                        throw "Nedovoljno RoboCoina!";
                    }

                    transaction.update(userRef, { points: currentPoints - price });
                    return currentPoints - price;
                });
            }).then((newBalance) => {
                alert(`Uspješno ste kupili: ${itemName}! Preostalo bodova: ${newBalance}`);
            }).catch((err) => {
                alert("Greška: " + err);
            });
        });
    });

    // --- SCROLL ANIMATIONS ---
    const revealElements = document.querySelectorAll('.card, .section-title, .section-subtitle, .hero-buttons, .team-member, .map-container');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // --- MODULE DETAILS TOGGLE ---
    const toggleButtons = document.querySelectorAll('.toggle-details');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const details = this.nextElementSibling;
            details.classList.toggle('open');
            
            if (details.classList.contains('open')) {
                this.textContent = 'Manje';
            } else {
                this.textContent = 'Saznaj više';
            }
        });
    });

    // --- GALLERY LOAD MORE / LESS ---
    const loadMoreBtn = document.getElementById('loadMoreGallery');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const hiddenItems = document.querySelectorAll('.hidden-gallery-item');
            const isExpanded = this.getAttribute('data-expanded') === 'true';

            if (!isExpanded) {
                // SHOW ITEMS
                hiddenItems.forEach(item => {
                    item.style.display = 'block'; // Make visible in layout
                    
                    // Small delay to allow browser to register display:block before animating
                    setTimeout(() => {
                        item.classList.add('reveal');
                        item.classList.add('active');
                    }, 20);
                });
                
                this.textContent = 'Prikaži manje slika';
                this.setAttribute('data-expanded', 'true');
            } else {
                // HIDE ITEMS
                hiddenItems.forEach(item => {
                    item.classList.remove('active'); // Trigger fade out animation
                });

                // Wait for animation to finish (0.8s matches CSS transition)
                setTimeout(() => {
                    hiddenItems.forEach(item => {
                        item.style.display = 'none';
                        item.classList.remove('reveal');
                    });
                    
                    // Smooth scroll back to gallery title to prevent disorientation
                    const gallerySection = document.getElementById('galerija');
                    if (gallerySection) {
                        gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 800);

                this.textContent = 'Prikaži više slika';
                this.setAttribute('data-expanded', 'false');
            }
        });
    }
});
