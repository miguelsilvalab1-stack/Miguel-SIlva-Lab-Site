// ===========================================
// Supabase Configuration
// ===========================================
var SUPABASE_URL = 'https://nicgjddphjevcvsfdtmr.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pY2dqZGRwaGpldmN2c2ZkdG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTg2MTAsImV4cCI6MjA4NjA3NDYxMH0.Bcn8vJ9S6cTdPl1J2XfWf-2YrswYonM73FBBimQLIC8';

var SUPABASE_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
};

// Call an edge function (for sync/ingest operations)
function supabaseFn(functionName, options) {
    var url = SUPABASE_URL + '/functions/v1/' + functionName;
    var config = Object.assign({}, options || {});
    config.headers = Object.assign({}, SUPABASE_HEADERS, config.headers || {});
    return fetch(url, config);
}

// Read from a Supabase table via REST API
function supabaseQuery(table, queryParams, extraHeaders) {
    var url = SUPABASE_URL + '/rest/v1/' + table + '?' + queryParams;
    var headers = Object.assign({}, SUPABASE_HEADERS, extraHeaders || {});
    return fetch(url, { headers: headers });
}

// ===========================================
// HTML sanitization - prevent XSS from Supabase data
// ===========================================
function decodeHtmlEntities(str) {
    if (!str) return '';
    var textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function sanitizeUrl(url) {
    if (!url) return '#';
    var trimmed = url.trim();
    // Only allow http(s) URLs
    if (trimmed.indexOf('https://') === 0 || trimmed.indexOf('http://') === 0) {
        return escapeHtml(trimmed);
    }
    return '#';
}

// ===========================================
// Mobile Menu Toggle
// ===========================================
var mobileMenuBtn = document.getElementById('mobileMenuBtn');
var navLinks = document.querySelector('.nav-links');
var mobileMenuIcon = mobileMenuBtn.querySelector('i');

mobileMenuBtn.addEventListener('click', function() {
    var isOpen = navLinks.classList.toggle('active');
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    mobileMenuIcon.classList.toggle('fa-bars', !isOpen);
    mobileMenuIcon.classList.toggle('fa-times', isOpen);
});

navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuIcon.classList.add('fa-bars');
        mobileMenuIcon.classList.remove('fa-times');
    });
});

