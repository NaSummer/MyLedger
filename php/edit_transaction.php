<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION['userid'])) {
    echo json_encode(["success" => false, "error" => "ログインしていません"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['id'])) {
    $transactionId = $_POST['id'];
    $userId = $_SESSION['userid'];
    $type = $_POST['type'];
    $amount = $_POST['amount'];
    $currencyId = $_POST['currency_id'];
    $happenedAt = $_POST['happened_at'];  // 接收UNIX时间戳
    $memo = $_POST['memo'];

    // 准备SQL语句更新交易记录
    $stmt = $conn->prepare("UPDATE transactions SET type=?, amount=?, currency_id=?, happened_at=?, description=? WHERE id=? AND user_id=?");
    $stmt->bind_param("sdiisii", $type, $amount, $currencyId, $happenedAt, $memo, $transactionId, $userId);

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
