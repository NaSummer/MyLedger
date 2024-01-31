<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // HTMLインジェクション防止
    $email = htmlspecialchars($_POST['email']);
    $password = htmlspecialchars($_POST['password']);

    // SQLインジェクション防止
    $email = htmlspecialchars($_POST['email']);
    $password = mysqli_real_escape_string($conn, $password);

    // SQLでユーザー名とパスワードが一致するか確認
    $sql = "SELECT id, nickname, password FROM users WHERE email = '$email'";
    $result = $conn->query($sql);

    if ($result->num_rows == 1) {
        // 一つユーザー名だけ一致するレコードがあれば、パスワードを確認する
        $row = $result->fetch_assoc();
        if (password_verify($password, $row['password'])) {
            // パスワード一致の場合，セッションをセットアップ
            $_SESSION['loggedin'] = true;
            $_SESSION['userid'] = $row['id'];
            $_SESSION['nickname'] = $row['nickname'];
            echo "success";
        } else {
            echo "間違ったパスワード";
        }
    } elseif ($result->num_rows > 1) {
        // エラー：一致するユーザーが複数ある。
        echo "ログイン異常、管理者に連絡してください";
        // TODO LOG
    } else {
        echo "ユーザー名は存在しません";
    }
    $conn->close();
} else {
    echo "無効なリクエスト";
}
?>