// ===========================================
// Navbar scroll effect
// ===========================================
window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===========================================
// FAQ Accordion
// ===========================================
document.querySelectorAll('.faq-question').forEach(function(button) {
    button.addEventListener('click', function() {
        var faqItem = button.parentElement;
        var isActive = faqItem.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(function(item) {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            faqItem.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});

// ===========================================
// Contact Form - via Supabase send-contact-email
// ===========================================
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    var form = this;
    var submitBtn = form.querySelector('.submit-btn');
    var originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = 'A enviar... <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
    submitBtn.disabled = true;

    var phoneEl = form.querySelector('#phone');
    var serviceEl = form.querySelector('#service');
    var payload = {
        name: form.querySelector('#name').value,
        email: form.querySelector('#email').value,
        phone: phoneEl ? phoneEl.value : '',
        service: serviceEl ? serviceEl.value : '',
        message: form.querySelector('#message').value
    };

    supabaseFn('send-contact-email', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(function(response) {
        if (response.ok) {
            submitBtn.innerHTML = 'Mensagem enviada! <i class="fas fa-check" aria-hidden="true"></i>';
            submitBtn.style.background = '#16a34a';
            form.reset();

            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        } else {
            throw new Error('Erro no envio');
        }
    })
    .catch(function() {
        // Fallback to mailto
        var mailtoLink = 'mailto:miguelsilvalab1@gmail.com?subject=Contacto de ' +
            encodeURIComponent(payload.name) + '&body=' +
            encodeURIComponent(payload.message) + '%0A%0ADe: ' +
            encodeURIComponent(payload.email);

        window.location.href = mailtoLink;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// ===========================================
// Blog Posts - read from substack_articles table
// ===========================================
function loadBlogPosts(page) {
    var blogContainer = document.getElementById('blogContainer');
    var prevBtn = document.getElementById('blogPrevBtn');
    var nextBtn = document.getElementById('blogNextBtn');
    var pageSize = 3;
    var currentPage = typeof page === 'number' ? page : 0;

    // First, trigger a sync in background (fire-and-forget)
    supabaseFn('fetch-substack', { method: 'POST' }).catch(function() {});

    if (blogContainer) {
        blogContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>A carregar artigos...</p></div>';
    }

    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = true;

    supabaseQuery('substack_articles', 'select=title,excerpt,link,read_time,published_at&order=published_at.desc&limit=' + pageSize + '&offset=' + (currentPage * pageSize))
    .then(function(response) {
        if (!response.ok) throw new Error('Erro ao carregar artigos');
        return response.json();
    })
    .then(function(posts) {
        if (!posts || posts.length === 0) {
            blogContainer.innerHTML = '<p style="text-align:center;color:var(--text-light);">Sem artigos de momento.</p>';
            if (prevBtn) prevBtn.disabled = currentPage === 0;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        blogContainer.innerHTML = posts.map(function(post) {
            var title = escapeHtml(decodeHtmlEntities(post.title));
            var excerpt = escapeHtml(decodeHtmlEntities(post.excerpt));
            var link = sanitizeUrl(post.link);
            var readTime = escapeHtml(post.read_time) || '3 min';

            var dateDisplay = readTime + ' de leitura';
            if (post.published_at) {
                try {
                    var d = new Date(post.published_at);
                    dateDisplay = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
                } catch(e) {}
            }

            return '<div class="blog-card">' +
                '<div class="blog-meta">' +
                    '<i class="far fa-clock"></i>' +
                    '<span>' + dateDisplay + '</span>' +
                '</div>' +
                '<div class="blog-content">' +
                    '<h3>' + title + '</h3>' +
                    '<p>' + excerpt + '</p>' +
                    '<a href="' + link + '" class="read-more" target="_blank" rel="noopener noreferrer">' +
                        'Ler artigo <i class="fas fa-arrow-right"></i>' +
                    '</a>' +
                '</div>' +
            '</div>';
        }).join('');

        reobserveCards();

        if (prevBtn) prevBtn.disabled = currentPage === 0;
        if (nextBtn) nextBtn.disabled = posts.length < pageSize;

        // store current page
        window.__blogPage = currentPage;
    })
    .catch(function(err) {
        console.error('Erro blog:', err);
        blogContainer.innerHTML = '<p style="text-align:center;color:var(--text-light);">Erro ao carregar artigos. <a href="#" onclick="loadBlogPosts(0);return false;" style="color:var(--secondary-blue);">Tentar novamente</a></p>';
        if (prevBtn) prevBtn.disabled = currentPage === 0;
        if (nextBtn) nextBtn.disabled = true;
    });
}
// ===========================================
// AI News - sync via edge function + read from ai_news table
// ===========================================
function loadAINews(showRefreshFeedback) {
    var newsContainer = document.getElementById('newsContainer');
    var refreshBtn = document.getElementById('refreshNewsBtn');

    if (showRefreshFeedback && refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A atualizar...';
        refreshBtn.disabled = true;
    }

    // Step 1: If refresh was clicked, call edge function to sync new articles first, then read
    // If initial load, just read from the table directly
    var syncPromise;
    if (showRefreshFeedback) {
        syncPromise = supabaseFn('fetch-ai-news', { method: 'POST' })
            .then(function() { return true; })
            .catch(function() { return true; }); // continue even if sync fails
    } else {
        syncPromise = Promise.resolve(true);
    }

    syncPromise.then(function() {
        // Step 2: Read the latest articles from the ai_news table
        return supabaseQuery('ai_news', 'select=title,excerpt,link,source,published_at&order=published_at.desc&limit=3');
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Erro ao ler notícias');
        return response.json();
    })
    .then(function(articles) {
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p style="text-align:center;color:var(--text-light);">Sem notícias de momento.</p>';
            resetRefreshBtn(refreshBtn);
            return;
        }

        newsContainer.innerHTML = articles.map(function(item) {
            var source = escapeHtml(decodeHtmlEntities(item.source)) || 'IA';
            var title = escapeHtml(decodeHtmlEntities(item.title));
            var excerpt = escapeHtml(decodeHtmlEntities(item.excerpt));
            var link = sanitizeUrl(item.link);
            var timeDisplay = formatRelativeTime(item.published_at);

            return '<div class="news-card">' +
                '<div class="news-source">' +
                    '<i class="far fa-newspaper"></i>' +
                    '<span>' + source + '</span>' +
                '</div>' +
                '<h3>' + title + '</h3>' +
                '<p>' + excerpt + '</p>' +
                '<div class="news-time">' + timeDisplay + '</div>' +
                '<a href="' + link + '" class="read-more" target="_blank" rel="noopener noreferrer">' +
                    'Ler mais <i class="fas fa-external-link-alt"></i>' +
                '</a>' +
            '</div>';
        }).join('');

        reobserveCards();
        resetRefreshBtn(refreshBtn);
    })
    .catch(function(err) {
        console.error('Erro notícias:', err);
        newsContainer.innerHTML =
            '<p style="text-align:center;color:var(--text-light);">' +
            'Não foi possível carregar notícias. <a href="#" onclick="loadAINews(true);return false;" style="color:var(--secondary-blue);">Tentar novamente</a>' +
            '</p>';
        resetRefreshBtn(refreshBtn);
    });
}

function resetRefreshBtn(btn) {
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar notícias';
        btn.disabled = false;
    }
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    try {
        var date = new Date(dateStr);
        var now = new Date();
        var diffMs = now - date;
        var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        var diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Agora mesmo';
        if (diffHours < 24) return 'Há ' + diffHours + (diffHours === 1 ? ' hora' : ' horas');
        if (diffDays < 7) return 'Há ' + diffDays + (diffDays === 1 ? ' dia' : ' dias');

        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    } catch(e) {
        return dateStr;
    }
}

// ===========================================
// Re-observe dynamically loaded cards for animations
// ===========================================
function reobserveCards() {
    document.querySelectorAll('.blog-card, .news-card').forEach(function(el) {
        if (!el.dataset.observed) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
            el.dataset.observed = 'true';
        }
    });
}

// ===========================================
// Refresh news button
// ===========================================
var refreshBtn = document.getElementById('refreshNewsBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
        loadAINews(true);
    });
}

// ===========================================
// Load content on page load
// ===========================================
window.addEventListener('load', function() {
    loadBlogPosts(0);
    loadAINews(false);

    var prevBtn = document.getElementById('blogPrevBtn');
    var nextBtn = document.getElementById('blogNextBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            var page = window.__blogPage || 0;
            if (page > 0) loadBlogPosts(page - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var page = window.__blogPage || 0;
            loadBlogPosts(page + 1);
        });
    }
});

// ===========================================
// Smooth scroll for internal navigation links
// ===========================================
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        // Skip lone "#" (logo link) and empty hrefs
        if (!href || href === '#') return;

        var target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================================
// Animate elements on scroll
// ===========================================
var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .blog-card, .news-card, .portfolio-card').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===========================================
// Dynamic copyright year
// ===========================================
var yearEl = document.getElementById('currentYear');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// ===========================================
// Announcement Bar - close button + layout adjustment
// ===========================================
var closeAnnouncementBtn = document.getElementById('closeAnnouncement');
var announcementBar = document.getElementById('announcementBar');

function adjustHeroMargin() {
    var hero = document.querySelector('.hero');
    var navbar = document.getElementById('navbar');
    if (!hero || !navbar) return;
    var navbarHeight = navbar.offsetHeight;
    if (announcementBar && !announcementBar.classList.contains('hidden')) {
        var barHeight = announcementBar.offsetHeight;
        // Push navbar below the sticky announcement bar to avoid overlap
        navbar.style.top = barHeight + 'px';
        hero.style.marginTop = (navbarHeight + barHeight) + 'px';
    } else {
        navbar.style.top = '0px';
        hero.style.marginTop = navbarHeight + 'px';
    }
}

if (closeAnnouncementBtn && announcementBar) {
    closeAnnouncementBtn.addEventListener('click', function() {
        announcementBar.classList.add('hidden');
        adjustHeroMargin();
    });
}

// Adjust on load
adjustHeroMargin();

// Adjust on resize
window.addEventListener('resize', adjustHeroMargin);

// ===========================================
// Announcement Bar - email registration form
// ===========================================
var announcementForm = document.getElementById('announcementForm');
if (announcementForm) {
    announcementForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = announcementForm.querySelector('input[name="announcement_email"]');
        var submitBtn = announcementForm.querySelector('.announcement-form-btn');
        var originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = 'A registar... <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        submitBtn.disabled = true;

        var emailValue = emailInput.value;

        // Save lead + send notification email in parallel
        Promise.all([
            supabaseFn('save-lead', {
                method: 'POST',
                body: JSON.stringify({ email: emailValue, source: 'formacoes_curtas_online' })
            }),
            supabaseFn('send-contact-email', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Registo — Formações Curtas Online',
                    email: emailValue,
                    phone: '',
                    service: 'formacoes-curtas',
                    message: 'Novo registo de interesse nas Formações Curtas em IA Generativa (100% Online).\n\nO utilizador ' + emailValue + ' quer ser notificado quando as datas forem anunciadas.'
                })
            })
        ])
        .then(function(responses) {
            if (responses[0].ok || responses[1].ok) {
                submitBtn.innerHTML = 'Registado! <i class="fas fa-check" aria-hidden="true"></i>';
                submitBtn.style.background = '#16a34a';
                submitBtn.style.color = 'white';
                emailInput.value = '';
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                }, 4000);
            } else {
                throw new Error('Erro');
            }
        })
        .catch(function() {
            submitBtn.innerHTML = 'Erro — tente novamente';
            submitBtn.style.background = '#dc2626';
            submitBtn.style.color = 'white';
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.style.color = '';
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

// ===========================================
// Service card notify form (Formações Curtas)
// ===========================================
var serviceNotifyForm = document.getElementById('serviceNotifyForm');
if (serviceNotifyForm) {
    serviceNotifyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = serviceNotifyForm.querySelector('input[name="service_notify_email"]');
        var submitBtn = serviceNotifyForm.querySelector('.service-notify-btn');
        var originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = 'A registar... <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        submitBtn.disabled = true;

        var emailValue = emailInput.value;

        Promise.all([
            supabaseFn('save-lead', {
                method: 'POST',
                body: JSON.stringify({ email: emailValue, source: 'formacoes_curtas_online' })
            }),
            supabaseFn('send-contact-email', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Registo — Formações Curtas Online',
                    email: emailValue,
                    phone: '',
                    service: 'formacoes-curtas',
                    message: 'Novo registo de interesse nas Formações Curtas em IA Generativa (100% Online).\n\nO utilizador ' + emailValue + ' quer ser notificado quando as datas forem anunciadas.'
                })
            })
        ])
        .then(function(responses) {
            if (responses[0].ok || responses[1].ok) {
                submitBtn.innerHTML = 'Registado! <i class="fas fa-check" aria-hidden="true"></i>';
                submitBtn.style.background = '#16a34a';
                emailInput.value = '';
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 4000);
            } else {
                throw new Error('Erro');
            }
        })
        .catch(function() {
            submitBtn.innerHTML = 'Erro — tente novamente';
            submitBtn.style.background = '#dc2626';
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}


// ===========================================
// Testimonials slider
// ===========================================
(function() {
    var slider = document.querySelector('.testimonials-slider');
    if (!slider) return;
    var cards = Array.prototype.slice.call(slider.querySelectorAll('.testimonial-card'));
    if (!cards.length) return;
    var index = 0;
    var autoTimer;

    function visibleCount() {
        if (window.matchMedia('(max-width: 768px)').matches) return 1;
        if (window.matchMedia('(max-width: 1200px)').matches) return 2;
        return 3;
    }

    function show(i) {
        var visible = visibleCount();
        cards.forEach(function(card, idx) {
            var inWindow = false;
            for (var k = 0; k < visible; k++) {
                if (idx === (i + k) % cards.length) {
                    inWindow = true;
                    break;
                }
            }
            card.classList.toggle('active', inWindow);
        });
    }

    function next() {
        index = (index + 1) % cards.length;
        show(index);
    }

    function prev() {
        index = (index - 1 + cards.length) % cards.length;
        show(index);
    }

    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(next, 10000);
    }

    show(index);
    startAuto();

    var prevBtn = document.getElementById('testimonialPrevBtn');
    var nextBtn = document.getElementById('testimonialNextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prev();
            startAuto();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            next();
            startAuto();
        });
    }

    window.addEventListener('resize', function() {
        show(index);
    });
})();

