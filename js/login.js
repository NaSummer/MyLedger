document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginErrorMessage = document.getElementById('login-error-message');
    const registerErrorMessage = document.getElementById('register-error-message');
    const registerSuccessMessage = document.getElementById('register-success-message');

    function validateInput(email, password, nickname = 'Guest') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const nicknameRagex = /^.{1,20}$/; //1~20文字の文字列
        const passwordRegex = /^[a-zA-Z0-9_]{3,30}$/; // for test 3~30文字で、英字、数字、アンダースコア()のみ
        // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // パスワード：最低8文字で、少なくとも1つの英字と1つの数字を含む必要があります
        return emailRegex.test(email) && nicknameRagex.test(nickname) && passwordRegex.test(password);
    }

    function displayError(messageElement, message) {
        messageElement.textContent = message;
        messageElement.style.display = 'block'; // メッセージ要素が表示される
    }

    // login form の submit を引き継ぐ
    loginForm.addEventListener('submit', function(e) {
        // default submit action を防止する
        e.preventDefault();

        // エラーメッセージを非表示にする
        loginErrorMessage.style.display = 'none';

        // 入力されたメールアドレスとパスワードを取得する
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // ユーザー名とパスワードが正規表現と一致することを確認する
        if (!validateInput(email, password)) {
            displayError(loginErrorMessage, '無効なメールアドレスまたはパスワード形式');
            return;
        }

        // データを送信するための FormData オブジェクトを作成する
        let formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // AJAXリクエストをlogin.phpに送信する
        fetch('php/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            if (data === "success") {
                // ログイン成功、ledger概要ページへ移動する
                window.location.href = 'ledger.html';
            } else {
                // ログイン失敗、エラーメッセージを表示する
                displayError(loginErrorMessage, data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError(loginErrorMessage, 'ログイン：エラーが発生しました');
        });
    });

    // register form の submit を引き継ぐ
    registerForm.addEventListener('submit', function(e) {
        // default submit action を防止する
        e.preventDefault();

        // エラーメッセージを非表示にする
        registerErrorMessage.style.display = 'none'; 

        // 入力されたデータを取得する
        const email = document.getElementById('register-email').value;
        const nickname = document.getElementById('register-nickname').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            displayError(registerErrorMessage, 'パスワードが確認用パスワードと一致しません');
            return;
        }

        // ユーザー名とパスワードが正規表現と一致することを確認する
        if (!validateInput(email, password, nickname)) {
            displayError(registerErrorMessage, '無効なメールアドレスまたはパスワード形式');
            return;
        }

        // データを送信するための FormData オブジェクトを作成する
        let formData = new FormData();
        formData.append('email', email);
        formData.append('nickname', nickname);
        formData.append('password', password);

        // AJAXリクエストをregister.phpに送信する
        fetch('php/register.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            if (data === "success") {
                // 新規登録成功、成功のメッセージが表示され、自動的にログインtabに切り替わる。
                registerSuccessMessage.textContent = '新規登録できました';
                registerSuccessMessage.style.display = 'block';
                setTimeout(function() {
                    $('.nav-tabs a[href="#login-tab"]').tab('show');
                    registerSuccessMessage.style.display = 'none';
                }, 3000); // 3秒後に自動的に切り替わる
            } else {
                // 新規登録失敗
                displayError(registerErrorMessage, data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError(registerErrorMessage, '新規登録：エラーが発生しました');
        });
    });
});
