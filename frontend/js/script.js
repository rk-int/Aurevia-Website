// Config
const API_URL = '';

// Global State
let cart = JSON.parse(localStorage.getItem('aurixa_cart')) || [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initCart();
    initChat();
    updateCartCount();
    
    // Load products on index page
    if (document.getElementById('products-container')) {
        loadProducts();
    }
    
    // Init contact form
    if (document.getElementById('contact-form')) {
        initContactForm();
    }
    
    // Init checkout page
    if (document.getElementById('checkout-items')) {
        renderCheckout();
    }
});

// --- Scroll Animations (Intersection Observer) ---
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once visible
                // observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// --- Cart Management ---
function initCart() {
    const cartBtn = document.querySelector('.cart-icon-btn');
    const closeBtn = document.querySelector('.close-cart-btn');
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (cartBtn && drawer && overlay) {
        cartBtn.addEventListener('click', () => {
            drawer.classList.add('open');
            overlay.classList.add('show');
            renderCart();
        });
        
        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('show');
        });
        
        overlay.addEventListener('click', () => {
            drawer.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

function updateCartCount() {
    const countSpan = document.querySelector('.cart-count');
    if (countSpan) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countSpan.textContent = totalItems;
    }
    localStorage.setItem('aurixa_cart', JSON.stringify(cart));
}

function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartCount();
    
    // Show drawer automatically when adding
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
        drawer.classList.add('open');
        overlay.classList.add('show');
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartCount();
    renderCart();
    if (document.getElementById('checkout-items')) {
        renderCheckout();
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    if (!container || !totalEl) return;
    
    container.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalEl.textContent = '$0.00';
        return;
    }
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <button onclick="removeFromCart(${item.id})" style="background:none;border:none;cursor:pointer;color:#999;font-size:1.2rem;">&times;</button>
        `;
        container.appendChild(div);
    });
    
    totalEl.textContent = `$${total.toFixed(2)}`;
}

// --- Fetch Products ---
async function loadProducts() {
    const container = document.getElementById('products-container');
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        products.forEach(p => {
            const el = document.createElement('div');
            el.className = 'product-card fade-in';
            el.innerHTML = `
                <img src="${p.image_url}" alt="${p.name}" class="product-image">
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">$${p.price.toFixed(2)}</div>
                <button class="btn btn-gold" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
            `;
            container.appendChild(el);
        });
        
        // Re-initialize observer for new dynamic elements
        initScrollAnimations();
    } catch (err) {
        console.error("Failed to load products:", err);
        container.innerHTML = '<p>Failed to load collection. Please try again later.</p>';
    }
}

// --- Chat Concierge ---
function initChat() {
    const fab = document.getElementById('chat-fab');
    const win = document.getElementById('chat-window');
    const close = document.getElementById('chat-close');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    
    if (!fab || !win) return;
    
    fab.addEventListener('click', () => {
        win.classList.toggle('open');
    });
    
    close.addEventListener('click', () => {
        win.classList.remove('open');
    });
    
    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        addMessageToChat('user', text);
        input.value = '';
        
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            addMessageToChat('bot', data.response);
        } catch (err) {
            addMessageToChat('bot', 'Apologies, our concierge is currently unavailable.');
        }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function addMessageToChat(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

// --- Contact Form ---
function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.textContent = 'Sending...';
        btn.disabled = true;
        
        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        try {
            const res = await fetch(`${API_URL}/contact-submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            status.textContent = result.message;
            status.style.color = 'var(--champagne-gold)';
            form.reset();
        } catch (err) {
            status.textContent = 'Failed to send inquiry. Please try again.';
            status.style.color = 'red';
        } finally {
            btn.textContent = 'Send Inquiry';
            btn.disabled = false;
        }
    });
}

// --- Checkout Logic ---
function renderCheckout() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    if (!container || !totalEl) return;
    
    container.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalEl.textContent = '$0.00';
        document.getElementById('pay-btn').disabled = true;
        return;
    }
    
    document.getElementById('pay-btn').disabled = false;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.marginBottom = '1rem';
        div.style.paddingBottom = '1rem';
        div.style.borderBottom = '1px solid var(--light-gray)';
        div.innerHTML = `
            <div>
                <h4 style="font-family: var(--font-heading)">${item.name}</h4>
                <div style="color: #666; font-size: 0.9rem">Qty: ${item.quantity}</div>
            </div>
            <div style="font-weight: 500">$${(item.price * item.quantity).toFixed(2)}</div>
        `;
        container.appendChild(div);
    });
    
    totalEl.textContent = `$${total.toFixed(2)}`;
}

async function processPayment() {
    const btn = document.getElementById('pay-btn');
    const status = document.getElementById('payment-status');
    
    btn.textContent = 'Processing...';
    btn.disabled = true;
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    try {
        const res = await fetch(`${API_URL}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: cart, total: total })
        });
        const data = await res.json();
        
        status.textContent = data.message;
        status.style.color = 'var(--champagne-gold)';
        
        // Clear cart
        cart = [];
        updateCartCount();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    } catch (err) {
        status.textContent = 'Payment failed. Please try again.';
        status.style.color = 'red';
        btn.textContent = 'Complete Purchase';
        btn.disabled = false;
    }
}
