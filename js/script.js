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

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMessage = document.getElementById('error-message');
    
    // Credenciais válidas
    const validEmail = 'adm@zapbot.com';
    const validPassword = 'adm123';
    
    if (email === validEmail && password === validPassword) {
        // Login bem-sucedido
        errorMessage.style.display = 'none';
        
        // Salvar credenciais se "Lembrar senha" estiver marcado
        if (remember) {
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);
        } else {
            localStorage.removeItem('savedEmail');
            localStorage.removeItem('savedPassword');
        }
        
        // Depuração - mostrar que o login foi bem-sucedido
        console.log('Login bem-sucedido! Redirecionando...');
        
        // Garantir que as credenciais estejam armazenadas antes de redirecionar
        localStorage.setItem('loggedIn', 'true');
        
        // Redirecionar para o dashboard usando caminho relativo correto
        window.location.href = 'dashboard.html';
    } else {
        // Login falhou
        errorMessage.textContent = 'Email ou senha incorretos!';
        errorMessage.style.display = 'block';
    }
}); 