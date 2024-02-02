<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // HTMLインジェクション防止
    $email = htmlspecialchars($_POST['email']);
    $nickname = htmlspecialchars($_POST['nickname']);
    $password = htmlspecialchars($_POST['password']);

    // SQLインジェクション防止
    $email = mysqli_real_escape_string($conn, $email);
    $nickname = mysqli_real_escape_string($conn, $nickname);
    $password = mysqli_real_escape_string($conn, $password);

    // ユーザー名が存在するかどうかを確認
    $checkUserSql = "SELECT id FROM users WHERE email = '$email'";
    $checkResult = $conn->query($checkUserSql);

    if ($checkResult->num_rows > 0) {
        echo "メールアドレスもう存在しています";
    } else {
        // メールアドレスは存在しません、新規登録できます
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $insertSql = "INSERT INTO users (email, nickname, password) VALUES ('$email', '$nickname', '$hashed_password')";

        if ($conn->query($insertSql) === TRUE) {
            echo "success";
        } else {
            echo "新規登録失敗：" . $conn->error;
        }
    }

    $conn->close();
}
?>
