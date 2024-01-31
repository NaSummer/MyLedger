<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

if (!isset($_SESSION['userid'])) {
    echo json_encode(["success" => false, "error" => "ログインしていません"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_GET['id'])) {
    $transactionId = $_GET['id'];
    $userId = $_SESSION['userid']; // 获取当前登录用户的ID

    // 删除操作
    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $transactionId, $userId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "error" => "無効なリクエスト"]);
}
?>