// ===========================================
// Cookie Banner
// ===========================================
var cookieBanner = document.getElementById('cookieBanner');
var acceptCookiesBtn = document.getElementById('acceptCookies');

if (cookieBanner && acceptCookiesBtn) {
    // Check if user already accepted
    if (localStorage.getItem('cookiesAccepted') === 'true') {
        cookieBanner.classList.add('hidden');
    }

    acceptCookiesBtn.addEventListener('click', function() {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieBanner.classList.add('hidden');
    });
}

// ===========================================
// Lead Magnet Form
// ===========================================
var leadMagnetForm = document.getElementById('leadMagnetForm');
if (leadMagnetForm) {
    leadMagnetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = leadMagnetForm.querySelector('input[name="lead_email"]');
        var submitBtn = leadMagnetForm.querySelector('.lead-magnet-btn');
        var originalText = submitBtn.innerHTML;
        var email = emailInput.value;

        submitBtn.innerHTML = 'A enviar... <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        submitBtn.disabled = true;

        // Send via Supabase edge function (fire and forget for now)
        supabaseFn('save-lead', {
            method: 'POST',
            body: JSON.stringify({ email: email, source: 'lead_magnet_guide' })
        })
        .then(function(response) {
            if (response.ok) {
                // Open the PDF guide in a new tab
                var a = document.createElement('a'); a.href = 'guia-5-formas-ia.pdf'; a.download = 'Guia-5-Formas-IA-Miguel-Silva-Lab.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                submitBtn.innerHTML = 'Guia aberto! <i class="fas fa-check" aria-hidden="true"></i>';
                submitBtn.style.background = '#16a34a';
                submitBtn.style.color = 'white';
                emailInput.value = '';
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                }, 4000);
            } else {
                throw new Error('Erro');
            }
        })
        .catch(function() {
            // Show error and offer mailto fallback
            submitBtn.innerHTML = 'Erro — tente novamente <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>';
            submitBtn.style.background = '#dc2626';
            submitBtn.style.color = 'white';
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.style.color = '';
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

// ===========================================
// AI Chat Assistant
// ===========================================
(function() {
    // DOM references
    var chatWidget = document.getElementById('chatWidget');
    var chatClose = document.getElementById('chatClose');
    var chatMessages = document.getElementById('chatMessages');
    var chatInput = document.getElementById('chatInput');
    var chatSend = document.getElementById('chatSend');
    var chatQuickActions = document.getElementById('chatQuickActions');
    var openChatFromContact = document.getElementById('openChatFromContact');
    var chatBlock = document.getElementById('chatBlock');
    var chatBlockDesc = document.getElementById('chatBlockDesc');
    var chatInlineContainer = document.getElementById('chatInlineContainer');

    if (!chatWidget || !chatBlock) return;

    // Move the chat widget into the inline container
    chatInlineContainer.appendChild(chatWidget);

    // State
    var isOpen = false;
    var isLoading = false;
    var conversationHistory = [];
    var hasShownWelcome = false;

    var welcomeMessage = 'Olá! 👋 Sou o assistente IA do Miguel Silva Lab. Posso ajudá-lo com informações sobre serviços, responder a dúvidas sobre IA ou ajudar a agendar uma conversa. Como posso ajudar?';

    // --- Open/Close chat inline ---
    function openChat() {
        isOpen = true;
        chatInlineContainer.classList.add('active');
        chatBlock.classList.add('expanded');
        chatWidget.classList.add('open');
        chatWidget.setAttribute('aria-hidden', 'false');
        openChatFromContact.style.display = 'none';
        chatBlockDesc.style.display = 'none';

        if (!hasShownWelcome) {
            appendMessage('bot', welcomeMessage);
            hasShownWelcome = true;
        }

        setTimeout(function() {
            chatInput.focus();
        }, 300);
    }

    function closeChat() {
        isOpen = false;
        chatWidget.classList.remove('open');
        chatWidget.setAttribute('aria-hidden', 'true');
        chatInlineContainer.classList.remove('active');
        chatBlock.classList.remove('expanded');
        openChatFromContact.style.display = '';
        chatBlockDesc.style.display = '';
        openChatFromContact.focus();
    }

    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    // --- Send message ---
    function sendMessage(text) {
        if (!text || !text.trim() || isLoading) return;

        var cleanText = text.trim();

        // Hide quick actions after first user message
        if (chatQuickActions) {
            chatQuickActions.style.display = 'none';
        }

        // Add user message to UI and history
        appendMessage('user', cleanText);
        conversationHistory.push({ role: 'user', content: cleanText });

        // Clear input
        chatInput.value = '';
        chatSend.disabled = true;

        // Show typing indicator
        showTyping();
        isLoading = true;
        chatInput.disabled = true;

        // Call edge function
        supabaseFn('chat-assistant', {
            method: 'POST',
            body: JSON.stringify({
                messages: conversationHistory
            })
        })
        .then(function(response) {
            if (!response.ok) throw new Error('Chat error: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            hideTyping();
            var reply = data.reply || 'Desculpe, ocorreu um erro. Tente novamente.';
            appendMessage('bot', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        })
        .catch(function(err) {
            console.error('Chat error:', err);
            hideTyping();
            appendMessage('bot', 'Desculpe, não foi possível processar a sua mensagem. Pode contactar-nos diretamente:\n\n- Email: miguelsilvalab1@gmail.com\n- WhatsApp: [+351 914 912 126](https://wa.me/351914912126)\n- Agendar reunião: [Calendly](https://calendly.com/miguel-rubus/30min)');
        })
        .finally(function() {
            isLoading = false;
            chatInput.disabled = false;
            chatInput.focus();
        });
    }

    // --- Append message to chat UI ---
    function appendMessage(sender, text) {
        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message chat-message-' + sender;

        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        if (sender === 'bot') {
            bubble.innerHTML = formatBotMessage(text);
        } else {
            bubble.textContent = text;
        }

        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Format bot messages (markdown-like to HTML) ---
    function formatBotMessage(text) {
        // Escape HTML first (XSS prevention)
        var escaped = escapeHtml(text);

        // Convert markdown links [text](url) to <a> tags
        escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, function(match, label, url) {
            return '<a href="' + sanitizeUrl(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
        });

        // Convert **bold** to <strong>
        escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Convert line breaks
        escaped = escaped.replace(/\n/g, '<br>');

        // Convert bullet points (- item)
        escaped = escaped.replace(/(^|<br>)- /g, '$1• ');

        return escaped;
    }

    // --- Typing indicator ---
    function showTyping() {
        var typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message chat-message-bot';
        typingDiv.id = 'chatTyping';

        var dots = document.createElement('div');
        dots.className = 'chat-typing';
        dots.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';

        typingDiv.appendChild(dots);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        var typingEl = document.getElementById('chatTyping');
        if (typingEl) {
            typingEl.remove();
        }
    }

    // --- Event listeners ---
    if (chatClose) {
        chatClose.addEventListener('click', closeChat);
    }

    if (openChatFromContact) {
        openChatFromContact.addEventListener('click', function() {
            openChat();
        });
    }

    if (chatSend) {
        chatSend.addEventListener('click', function() {
            sendMessage(chatInput.value);
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(chatInput.value);
            }
        });

        chatInput.addEventListener('input', function() {
            chatSend.disabled = !chatInput.value.trim();
        });
    }

    // --- Orientation flow within chat ---
    var orientSteps = {
        '0': {
            q: 'Em que situação se encontra?',
            opts: [
                { text: 'Represento uma empresa e quero formar a minha equipa', next: '1a' },
                { text: 'Represento uma instituição de ensino ou centro de formação', next: '1b' },
                { text: 'Sou profissional e quero desenvolver as minhas competências em IA', next: '1c' },
                { text: 'Quero perceber como a IA pode melhorar o meu negócio', next: '1d' }
            ]
        },
        '1a': {
            q: 'Qual é o principal objetivo da formação?',
            opts: [
                { text: 'Aumentar a produtividade e eficiência da equipa com ferramentas de IA', result: 'formacao-empresas' },
                { text: 'Capacitar a direção para liderar a transformação com IA', result: 'formacao-empresas-dir' }
            ]
        },
        '1b': {
            q: 'O que está a procurar?',
            opts: [
                { text: 'Incluir módulos de IA no meu catálogo de formação', result: 'formacao-inst' },
                { text: 'Contratar um formador certificado para programas co-financiados', result: 'formacao-inst' }
            ]
        },
        '1c': {
            q: 'O que prefere?',
            opts: [
                { text: 'Acompanhamento personalizado ao longo do tempo', result: 'mentoria' },
                { text: 'Curso curto e intensivo sobre uma ferramenta específica', result: 'cursos' }
            ]
        },
        '1d': {
            q: 'Qual é o seu ponto de partida?',
            opts: [
                { text: 'Ainda não sei bem por onde começar — preciso de um diagnóstico', result: 'consultoria' },
                { text: 'Já tenho algumas ideias e quero orientação para as executar', result: 'mentoria' }
            ]
        }
    };

    var orientResults = {
        'formacao-empresas': {
            title: 'Formação para Empresas',
            desc: 'Formação prática em IA para equipas, desenhada à medida do seu negócio. Elegível para financiamento europeu.',
            primary: { text: 'Saber mais', href: 'formacao-empresas.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'formacao-empresas-dir': {
            title: 'Formação para Direção',
            desc: 'Formação estratégica em IA para decisores — para liderar a transformação com conhecimento e confiança.',
            primary: { text: 'Saber mais', href: 'formacao-empresas.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'formacao-inst': {
            title: 'Formação para Instituições',
            desc: 'Colaboro como formador certificado (CCP) em entidades acreditadas. Módulos prontos a integrar em programas co-financiados.',
            primary: { text: 'Saber mais', href: 'formacao-instituicoes.html' },
            secondary: { text: 'Entrar em contacto', href: '#contacto' }
        },
        'mentoria': {
            title: 'Mentoria Individual',
            desc: 'Acompanhamento personalizado para decisores que querem aplicar IA com método e resultados concretos.',
            primary: { text: 'Ver planos de mentoria', href: 'mentoria.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'cursos': {
            title: 'Cursos Curtos Online',
            desc: 'Formações intensivas em ferramentas específicas de IA generativa. Brevemente disponíveis.',
            primary: { text: 'Ver cursos em preparação', href: 'formacoes-curtas.html' },
            secondary: { text: 'Entrar em contacto', href: '#contacto' }
        },
        'consultoria': {
            title: 'Consultoria Estratégica',
            desc: 'Diagnóstico e plano de ação personalizado para o seu negócio. A conversa inicial de 30 minutos é gratuita.',
            primary: { text: 'Pedir diagnóstico gratuito', href: '#contacto' },
            secondary: { text: 'Como funciona', href: 'consultoria-estrategica.html' }
        }
    };

    function showOrientStep(stepId) {
        var step = orientSteps[stepId];
        if (!step) return;

        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message chat-message-bot';

        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        var qEl = document.createElement('p');
        qEl.style.marginBottom = '10px';
        qEl.style.fontWeight = '600';
        qEl.textContent = step.q;
        bubble.appendChild(qEl);

        var optsDiv = document.createElement('div');
        optsDiv.className = 'chat-orient-opts';

        step.opts.forEach(function(opt) {
            var btn = document.createElement('button');
            btn.className = 'chat-orient-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', function() {
                appendMessage('user', opt.text);
                optsDiv.querySelectorAll('.chat-orient-btn').forEach(function(b) {
                    b.disabled = true;
                    b.style.opacity = '0.45';
                });
                setTimeout(function() {
                    if (opt.next) { showOrientStep(opt.next); }
                    else if (opt.result) { showOrientResult(opt.result); }
                }, 300);
            });
            optsDiv.appendChild(btn);
        });

        bubble.appendChild(optsDiv);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showOrientResult(key) {
        var r = orientResults[key];
        if (!r) return;

        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message chat-message-bot';

        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML =
            '<p style="font-weight:700;margin-bottom:6px;">A nossa recomendação: ' + escapeHtml(r.title) + '</p>' +
            '<p style="margin-bottom:12px;">' + escapeHtml(r.desc) + '</p>' +
            '<div class="chat-orient-result-btns">' +
            '<a href="' + escapeHtml(r.primary.href) + '" class="chat-orient-result-btn">' + escapeHtml(r.primary.text) + '</a>' +
            '<a href="' + escapeHtml(r.secondary.href) + '" class="chat-orient-result-btn chat-orient-result-btn-sec">' + escapeHtml(r.secondary.text) + '</a>' +
            '</div>';

        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Quick action buttons
    document.querySelectorAll('.chat-quick-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var type = btn.getAttribute('data-type');
            if (type === 'orient') {
                if (chatQuickActions) chatQuickActions.style.display = 'none';
                if (!hasShownWelcome) {
                    appendMessage('bot', welcomeMessage);
                    hasShownWelcome = true;
                }
                showOrientStep('0');
                return;
            }
            var msg = btn.getAttribute('data-message');
            if (msg) sendMessage(msg);
        });
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            closeChat();
        }
    });
})();

// ===========================================
// (Orientation Agent integrado no chat acima)
// ===========================================
(function() {
    var trigger = null;
    var widget  = null;
    if (!trigger || !widget) return;

    var results = {
        'formacao-empresas': {
            title: 'Formação para Empresas',
            desc: 'Formação prática em IA para equipas, desenhada à medida do seu negócio. Elegível para financiamento europeu.',
            primary: { text: 'Saber mais', href: 'formacao-empresas.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'formacao-empresas-dir': {
            title: 'Formação para Direção',
            desc: 'Formação estratégica em IA para decisores — para liderar a transformação com conhecimento e confiança.',
            primary: { text: 'Saber mais', href: 'formacao-empresas.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'formacao-inst': {
            title: 'Formação para Instituições',
            desc: 'Colaboro como formador certificado (CCP) em entidades acreditadas. Módulos prontos a integrar em programas co-financiados.',
            primary: { text: 'Saber mais', href: 'formacao-instituicoes.html' },
            secondary: { text: 'Entrar em contacto', href: '#contacto' }
        },
        'mentoria': {
            title: 'Mentoria Individual',
            desc: 'Acompanhamento personalizado para decisores que querem aplicar IA com método e resultados concretos.',
            primary: { text: 'Ver planos de mentoria', href: 'mentoria.html' },
            secondary: { text: 'Agendar conversa gratuita', href: '#contacto' }
        },
        'cursos': {
            title: 'Cursos Curtos Online',
            desc: 'Formações intensivas em ferramentas específicas de IA generativa. Brevemente disponíveis.',
            primary: { text: 'Ver cursos em preparação', href: 'formacoes-curtas.html' },
            secondary: { text: 'Entrar em contacto', href: '#contacto' }
        },
        'consultoria': {
            title: 'Consultoria Estratégica',
            desc: 'Diagnóstico e plano de ação personalizado para o seu negócio. A conversa inicial de 30 minutos é gratuita.',
            primary: { text: 'Pedir diagnóstico gratuito', href: '#contacto' },
            secondary: { text: 'Como funciona', href: 'consultoria-estrategica.html' }
        }
    };

    function showStep(id) {
        var steps = body.querySelectorAll('.orient-step');
        steps.forEach(function(s) { s.classList.remove('active'); });
        var el = document.getElementById('orientStep' + id);
        if (el) el.classList.add('active');
    }

    function showResult(key) {
        var r = results[key];
        if (!r) return;
        var steps = body.querySelectorAll('.orient-step');
        steps.forEach(function(s) { s.classList.remove('active'); });
        var resultEl = document.getElementById('orientResult');
        resultEl.style.display = 'block';
        resultEl.innerHTML =
            '<h4>A nossa recomendação</h4>' +
            '<p>' + r.desc + '</p>' +
            '<div class="orient-result-btns">' +
            '<a href="' + r.primary.href + '" class="orient-result-btn">' + r.primary.text + '</a>' +
            '<a href="' + r.secondary.href + '" class="orient-result-btn secondary">' + r.secondary.text + '</a>' +
            '</div>' +
            '<button class="orient-restart" id="orientRestart">← Recomeçar</button>';
        document.getElementById('orientRestart').addEventListener('click', function() {
            resultEl.style.display = 'none';
            showStep('0');
        });
    }

    function open() {
        widget.classList.add('open');
        widget.setAttribute('aria-hidden', 'false');
        showStep('0');
    }

    function close() {
        widget.classList.remove('open');
        widget.setAttribute('aria-hidden', 'true');
    }

    trigger.addEventListener('click', function() {
        if (widget.classList.contains('open')) { close(); } else { open(); }
    });
    closeBtn.addEventListener('click', close);

    body.addEventListener('click', function(e) {
        var btn = e.target.closest('.orient-btn');
        if (!btn) return;
        var next   = btn.getAttribute('data-next');
        var result = btn.getAttribute('data-result');
        if (result) { showResult(result); }
        else if (next) { showStep(next); }
    });
})();
