<?php
session_start();
header('Content-Type: application/json');

// ユーザーログイン時にセッションにユーザー名が保存されていると仮定
if(isset($_SESSION['nickname'])) {
    echo json_encode(["nickname" => $_SESSION['nickname']]);
} else {
    echo json_encode(["nickname" => "未知のユーザー"]);
}
?>