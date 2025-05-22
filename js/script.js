// Verificar se existem credenciais salvas
window.addEventListener('load', function() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberCheckbox = document.getElementById('remember');
    
    if (savedEmail && savedPassword) {
        document.getElementById('email').value = savedEmail;
        document.getElementById('password').value = savedPassword;
        rememberCheckbox.checked = true;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.querySelector('.login-button');
    const togglePassword = document.querySelector('.toggle-password');

    // Elementos do modal de recuperação
    const recoveryModal = document.getElementById('recoveryModal');
    const recoveryForm = document.getElementById('recoveryForm');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const recoveryEmailError = document.getElementById('recoveryEmailError');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const closeModal = document.querySelector('.close-modal');

    // Validação em tempo real do email
    emailInput.addEventListener('input', function() {
        validateEmail(this.value);
    });

    // Validação em tempo real da senha
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
    });

    // Toggle visibilidade da senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Validação do formulário de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail(emailInput.value);
        const isPasswordValid = validatePassword(passwordInput.value);

        if (isEmailValid && isPasswordValid) {
            // Simular envio do formulário
            loginButton.classList.add('loading');
            
            // Simular requisição ao servidor
            setTimeout(() => {
                // Aqui você faria a requisição real ao servidor
                if (emailInput.value === 'adm@zapbot.com' && passwordInput.value === 'adm123') {
                    // Sempre armazenar o email para identificação do usuário
                    localStorage.setItem('savedEmail', emailInput.value);
                    localStorage.setItem('loggedIn', 'true');
                    
                    // Salvar a senha apenas se "Lembrar senha" estiver marcado
                    if (document.getElementById('remember').checked) {
                        localStorage.setItem('savedPassword', passwordInput.value);
                    } else {
                        localStorage.removeItem('savedPassword');
                    }
                    
                    // Redirecionar para o dashboard
                    window.location.href = '../pages/dashboard.html';
                } else {
                    showError('Email ou senha incorretos');
                    loginButton.classList.remove('loading');
                }
            }, 1500);
        }
    });

    // Validação do formulário de recuperação
    recoveryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateEmail(recoveryEmail.value)) {
            // Simular envio do formulário
            const button = this.querySelector('button');
            button.classList.add('loading');
            
            // Simular requisição ao servidor
            setTimeout(() => {
                showRecoverySuccess();
                button.classList.remove('loading');
            }, 1500);
        }
    });

    // Abrir modal de recuperação
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        recoveryModal.style.display = 'block';
    });

    // Fechar modal de recuperação
    closeModal.addEventListener('click', function() {
        recoveryModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === recoveryModal) {
            recoveryModal.style.display = 'none';
        }
    });

    // Funções de validação
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        if (!isValid) {
            emailError.textContent = 'Digite um email válido';
            emailError.classList.add('show');
            return false;
        } else {
            emailError.classList.remove('show');
            return true;
        }
    }

    function validatePassword(password) {
        if (password.length < 6) {
            passwordError.textContent = 'A senha deve ter pelo menos 6 caracteres';
            passwordError.classList.add('show');
            return false;
        } else {
            passwordError.classList.remove('show');
            return true;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Esconder mensagem após 3 segundos
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    function showRecoverySuccess() {
        const modalContent = recoveryModal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close-modal">&times;</span>
            <h2>Email Enviado!</h2>
            <p>Verifique sua caixa de entrada para as instruções de recuperação de senha.</p>
            <button class="recovery-button" onclick="closeRecoveryModal()">OK</button>
        `;
        
        // Adicionar novo evento de fechamento
        const newCloseModal = modalContent.querySelector('.close-modal');
        newCloseModal.addEventListener('click', closeRecoveryModal);
    }

    function closeRecoveryModal() {
        recoveryModal.style.display = 'none';
        // Restaurar formulário original
        recoveryModal.querySelector('.modal-content').innerHTML = `
            <span class="close-modal">&times;</span>
            <h2>Recuperar Senha</h2>
            <p>Digite seu email para receber as instruções de recuperação de senha.</p>
            <form id="recoveryForm">
                <div class="input-group">
                    <div class="input-wrapper">
                        <i class="fas fa-envelope input-icon"></i>
                        <input type="email" id="recoveryEmail" placeholder="Email" required>
                        <span class="input-focus-border"></span>
                    </div>
                    <span class="error-text" id="recoveryEmailError"></span>
                </div>
                <button type="submit" class="recovery-button">
                    <span class="button-text">Enviar</span>
                    <div class="button-loader"></div>
                </button>
            </form>
        `;
    }
}); 